import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Settings, LogOut, Download, Trash2, Grid3X3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function ProfilePage() {
  const { user, logout }  = useAuth()
  const { username }      = useParams()
  const navigate          = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setSettings] = useState(false)

  const targetUsername = username || user?.username

  useEffect(() => {
    if (!targetUsername) { setLoading(false); return }
    api.get(`/api/profile/${targetUsername}`)
      .then(r => { setProfile(r.data.user); setPosts(r.data.posts) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [targetUsername])

  const handleExport = async () => {
    const res = await fetch('/api/gdpr/export', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pt_token')}` }
    })
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'pintrip-data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return
    await api.delete('/api/gdpr/delete')
    logout()
    navigate('/')
  }

  if (!user && !username) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center page-enter">
      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-2">👤</div>
      <p className="text-text-1 font-bold text-xl">Your profile</p>
      <p className="text-text-3 text-sm">Sign in to see your posts, trips and saved places.</p>
      <button onClick={() => navigate('/auth')} className="btn-primary max-w-xs mt-2">Sign in</button>
      <button onClick={() => navigate('/auth?mode=register')} className="text-text-3 text-sm underline">Create account</button>
    </div>
  )

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-bg">
      <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  )

  const isOwn = user?.username === targetUsername

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter">
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-coral flex items-center justify-center overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                : <span className="text-bg font-black text-xl">{(profile?.name || '?')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="text-text-1 font-black text-lg">{profile?.name}</p>
              <p className="text-text-3 text-xs">@{profile?.username}</p>
            </div>
          </div>
          {isOwn && (
            <button
              onClick={() => setSettings(!showSettings)}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center"
            >
              <Settings size={17} className="text-text-2" />
            </button>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && <p className="text-text-2 text-sm mb-4 leading-relaxed">{profile.bio}</p>}

        {/* Stats */}
        <div className="flex gap-6 mb-5">
          {[
            { label: 'Posts',  val: profile?.post_count  || 0 },
            { label: 'Trips',  val: profile?.trip_count  || 0 },
          ].map(s => (
            <div key={s.label}>
              <p className="text-text-1 font-black text-xl">{s.val}</p>
              <p className="text-text-3 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings panel */}
        {isOwn && showSettings && (
          <div className="bg-card rounded-2xl p-4 mb-5 border border-white/8 space-y-2">
            <p className="text-text-3 text-xs font-semibold uppercase tracking-wider mb-3">Account</p>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/8 transition-colors"
            >
              <LogOut size={16} className="text-text-2" />
              <span className="text-text-1 text-sm font-medium">Sign out</span>
            </button>
            <p className="text-text-3 text-xs font-semibold uppercase tracking-wider pt-2 mb-2">GDPR / Privacy</p>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/8 transition-colors"
            >
              <Download size={16} className="text-mint" />
              <span className="text-text-1 text-sm font-medium">Export my data</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-coral/10 active:bg-coral/20 transition-colors"
            >
              <Trash2 size={16} className="text-coral" />
              <span className="text-coral text-sm font-medium">Delete account</span>
            </button>
          </div>
        )}

        {/* Post grid */}
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 size={14} className="text-text-3" />
          <p className="text-text-3 text-xs font-semibold uppercase tracking-wider">Posts</p>
        </div>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">📸</span>
            <p className="text-text-3 text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(p => (
              <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-surface">
                <img src={p.image_url} className="w-full h-full object-cover" alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
