// Server-only — do not import from 'use client' files

function getRequired(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Check your .env.local and deployment environment settings.`
    )
  }
  return value
}

// ─── Database ─────────────────────────────────────────────────────────────────
export const DATABASE_URL = getRequired('DATABASE_URL')

// ─── Admin auth (Supabase) ────────────────────────────────────────────────────
export const SUPABASE_URL      = getRequired('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = getRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// ─── Payments — optional, Razorpay disabled if absent ────────────────────────
export const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     ?? null
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? null

// ─── Customer auth (Clerk) ────────────────────────────────────────────────────
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY are required but
// validated by @clerk/nextjs internally at startup — no need to duplicate.
