import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Settings, LogOut, Download, Trash2, Grid3X3, Plus, MoreVertical, Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import CreatePostModal  from '../components/CreatePostModal'
import PostDetailModal  from '../components/PostDetailModal'

export default function ProfilePage() {
  const { user, logout }  = useAuth()
  const { username }      = useParams()
  const navigate          = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setSettings]   = useState(false)
  const [showCreate,  setShowCreate]  = useState(false)
  const [menuPostId,   setMenuPostId]   = useState(null)
  const [detailPost,   setDetailPost]   = useState(null)
  const avatarInputRef = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const img = new Image()
      img.onload = async () => {
        const SIZE = 300
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx  = (img.width  - min) / 2
        const sy  = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
        const base64 = canvas.toDataURL('image/jpeg', 0.85)
        const { data } = await api.patch('/api/profile/me', { avatar_url: base64 })
        setProfile(data.user)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

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
    <>
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter">
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold to-coral flex items-center justify-center overflow-hidden"
              onClick={() => isOwn && avatarInputRef.current?.click()}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                : <span className="text-bg font-black text-xl">{(profile?.name || '?')[0].toUpperCase()}</span>
              }
              {isOwn && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </div>
              )}
            </div>
            {isOwn && (
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            )}
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

        {/* Post grid header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Grid3X3 size={14} className="text-text-3" />
            <p className="text-text-3 text-xs font-semibold uppercase tracking-wider">Posts</p>
          </div>
          {isOwn && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-bg text-xs font-bold"
            >
              <Plus size={13} />
              New post
            </button>
          )}
        </div>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">📸</span>
            <p className="text-text-3 text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(p => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface">
                <img
                  src={p.image_url}
                  className="w-full h-full object-cover cursor-pointer"
                  alt=""
                  loading="lazy"
                  onClick={() => !menuPostId && setDetailPost(p)}
                />
                {isOwn && (
                  <>
                    <button
                      onClick={() => setMenuPostId(menuPostId === p.id ? null : p.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <MoreVertical size={12} className="text-white" />
                    </button>
                    {menuPostId === p.id && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this post?')) return
                            await api.delete(`/api/posts/${p.id}`)
                            setPosts(prev => prev.filter(x => x.id !== p.id))
                            setMenuPostId(null)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral text-white text-xs font-bold"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        <button
                          onClick={() => setMenuPostId(null)}
                          className="text-white/60 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {showCreate && (
      <CreatePostModal
        onClose={() => setShowCreate(false)}
        onCreated={(newPost) => setPosts(prev => [newPost, ...prev])}
      />
    )}
    {detailPost && (
      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onUpdated={(updated) => {
          setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
          setDetailPost(updated)
        }}
      />
    )}
    </>
  )
}
