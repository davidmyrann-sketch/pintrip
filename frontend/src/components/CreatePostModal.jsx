import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, MapPin, ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react'
import api from '../lib/api'

const CATEGORIES = ['beach', 'city', 'food', 'adventure', 'culture', 'nature']
const WEATHER_OPTIONS = ['☀️ Sunny', '⛅ Partly cloudy', '🌧️ Rainy', '❄️ Snowy', '🌫️ Foggy', '🌬️ Windy', '🌩️ Stormy']

export default function CreatePostModal({ onClose, onCreated }) {
  const [mediaItems, setMediaItems]   = useState([])   // [{url, file, preview}]
  const [locationName, setLocationName] = useState('')
  const [city, setCity]               = useState('')
  const [country, setCountry]         = useState('')
  const [lat, setLat]                 = useState(null)
  const [lng, setLng]                 = useState(null)
  const [geocodeResults, setGeocodeResults] = useState([])
  const [geocoding, setGeocoding]     = useState(false)
  const [caption, setCaption]         = useState('')
  const [category, setCategory]       = useState('city')
  const [weather, setWeather]         = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [costNok, setCostNok]         = useState('')
  const [rating, setRating]           = useState('')
  const [priceLevel, setPriceLevel]   = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const [mapboxToken, setMapboxToken]   = useState(import.meta.env.VITE_MAPBOX_TOKEN || '')

  const fileInputRef = useRef(null)
  const geocodeTimer = useRef(null)

  useEffect(() => {
    if (!mapboxToken) {
      api.get('/api/config').then(r => setMapboxToken(r.data.mapbox_token || '')).catch(() => {})
    }
  }, [])

  const handleFiles = useCallback(async (files) => {
    const allowed = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!allowed.length) return

    for (const file of allowed) {
      const preview = URL.createObjectURL(file)
      const tempId  = Math.random().toString(36).slice(2)
      setMediaItems(prev => [...prev, { tempId, preview, url: null, uploading: true }])
      setUploadingIdx(tempId)

      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setMediaItems(prev =>
          prev.map(m => m.tempId === tempId ? { ...m, url: data.url, uploading: false } : m)
        )
      } catch {
        setMediaItems(prev => prev.filter(m => m.tempId !== tempId))
      }
      setUploadingIdx(null)
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeMedia = (tempId) => {
    setMediaItems(prev => prev.filter(m => m.tempId !== tempId))
  }

  const geocode = async (query) => {
    if (!mapboxToken || query.length < 2) { setGeocodeResults([]); return }
    setGeocoding(true)
    try {
      let proximity = ''
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2000 })
        )
        proximity = `&proximity=${pos.coords.longitude},${pos.coords.latitude}`
      } catch {}

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?access_token=${mapboxToken}&types=poi,place,locality,neighborhood,address&limit=8${proximity}`
      )
      const data = await res.json()
      setGeocodeResults(data.features || [])
    } catch {}
    setGeocoding(false)
  }

  const handleLocationInput = (val) => {
    setLocationName(val)
    setLat(null); setLng(null)
    clearTimeout(geocodeTimer.current)
    geocodeTimer.current = setTimeout(() => geocode(val), 400)
  }

  const selectPlace = (feature) => {
    const [lng, lat] = feature.center
    setLat(lat)
    setLng(lng)
    setLocationName(feature.text || feature.place_name)
    const ctx = feature.context || []
    const placeCtx = ctx.find(c => c.id.startsWith('place.'))
    const countryCtx = ctx.find(c => c.id.startsWith('country.'))
    setCity(placeCtx?.text || '')
    setCountry(countryCtx?.text || '')
    setGeocodeResults([])
  }

  const valid = mediaItems.length > 0
    && mediaItems.every(m => !m.uploading)
    && locationName.trim()

  const handleSubmit = async () => {
    if (!valid) { setError('Add at least one photo and pick a location from the list.'); return }
    setError('')
    setSubmitting(true)
    try {
      const urls = mediaItems.map(m => m.url)
      const { data } = await api.post('/api/posts', {
        image_url:      urls[0],
        media_urls:     urls,
        caption:        caption.trim() || undefined,
        location_name:  locationName.trim(),
        city:           city || undefined,
        country:        country || undefined,
        lat:            lat ?? undefined,
        lng:            lng ?? undefined,
        category,
        weather:        weather || undefined,
        duration_hours: durationHours ? parseFloat(durationHours) : undefined,
        cost_nok:       costNok ? parseInt(costNok) : undefined,
        rating:         rating ? parseFloat(rating) : undefined,
        price_level:    priceLevel ? parseInt(priceLevel) : undefined,
      })
      onCreated(data.post)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full sm:max-w-[600px] bg-[#13131f] rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <p className="text-text-1 font-bold text-base">New post</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <X size={16} className="text-text-2" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 130px)' }}>
          <div className="px-5 py-4 space-y-5">

            {/* Media upload area */}
            <div>
              <div
                className="border-2 border-dashed border-white/15 rounded-2xl p-5 text-center cursor-pointer hover:border-gold/40 transition-colors bg-white/3"
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={22} className="text-text-3 mx-auto mb-2" />
                <p className="text-text-2 text-sm font-medium">Drag & drop or tap to upload</p>
                <p className="text-text-3 text-xs mt-1">Photos or videos</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />

              {/* Media preview grid */}
              {mediaItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {mediaItems.map((m, i) => (
                    <div key={m.tempId} className="relative aspect-square rounded-xl overflow-hidden bg-surface">
                      <img src={m.preview} className="w-full h-full object-cover" alt="" />
                      {m.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                      )}
                      {i === 0 && !m.uploading && (
                        <span className="absolute top-1.5 left-1.5 bg-gold text-bg text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          Cover
                        </span>
                      )}
                      <button
                        onClick={() => removeMedia(m.tempId)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <Trash2 size={11} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center hover:border-gold/40 transition-colors"
                  >
                    <Plus size={20} className="text-text-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Location picker */}
            <div className="relative">
              <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Location *</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
                <input
                  value={locationName}
                  onChange={e => handleLocationInput(e.target.value)}
                  placeholder="Search for a place…"
                  className="w-full bg-white/6 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-gold/50"
                />
                {geocoding && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 animate-spin" />
                )}
              </div>
              {lat !== null && (
                <p className="text-mint text-xs mt-1">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</p>
              )}
              {geocodeResults.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {geocodeResults.map(f => {
                    const category = f.properties?.category || f.place_type?.[0] || ''
                    return (
                      <button
                        key={f.id}
                        onClick={() => selectPlace(f)}
                        className="w-full text-left px-4 py-3 hover:bg-white/6 border-b border-white/6 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-text-1 text-sm font-medium flex-1">{f.text}</p>
                          {category && (
                            <span className="text-text-3 text-[10px] capitalize shrink-0">{category.split(',')[0]}</span>
                          )}
                        </div>
                        <p className="text-text-3 text-xs truncate mt-0.5">{f.place_name}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Share your experience…"
                rows={3}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-gold/50 resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                      category === c
                        ? 'bg-gold text-bg'
                        : 'bg-white/6 text-text-2 hover:bg-white/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional extras */}
            <div className="grid grid-cols-2 gap-3">
              {/* Weather */}
              <div>
                <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Weather</label>
                <div className="relative">
                  <select
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm appearance-none focus:outline-none focus:border-gold/50"
                  >
                    <option value="">— optional —</option>
                    {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Duration (hrs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={durationHours}
                  onChange={e => setDurationHours(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Cost (NOK)</label>
                <input
                  type="number"
                  min="0"
                  value={costNok}
                  onChange={e => setCostNok(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Rating (1–5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8">
          {error && <p className="text-coral text-xs mb-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !valid}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Posting…' : 'Share post'}
          </button>
        </div>
      </div>
    </div>
  )
}
