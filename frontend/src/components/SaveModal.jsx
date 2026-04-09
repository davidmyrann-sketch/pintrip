import { useState, useEffect } from 'react'
import { X, Plus, Map, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SaveModal({ post, onClose, onSaved }) {
  const [trips,   setTrips]   = useState([])
  const [name,    setName]    = useState('')
  const [creating, setCreate] = useState(false)
  const [loading,  setLoad]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/trips').then(r => setTrips(r.data.trips)).catch(() => {})
  }, [])

  const createTrip = async () => {
    if (!name.trim()) return
    setLoad(true)
    try {
      const { data } = await api.post('/api/trips', { name: name.trim() })
      onSaved(data.trip.id)
      navigate(`/trips/${data.trip.id}`)
    } finally { setLoad(false) }
  }

  const autoTrip = async () => {
    setLoad(true)
    try {
      const tripName = `My Trip${Math.floor(Math.random() * 900 + 100)}`
      const { data } = await api.post('/api/trips', { name: tripName, from_saves: true })
      onSaved(data.trip.id)
      navigate(`/trips/${data.trip.id}`)
    } finally { setLoad(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text-1 font-bold text-lg">Save to trip</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <X size={16} className="text-text-2" />
          </button>
        </div>

        {/* Auto-generate from saves */}
        <button
          onClick={autoTrip}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gold/10 border border-gold/30 mb-4 active:scale-98 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-gold" />
          </div>
          <div className="text-left">
            <p className="text-text-1 font-semibold text-sm">Auto-generate trip</p>
            <p className="text-text-3 text-xs mt-0.5">Create a trip from all your saves</p>
          </div>
        </button>

        {/* Existing trips */}
        {trips.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto scrollbar-hide space-y-2">
            {trips.map(t => (
              <button
                key={t.id}
                onClick={() => onSaved(t.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/8 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                  {t.cover_image_url
                    ? <img src={t.cover_image_url} className="w-full h-full object-cover" alt="" />
                    : <Map size={18} className="text-text-3 m-auto mt-2.5" />
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

        {/* Create new */}
        {creating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTrip()}
              placeholder="Trip name (e.g. Italy Summer 2026)"
              className="input-dark flex-1"
            />
            <button
              onClick={createTrip}
              disabled={loading}
              className="px-4 bg-gold text-bg text-sm font-bold rounded-xl active:scale-95 transition-transform"
            >
              {loading ? '…' : 'Create'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreate(true)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Plus size={16} className="text-text-2" />
            </div>
            <span className="text-text-2 text-sm font-medium">Create new trip</span>
          </button>
        )}
      </div>
    </div>
  )
}
