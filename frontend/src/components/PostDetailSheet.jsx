import { useState } from 'react'
import { ArrowLeft, MapPin, Star, Clock, Banknote, ExternalLink, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TripPickerSheet from './TripPickerSheet'

const PRICE = ['', '$', '$$', '$$$', '$$$$']
const CATEGORY_COLOR = {
  beach: 'bg-blue-500/20 text-blue-300',
  city:  'bg-purple-500/20 text-purple-300',
  food:  'bg-orange-500/20 text-orange-300',
  adventure: 'bg-green-500/20 text-green-300',
  culture:   'bg-pink-500/20 text-pink-300',
  nature:    'bg-emerald-500/20 text-emerald-300',
}

export default function PostDetailSheet({ post, onClose }) {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const catColor = CATEGORY_COLOR[post.category] || 'bg-white/10 text-text-2'

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative flex-shrink-0">
        <img
          src={post.image_url}
          alt={post.location_name}
          className="w-full aspect-[4/5] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Category badge */}
        {post.category && (
          <span className={`absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-4 pill ${catColor} capitalize`}>
            {post.category}
          </span>
        )}

        {/* Location overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin size={14} className="text-gold flex-shrink-0" />
            <span className="text-white font-bold text-xl leading-tight drop-shadow">
              {post.location_name}
            </span>
          </div>
          <p className="text-white/70 text-sm ml-5">
            {[post.city, post.country].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-4 pb-32 space-y-4">

          {/* Author */}
          <button
            className="flex items-center gap-2.5"
            onClick={() => { onClose(); navigate(`/profile/${post.user?.username}`) }}
          >
            {post.user?.avatar_url
              ? <img src={post.user.avatar_url} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="" />
              : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-coral flex items-center justify-center text-bg font-black text-sm">
                  {(post.user?.name || '?')[0].toUpperCase()}
                </div>
            }
            <div className="text-left">
              <p className="text-text-1 font-semibold text-sm">{post.user?.name}</p>
              <p className="text-text-3 text-xs">@{post.user?.username}</p>
            </div>
          </button>

          {/* Caption */}
          {post.caption && (
            <p className="text-text-2 text-sm leading-relaxed">{post.caption}</p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {post.rating && (
              <span className="pill bg-white/8 text-text-1">
                <Star size={11} className="text-gold" fill="currentColor" />
                {post.rating.toFixed(1)}
              </span>
            )}
            {post.price_level && (
              <span className="pill bg-white/8 text-gold">{PRICE[post.price_level]}</span>
            )}
            {post.weather && (
              <span className="pill bg-white/8 text-text-2">{post.weather}</span>
            )}
            {post.duration_hours && (
              <span className="pill bg-white/8 text-text-2">
                <Clock size={11} />
                {post.duration_hours < 24
                  ? `${post.duration_hours}h`
                  : `${Math.round(post.duration_hours / 24)}d`}
              </span>
            )}
            {post.cost_nok && (
              <span className="pill bg-white/8 text-text-2">
                <Banknote size={11} />
                {post.cost_nok.toLocaleString()} kr
              </span>
            )}
          </div>

          {/* Affiliate link */}
          {post.affiliate_url && (
            <a
              href={post.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gold text-sm font-medium"
            >
              <ExternalLink size={14} />
              Book this experience
            </a>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-bg to-transparent">
        <button
          onClick={() => user ? setShowPicker(true) : navigate('/auth')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add to trip
        </button>
      </div>

      {/* Trip picker */}
      {showPicker && (
        <TripPickerSheet
          post={post}
          onClose={() => setShowPicker(false)}
          onDone={onClose}
        />
      )}
    </div>
  )
}
