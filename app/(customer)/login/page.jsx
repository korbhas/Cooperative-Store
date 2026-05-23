'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/'

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (authError) { setError(authError.message); return }
      toast.success('Welcome back!')
      router.push(returnTo)
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
      minHeight: '80vh', padding: '24px 16px',
      background: 'var(--color-fm-paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--color-fm-accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-heading)', marginBottom: 14,
          }}>FM</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
            Sign in to FreshMart
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', marginTop: 4 }}>
            Fresh groceries, delivered fast
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
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={labelStyle}>Password</label>
                <Link href="/forgot-password" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
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

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-fm-line-soft)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>
              New to FreshMart?
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-fm-line-soft)' }} />
          </div>

          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px', borderRadius: 8,
            border: '1.5px solid var(--color-fm-line-soft)',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--color-fm-ink2)', textDecoration: 'none',
          }}>
            Create an account
          </Link>
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
