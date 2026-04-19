import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Star, MapPin } from 'lucide-react'
import api from '../lib/api'
import PostDetailSheet from '../components/PostDetailSheet'

const CATS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'beach',    label: '🏖️ Beach'    },
  { id: 'city',     label: '🏙️ City'     },
  { id: 'nature',   label: '🌿 Nature'   },
  { id: 'adventure',label: '🧗 Adventure'},
  { id: 'culture',  label: '🏛️ Culture'  },
  { id: 'food',     label: '🍜 Food'     },
]

function PostThumb({ post, onClick }) {
  return (
    <button
      onClick={() => onClick(post)}
      className="relative aspect-square rounded-xl overflow-hidden bg-surface active:scale-95 transition-transform"
    >
      <img src={post.image_url} className="w-full h-full object-cover" alt="" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5">
        <p className="text-white text-xs font-semibold truncate leading-tight">{post.location_name}</p>
      </div>
      {post.rating && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
          <Star size={8} className="text-gold" fill="currentColor" />
          <span className="text-white text-[10px] font-bold">{post.rating.toFixed(1)}</span>
        </div>
      )}
    </button>
  )
}

export default function SearchPage() {
  const [q,         setQ]         = useState('')
  const [category,  setCategory]  = useState('trending')
  const [posts,     setPosts]     = useState([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState(null)

  const doSearch = useCallback(async (query, cat) => {
    setLoading(true)
    try {
      const params = {}
      if (query) params.q = query
      if (cat && cat !== 'trending') params.category = cat
      const { data } = await api.get('/api/search', { params })
      setPosts(data.posts)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(q, category), 300)
    return () => clearTimeout(t)
  }, [q, category])

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      {/* Search header */}
      <div className="flex-shrink-0 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <h1 className="text-text-1 font-black text-2xl mb-3">Explore</h1>

        {/* Search input */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search destinations, cities…"
            className="input-dark pl-10 pr-10"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={14} className="text-text-3" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`cat-pill flex-shrink-0 ${category === c.id ? 'cat-pill-active' : 'cat-pill-inactive'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">🌐</span>
            <p className="text-text-1 font-semibold">No results</p>
            <p className="text-text-3 text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map(p => (
              <PostThumb key={p.id} post={p} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PostDetailSheet post={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
