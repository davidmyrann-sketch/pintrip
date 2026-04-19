import { useState, useEffect } from 'react'
import { X, Plus, Map, Sparkles, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function TripPickerSheet({ post, onClose, onDone }) {
  const navigate               = useNavigate()
  const [trips,   setTrips]    = useState([])
  const [suggest, setSuggest]  = useState(null)
  const [creating, setCreating] = useState(false)
  const [name,    setName]     = useState('')
  const [loading, setLoading]  = useState(false)
  const [done,    setDone]     = useState(null)   // trip name after success

  useEffect(() => {
    api.get('/api/trips').then(r => setTrips(r.data.trips || [])).catch(() => {})
    api.post('/api/ai/suggest-trip', { post_id: post.id })
      .then(r => setSuggest(r.data))
      .catch(() => {})
  }, [])

  const addToTrip = async (tripId, tripName) => {
    setLoading(true)
    try {
      await api.post(`/api/trips/${tripId}/locations`, { post_id: post.id })
      setDone(tripName)
      setTimeout(() => { onDone?.(); navigate(`/trips/${tripId}`) }, 900)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const createAndAdd = async (tripName, description) => {
    if (!tripName.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/trips', { name: tripName.trim(), description: description || '' })
      await api.post(`/api/trips/${data.trip.id}/locations`, { post_id: post.id })
      setDone(tripName.trim())
      setTimeout(() => { onDone?.(); navigate(`/trips/${data.trip.id}`) }, 900)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div
        className="modal-sheet max-h-[80vh] overflow-y-auto scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text-1 font-bold text-lg">Add to trip</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <X size={16} className="text-text-2" />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
              <Check size={28} className="text-gold" strokeWidth={2.5} />
            </div>
            <p className="text-text-1 font-semibold">Added to "{done}"</p>
            <p className="text-text-3 text-sm">Opening your trip…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* AI suggestion */}
            {suggest && (
              <button
                onClick={() => createAndAdd(suggest.name, suggest.description)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gold/10 border border-gold/30 active:scale-98 transition-transform disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-text-1 font-semibold text-sm">Generate with AI</p>
                  <p className="text-gold text-xs mt-0.5">"{suggest.name}"</p>
                </div>
              </button>
            )}

            {/* Existing trips */}
            {trips.length > 0 && (
              <div className="space-y-2">
                <p className="text-text-3 text-xs font-medium px-1">My trips</p>
                {trips.map(t => (
                  <button
                    key={t.id}
                    onClick={() => addToTrip(t.id, t.name)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/8 transition-colors disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface flex items-center justify-center">
                      {t.cover_image_url
                        ? <img src={t.cover_image_url} className="w-full h-full object-cover" alt="" />
                        : <Map size={18} className="text-text-3" />
                      }
                    </div>
                    <div className="text-left">
                      <p className="text-text-1 font-medium text-sm">{t.name}</p>
                      <p className="text-text-3 text-xs">{t.location_count} stops</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Create new trip */}
            {creating ? (
              <div className="flex gap-2 pt-1">
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createAndAdd(name, '')}
                  placeholder="Trip name (e.g. Italy Summer 2026)"
                  className="input-dark flex-1"
                />
                <button
                  onClick={() => createAndAdd(name, '')}
                  disabled={loading || !name.trim()}
                  className="px-4 bg-gold text-bg text-sm font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? '…' : 'Create'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/8 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus size={16} className="text-text-2" />
                </div>
                <span className="text-text-2 text-sm font-medium">Create new trip manually</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
