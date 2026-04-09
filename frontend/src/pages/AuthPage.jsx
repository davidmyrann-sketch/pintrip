import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const [params]   = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login')
  const [form,  setForm] = useState({ email: '', username: '', name: '', password: '', gdpr: false, marketing: false })
  const [show,  setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoad] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !form.gdpr) {
      setError('You must accept the privacy policy to create an account.')
      return
    }
    setLoad(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({
          email: form.email, username: form.username,
          name: form.name || form.username,
          password: form.password,
          gdpr_consent: form.gdpr,
          marketing_consent: form.marketing,
        })
      }
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally { setLoad(false) }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-3 text-sm mb-8 self-start">
          <ArrowLeft size={16} />Back
        </button>

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">📍</div>
          <h1 className="text-text-1 font-black text-3xl tracking-tight">PinTrip</h1>
          <p className="text-text-3 text-sm mt-1">
            {mode === 'login' ? 'Welcome back' : 'Start planning your trips'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input
                type="text" placeholder="Display name"
                value={form.name} onChange={e => set('name', e.target.value)}
                className="input-dark"
              />
              <input
                type="text" placeholder="Username (e.g. david_travels)"
                value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g,''))}
                required className="input-dark"
              />
            </>
          )}

          <input
            type="email" placeholder="Email"
            value={form.email} onChange={e => set('email', e.target.value)}
            required className="input-dark"
          />

          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Password (min. 8 characters)"
              value={form.password} onChange={e => set('password', e.target.value)}
              required className="input-dark pr-11"
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {show ? <EyeOff size={16} className="text-text-3" /> : <Eye size={16} className="text-text-3" />}
            </button>
          </div>

          {mode === 'register' && (
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox" checked={form.gdpr} onChange={e => set('gdpr', e.target.checked)}
                  className="mt-0.5 accent-gold"
                />
                <span className="text-text-3 text-xs leading-relaxed">
                  I accept the{' '}
                  <Link to="/privacy" className="text-gold underline" target="_blank">Privacy Policy</Link>
                  {' '}and consent to my data being processed to provide the PinTrip service. <span className="text-coral">*</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox" checked={form.marketing} onChange={e => set('marketing', e.target.checked)}
                  className="mt-0.5 accent-gold"
                />
                <span className="text-text-3 text-xs leading-relaxed">
                  I'd like to receive travel inspiration and product updates by email. (Optional)
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl px-4 py-3">
              <p className="text-coral text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="btn-primary mt-2 disabled:opacity-50"
          >
            {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="text-text-3 text-sm mt-5 text-center"
        >
          {mode === 'login'
            ? <span>New to PinTrip? <span className="text-gold font-semibold">Sign up</span></span>
            : <span>Already have an account? <span className="text-gold font-semibold">Sign in</span></span>
          }
        </button>
      </div>
    </div>
  )
}
