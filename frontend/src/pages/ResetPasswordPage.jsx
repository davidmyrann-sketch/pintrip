import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'

export default function ResetPasswordPage() {
  const [params]   = useSearchParams()
  const token      = params.get('token') || ''
  const navigate   = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/auth'), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (!token) return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-text-1 font-semibold mb-2">Invalid link</p>
        <p className="text-text-3 text-sm mb-6">This reset link is missing a token.</p>
        <button onClick={() => navigate('/auth')} className="btn-primary">Back to sign in</button>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-text-1 font-black text-3xl tracking-tight">PinTrip</h1>
          <p className="text-text-3 text-sm mt-1">Choose a new password</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-text-1 font-semibold">Password updated!</p>
            <p className="text-text-3 text-sm">Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                placeholder="New password (min. 8 characters)"
                value={password} onChange={e => setPassword(e.target.value)}
                required className="input-dark pr-11"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {show ? <EyeOff size={16} className="text-text-3" /> : <Eye size={16} className="text-text-3" />}
              </button>
            </div>

            <input
              type={show ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              required className="input-dark"
            />

            {error && (
              <div className="bg-coral/10 border border-coral/30 rounded-xl px-4 py-3">
                <p className="text-coral text-xs">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-50">
              {loading ? '…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
