import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Map, List, MapPin, GripVertical, Trash2, Pencil, Check } from 'lucide-react'
import api from '../lib/api'
import TripMap from '../components/TripMap'

export default function TripDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [trip,    setTrip]    = useState(null)
  const [view,    setView]    = useState('list')  // 'list' | 'map'
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/trips/${id}`)
      .then(r => { setTrip(r.data.trip); setName(r.data.trip.name) })
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false))
  }, [id])

  const saveTitle = async () => {
    if (!name.trim()) return
    await api.patch(`/api/trips/${id}`, { name: name.trim() })
    setTrip(t => ({ ...t, name: name.trim() }))
    setEditing(false)
  }

  const removeLocation = async (locId) => {
    await api.delete(`/api/trips/${id}/locations/${locId}`)
    setTrip(t => ({ ...t, locations: t.locations.filter(l => l.id !== locId) }))
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-bg">
      <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  )

  if (!trip) return null

  const locations = trip.locations || []
  const hasMap    = locations.some(l => l.post?.lat && l.post?.lng)

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 border-b border-white/6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/trips')}
            className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-text-1" />
          </button>

          {editing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                className="flex-1 bg-transparent border-b border-gold/60 text-text-1 font-bold text-lg outline-none pb-0.5"
              />
              <button onClick={saveTitle} className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Check size={15} className="text-gold" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h1 className="text-text-1 font-black text-xl truncate">{trip.name}</h1>
              <button onClick={() => setEditing(true)} className="flex-shrink-0">
                <Pencil size={14} className="text-text-3" />
              </button>
            </div>
          )}
        </div>

        {/* Stats + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-3 text-xs">
            <MapPin size={12} />
            <span>{locations.length} stops</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white/6 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white/12 text-text-1' : 'text-text-3'
              }`}
            >
              <List size={13} />Plan
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'map' ? 'bg-white/12 text-text-1' : 'text-text-3'
              }`}
            >
              <Map size={13} />Map
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <div className="h-full overflow-y-auto scrollbar-hide px-4 py-4 pb-24">
            {locations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl">📍</span>
                <p className="text-text-1 font-semibold">No stops yet</p>
                <p className="text-text-3 text-sm">Save places from the feed and add them here</p>
                <button onClick={() => navigate('/')} className="mt-2 bg-gold text-bg text-sm font-bold px-6 py-3 rounded-full active:scale-95 transition-transform">
                  Explore feed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc, i) => (
                  <div key={loc.id} className="flex items-center gap-3 bg-card rounded-2xl overflow-hidden">
                    {/* Number badge */}
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0 ml-3">
                      <span className="text-bg text-xs font-black">{i + 1}</span>
                    </div>

                    {/* Image */}
                    <div className="w-14 h-14 flex-shrink-0 my-3 rounded-xl overflow-hidden">
                      {loc.post?.image_url && (
                        <img src={loc.post.image_url} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-3">
                      <p className="text-text-1 font-semibold text-sm truncate">{loc.post?.location_name}</p>
                      <p className="text-text-3 text-xs truncate">{loc.post?.city}{loc.post?.country ? `, ${loc.post.country}` : ''}</p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeLocation(loc.id)}
                      className="w-9 h-9 mr-2 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 active:bg-coral/20 transition-colors"
                    >
                      <Trash2 size={14} className="text-text-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full p-4 pb-24">
            {hasMap ? (
              <TripMap locations={locations} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 bg-surface rounded-2xl text-center px-8">
                <span className="text-4xl">📍</span>
                <p className="text-text-1 font-semibold">No location data</p>
                <p className="text-text-3 text-sm">Posts need GPS coordinates to appear on the map</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
