import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import PostCard from '../components/PostCard'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { id: 'all',       label: '✨ All'       },
  { id: 'beach',     label: '🏖️ Beach'     },
  { id: 'city',      label: '🏙️ City'      },
  { id: 'nature',    label: '🌿 Nature'    },
  { id: 'adventure', label: '🧗 Adventure' },
  { id: 'culture',   label: '🏛️ Culture'   },
  { id: 'food',      label: '🍜 Food'      },
]

export default function FeedPage() {
  const [posts,    setPosts]    = useState([])
  const [page,     setPage]     = useState(1)
  const [hasNext,  setHasNext]  = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [category, setCategory] = useState('all')
  const loaderRef = useRef(null)
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const fetchPosts = useCallback(async (pg, cat) => {
    if (loading) return
    setLoading(true)
    try {
      const { data } = await api.get('/api/feed', { params: { page: pg, per_page: 8, category: cat } })
      setPosts(prev => pg === 1 ? data.posts : [...prev, ...data.posts])
      setHasNext(data.has_next)
      setPage(pg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(1, category)
  }, [category])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNext && !loading) {
        fetchPosts(page + 1, category)
      }
    }, { rootMargin: '200px' })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasNext, loading, page, category])

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Category filter — floats above feed */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 px-4
                      bg-gradient-to-b from-bg/90 to-transparent pointer-events-none">
        <div className="flex items-center justify-between mb-2 pointer-events-auto">
          <span className="font-black text-xl text-text-1 tracking-tight">PinTrip</span>
          {user && (
            <button
              onClick={() => navigate('/post/new')}
              className="w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg"
            >
              <Plus size={16} className="text-bg" strokeWidth={3} />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pointer-events-auto">
          {CATEGORIES.map(c => (
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

      {/* Feed */}
      <div className="feed-container flex-1">
        {posts.map((post, i) => (
          <PostCard key={`${post.id}-${i}`} post={post} />
        ))}

        {/* Infinite scroll trigger */}
        {hasNext && (
          <div ref={loaderRef} className="h-24 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="feed-item flex flex-col items-center justify-center gap-4 text-center px-8">
            <span className="text-5xl">🌍</span>
            <p className="text-text-1 font-bold text-xl">No posts yet</p>
            <p className="text-text-3 text-sm">Be the first to pin a location</p>
          </div>
        )}
      </div>
    </div>
  )
}
