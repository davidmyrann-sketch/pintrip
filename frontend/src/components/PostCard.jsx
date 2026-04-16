import { useState, useRef } from 'react'
import { Heart, Bookmark, MessageCircle, MapPin, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import SaveModal from './SaveModal'

const PRICE = ['', '$', '$$', '$$$', '$$$$']
const CATEGORY_COLOR = {
  beach: 'bg-blue-500/20 text-blue-300',
  city:  'bg-purple/20 text-purple-300',
  food:  'bg-orange-500/20 text-orange-300',
  adventure: 'bg-green-500/20 text-green-300',
  culture:   'bg-pink-500/20 text-pink-300',
  nature:    'bg-emerald-500/20 text-emerald-300',
}

export default function PostCard({ post: initialPost, style }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post,       setPost]       = useState(initialPost)
  const [likeAnim,   setLikeAnim]   = useState(false)
  const [saveAnim,   setSaveAnim]   = useState(false)
  const [showSave,   setShowSave]   = useState(false)
  const lastTap      = useRef(0)
  const doubleTapRef = useRef(null)

  const toggleLike = async () => {
    if (!user) { navigate('/auth'); return }
    setLikeAnim(false)
    requestAnimationFrame(() => setLikeAnim(true))
    const method = post.liked ? 'delete' : 'post'
    try {
      const { data } = await api[method](`/api/posts/${post.id}/like`)
      setPost(p => ({ ...p, liked: data.liked, like_count: data.like_count }))
    } catch {}
    setTimeout(() => setLikeAnim(false), 400)
  }

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (!post.liked) toggleLike()
      if (doubleTapRef.current) {
        doubleTapRef.current.classList.remove('heart-pop')
        void doubleTapRef.current.offsetWidth
        doubleTapRef.current.classList.add('heart-pop')
      }
    }
    lastTap.current = now
  }

  const handleSave = async (tripId) => {
    if (!user) { navigate('/auth'); return }
    setSaveAnim(false)
    requestAnimationFrame(() => setSaveAnim(true))
    try {
      const { data } = await api.post(`/api/posts/${post.id}/save`, tripId ? { trip_id: tripId } : {})
      setPost(p => ({ ...p, saved: data.saved, save_count: data.save_count }))
      if (data.suggest_trip) {
        setShowSave(true)
      }
    } catch {}
    setTimeout(() => setSaveAnim(false), 450)
  }

  const catColor = CATEGORY_COLOR[post.category] || 'bg-white/10 text-text-2'

  return (
    <div className="feed-item" style={style}>
      {/* Full-bleed image */}
      <div className="absolute inset-0" onClick={handleDoubleTap}>
        <img
          src={post.image_url}
          alt={post.location_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 img-overlay" />
      </div>

      {/* Double-tap heart overlay */}
      <div
        ref={doubleTapRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <Heart size={90} className="text-white/0 heart-pop:text-white/80 transition-colors" fill="currentColor" />
      </div>

      {/* Top bar: category + rating */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <span className={`pill ${catColor} capitalize`}>
          {post.category}
        </span>
        {post.rating && (
          <span className="pill bg-black/40 text-text-1 backdrop-blur-sm">
            <Star size={11} className="text-gold" fill="currentColor" />
            {post.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${likeAnim ? 'heart-pop' : ''}`}>
            <Heart
              size={22}
              strokeWidth={post.liked ? 0 : 1.8}
              className={post.liked ? 'text-coral' : 'text-white'}
              fill={post.liked ? 'currentColor' : 'none'}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{post.like_count}</span>
        </button>

        {/* Save */}
        <button
          onClick={() => {
            if (!user) { navigate('/auth'); return }
            if (!post.saved) {
              handleSave(null)
            } else {
              setShowSave(true)
            }
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${saveAnim ? 'save-bounce' : ''}`}>
            <Bookmark
              size={22}
              strokeWidth={post.saved ? 0 : 1.8}
              className={post.saved ? 'text-mint' : 'text-white'}
              fill={post.saved ? 'currentColor' : 'none'}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{post.save_count}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* User */}
        <div className="flex items-center gap-2 mb-3">
          {post.user?.avatar_url && (
            <img src={post.user.avatar_url} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
          )}
          <span className="text-white text-sm font-semibold drop-shadow">{post.user?.name}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin size={14} className="text-gold flex-shrink-0" />
          <span className="text-white text-xl font-bold leading-tight drop-shadow">
            {post.location_name}
          </span>
        </div>
        <p className="text-white/75 text-xs">{post.city}{post.country ? `, ${post.country}` : ''}</p>

        {/* Caption */}
        {post.caption && (
          <p className="text-white/80 text-sm mt-2 leading-relaxed line-clamp-2 drop-shadow">
            {post.caption}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {post.price_level && (
            <span className="pill bg-black/40 backdrop-blur-sm text-gold">
              {PRICE[post.price_level]}
            </span>
          )}
          {post.weather && (
            <span className="pill bg-black/40 backdrop-blur-sm text-white/80">
              {post.weather}
            </span>
          )}
          {post.duration_hours && (
            <span className="pill bg-black/40 backdrop-blur-sm text-white/80">
              ⏱ {post.duration_hours % 1 === 0 ? post.duration_hours : post.duration_hours}h
            </span>
          )}
          {post.cost_nok && (
            <span className="pill bg-black/40 backdrop-blur-sm text-white/80">
              {post.cost_nok.toLocaleString('nb-NO')} kr
            </span>
          )}
          {post.affiliate_url && (
            <a
              href={post.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="pill bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-colors"
            >
              Book →
            </a>
          )}
        </div>
      </div>

      {showSave && (
        <SaveModal
          post={post}
          onClose={() => setShowSave(false)}
          onSaved={(tid) => { handleSave(tid); setShowSave(false) }}
        />
      )}
    </div>
  )
}
