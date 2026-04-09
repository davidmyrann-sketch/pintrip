import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function GdprBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('pt_cookie_ok')
    if (!accepted) setVisible(true)
  }, [])

  if (!visible) return null

  const accept = () => {
    localStorage.setItem('pt_cookie_ok', '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 bg-card border border-white/10 rounded-2xl p-4 shadow-2xl">
      <p className="text-xs text-text-2 leading-relaxed mb-3">
        We use essential cookies to keep you logged in. No tracking without your consent.{' '}
        <Link to="/privacy" className="text-gold underline" onClick={accept}>Privacy Policy</Link>
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 bg-gold text-bg text-xs font-bold py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          Accept & Continue
        </button>
        <button
          onClick={accept}
          className="px-4 bg-white/8 text-text-2 text-xs font-medium py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          Essential only
        </button>
      </div>
    </div>
  )
}
