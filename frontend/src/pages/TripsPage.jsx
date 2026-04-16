import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Map, MapPin, Lock, Globe, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function TripsPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving,  setSaving]  = useState(false)

  const loadTrips = () => {
    if (!user) return
    api.get('/api/trips')
      .then(r => setTrips(r.data.trips))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTrips() }, [user])

  // Re-fetch when page gains focus (e.g. after returning from TripDetail)
  useEffect(() => {
    const onFocus = () => { if (user) loadTrips() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  const create = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post('/api/trips', { name: newName.trim() })
      setTrips(prev => [data.trip, ...prev])
      setNewName('')
      setShowNew(false)
      navigate(`/trips/${data.trip.id}`)
    } finally { setSaving(false) }
  }

  if (!user) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center page-enter">
      <span className="text-5xl">🗺️</span>
      <p className="text-text-1 font-bold text-xl">Plan your trips</p>
      <p className="text-text-3 text-sm">Save places from the feed and build your perfect trip plan with a map.</p>
      <button onClick={() => navigate('/auth')} className="btn-primary mt-2 max-w-xs">
        Sign up — it's free
      </button>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter">
      <div className="px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-text-1 font-black text-2xl">My Trips</h1>
            <p className="text-text-3 text-xs mt-0.5">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-gold text-bg text-xs font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={14} strokeWidth={3} />
            New trip
          </button>
        </div>

        {/* New trip inline form */}
        {showNew && (
          <div className="bg-card rounded-2xl p-4 mb-4 border border-white/10">
            <p className="text-text-1 font-semibold text-sm mb-3">Name your trip</p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="e.g. Italy Summer 2026"
              className="input-dark mb-3"
            />
            <div className="flex gap-2">
              <button onClick={create} disabled={saving} className="btn-primary py-3 text-sm">
                {saving ? 'Creating…' : 'Create trip'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-ghost py-3 px-4">Cancel</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-5xl">✈️</span>
            <p className="text-text-1 font-bold">No trips yet</p>
            <p className="text-text-3 text-sm max-w-xs">
              Save places from the feed and tap "Auto-generate trip" to build your first plan.
            </p>
          </div>
        )}

        {/* Trip cards */}
        <div className="grid grid-cols-2 gap-3">
          {trips.map(t => (
            <div key={t.id} className="relative bg-card rounded-2xl overflow-hidden">
              <button
                onClick={() => navigate(`/trips/${t.id}`)}
                className="w-full text-left active:scale-95 transition-transform"
              >
                <div className="relative w-full aspect-square">
                  {t.cover_image_url
                    ? <img src={t.cover_image_url} className="w-full h-full object-cover" alt="" />
                    : (
                      <div className="w-full h-full bg-surface flex items-center justify-center">
                        <Map size={32} className="text-text-3" />
                      </div>
                    )
                  }
                  <div className="absolute top-2 right-2">
                    {t.is_public
                      ? <Globe size={12} className="text-white/60" />
                      : <Lock size={12} className="text-white/60" />
                    }
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-text-1 font-semibold text-sm truncate">{t.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={10} className="text-text-3" />
                      <span className="text-text-3 text-xs">{t.location_count} stops</span>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!window.confirm(`Delete "${t.name}"?`)) return
                        await api.delete(`/api/trips/${t.id}`)
                        setTrips(prev => prev.filter(x => x.id !== t.id))
                      }}
                      className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center active:bg-coral/20 transition-colors"
                    >
                      <Trash2 size={13} className="text-text-3" />
                    </button>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
