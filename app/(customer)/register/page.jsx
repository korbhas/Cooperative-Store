'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setError('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { name, email, password, confirm } = form

    if (!name || !email || !password || !confirm) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
        },
      })
      if (authError) { setError(authError.message); return }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', padding: '24px 16px',
        background: 'var(--color-fm-paper)',
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-fm-green-soft)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 16,
          }}>✓</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 8 }}>
            Check your email
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-fm-ink3)', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--color-fm-ink)' }}>{form.email}</strong>.
            Open it to activate your account.
          </div>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px 28px', borderRadius: 8,
            background: 'var(--color-fm-green)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
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
            Create your account
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', marginTop: 4 }}>
            Join FreshMart and start shopping
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1.5px solid var(--color-fm-line-soft)',
          padding: '28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1.5px solid #fecaca',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626',
              }}>
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={inputWrap}>
                <User size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" autoComplete="name" style={inputStyle} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <div style={inputWrap}>
                <Mail size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" style={inputStyle} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={inputWrap}>
                <Lock size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" autoComplete="new-password" style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} style={eyeBtn}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{
                ...inputWrap,
                borderColor: form.confirm && form.confirm !== form.password ? '#fca5a5' : 'var(--color-fm-line-soft)',
              }}>
                <Lock size={15} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
                <input
                  name="confirm" type={showPw ? 'text' : 'password'}
                  value={form.confirm} onChange={handleChange}
                  placeholder="Repeat password" autoComplete="new-password" style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 8, border: 'none', marginTop: 4,
              background: loading ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)',
              color: loading ? 'var(--color-fm-green-ink)' : '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer', width: '100%',
            }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-fm-line-soft)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>
              Already have an account?
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-fm-line-soft)' }} />
          </div>

          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px', borderRadius: 8,
            border: '1.5px solid var(--color-fm-line-soft)',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--color-fm-ink2)', textDecoration: 'none',
          }}>
            Sign In
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
