'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}

function AdminLoginForm() {
  const router = useRouter()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setError('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (authError) { setError(authError.message); return }

      if (data.user?.user_metadata?.role !== 'admin') {
        await supabase.auth.signOut()
        setError('Access denied. This portal is for admins only.')
        return
      }

      toast.success('Welcome back!')
      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px 16px',
      background: 'var(--color-fm-paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--color-fm-green)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <ShieldCheck size={24} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
            Admin Portal
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', marginTop: 4 }}>
            FreshMart internal access only
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1.5px solid var(--color-fm-line-soft)',
          padding: '28px 28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1.5px solid #fecaca',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626',
              }}>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <div style={inputWrap}>
                <Mail size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@freshmart.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 5 }}>Password</label>
              <div style={inputWrap}>
                <Lock size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} style={eyeBtn}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 8, border: 'none', marginTop: 4,
              background: loading ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)',
              color: loading ? 'var(--color-fm-green-ink)' : '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer', width: '100%',
            }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div style={{
          textAlign: 'center', marginTop: 20,
          fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)',
        }}>
          Not an admin?{' '}
          <a href="/" style={{ color: 'var(--color-fm-green-ink)', textDecoration: 'none' }}>
            Go to store
          </a>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
  color: 'var(--color-fm-ink3)', textTransform: 'uppercase',
  letterSpacing: 0.5, marginBottom: 5,
}

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: 9,
  border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 8,
  padding: '0 12px', background: '#fff', height: 42,
}

const inputStyle = {
  flex: 1, border: 'none', outline: 'none', background: 'transparent',
  fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)',
  minWidth: 0,
}

const eyeBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  color: 'var(--color-fm-ink3)', display: 'flex', alignItems: 'center',
}
