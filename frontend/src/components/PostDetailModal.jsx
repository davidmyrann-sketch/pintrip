import { useState } from 'react'
import { X, Pencil, Check, MapPin, Star, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

const CATEGORIES   = ['beach', 'city', 'food', 'adventure', 'culture', 'nature']
const WEATHER_OPTS = ['☀️ Sunny', '⛅ Partly cloudy', '🌧️ Rainy', '❄️ Snowy', '🌫️ Foggy', '🌬️ Windy', '🌩️ Stormy']
const PRICE        = ['', '$', '$$', '$$$', '$$$$']

export default function PostDetailModal({ post: initialPost, onClose, onUpdated }) {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [post, setPost]     = useState(initialPost)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  // edit fields
  const [caption,       setCaption]       = useState(post.caption || '')
  const [locationName,  setLocationName]  = useState(post.location_name || '')
  const [category,      setCategory]      = useState(post.category || 'city')
  const [weather,       setWeather]       = useState(post.weather || '')
  const [durationHours, setDurationHours] = useState(post.duration_hours || '')
  const [costNok,       setCostNok]       = useState(post.cost_nok || '')
  const [rating,        setRating]        = useState(post.rating || '')
  const [priceLevel,    setPriceLevel]    = useState(post.price_level || '')

  const isOwn = user?.username === post.user?.username

  const saveEdit = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/posts/${post.id}`, {
        caption:        caption.trim() || null,
        location_name:  locationName.trim(),
        category,
        weather:        weather || null,
        duration_hours: durationHours ? parseFloat(durationHours) : null,
        cost_nok:       costNok ? parseInt(costNok) : null,
        rating:         rating ? parseFloat(rating) : null,
        price_level:    priceLevel ? parseInt(priceLevel) : null,
      })
      setPost(data.post)
      onUpdated?.(data.post)
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="w-full sm:max-w-[520px] bg-[#13131f] rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ maxHeight: '95dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <button
            className="flex items-center gap-2.5"
            onClick={() => { onClose(); navigate(`/profile/${post.user?.username}`) }}
          >
            {post.user?.avatar_url
              ? <img src={post.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-coral flex items-center justify-center text-bg font-black text-xs">{(post.user?.name || '?')[0].toUpperCase()}</div>
            }
            <div>
              <p className="text-text-1 text-sm font-bold leading-tight">{post.user?.name}</p>
              <p className="text-text-3 text-xs">@{post.user?.username}</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {isOwn && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
              >
                <Pencil size={14} className="text-text-2" />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
              <X size={16} className="text-text-2" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(95dvh - 80px)' }}>
          {/* Image */}
          <div className="aspect-square w-full bg-surface">
            <img src={post.image_url} className="w-full h-full object-cover" alt="" />
          </div>

          <div className="px-5 py-4 space-y-4 pb-8">

            {editing ? (
              /* ── Edit mode ── */
              <div className="space-y-4">
                <div>
                  <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Location</label>
                  <input
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-text-1 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Caption</label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={3}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-text-1 text-sm focus:outline-none focus:border-gold/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${category === c ? 'bg-gold text-bg' : 'bg-white/6 text-text-2'}`}
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Weather</label>
                    <div className="relative">
                      <select value={weather} onChange={e => setWeather(e.target.value)}
                        className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm appearance-none focus:outline-none focus:border-gold/50"
                      >
                        <option value="">—</option>
                        {WEATHER_OPTS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Duration (hrs)</label>
                    <input type="number" min="0" step="0.5" value={durationHours} onChange={e => setDurationHours(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Cost (NOK)</label>
                    <input type="number" min="0" value={costNok} onChange={e => setCostNok(e.target.value)}
                      placeholder="e.g. 350"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Rating (1–5)</label>
                    <input type="number" min="1" max="5" step="0.1" value={rating} onChange={e => setRating(e.target.value)}
                      placeholder="e.g. 4.5"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-3 text-text-1 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {saving ? '…' : <><Check size={15} /> Save changes</>}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-3 rounded-xl bg-white/6 text-text-2 text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <>
                <div>
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-1 font-bold text-lg leading-tight">{post.location_name}</p>
                      {(post.city || post.country) && (
                        <p className="text-text-3 text-xs mt-0.5">{post.city}{post.country ? `, ${post.country}` : ''}</p>
                      )}
                    </div>
                  </div>
                </div>

                {post.caption && (
                  <p className="text-text-2 text-sm leading-relaxed">{post.caption}</p>
                )}

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2">
                  {post.category && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-text-2 text-xs capitalize">{post.category}</span>
                  )}
                  {post.rating && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-text-2 text-xs flex items-center gap-1">
                      <Star size={11} className="text-gold" fill="currentColor" />{post.rating.toFixed(1)}
                    </span>
                  )}
                  {post.price_level && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-gold text-xs">{PRICE[post.price_level]}</span>
                  )}
                  {post.weather && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-text-2 text-xs">{post.weather}</span>
                  )}
                  {post.duration_hours && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-text-2 text-xs">⏱ {post.duration_hours}h</span>
                  )}
                  {post.cost_nok && (
                    <span className="px-3 py-1 rounded-full bg-white/8 text-text-2 text-xs">{post.cost_nok.toLocaleString('nb-NO')} kr</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
