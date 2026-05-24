import { SignIn } from '@clerk/nextjs'
import { ShieldCheck } from 'lucide-react'

const appearance = {
  variables: {
    colorPrimary: '#1f4d34',
    colorBackground: '#ffffff',
    colorText: '#1f2520',
    colorTextSecondary: '#4a544c',
    colorTextOnPrimaryBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#1f2520',
    borderRadius: '8px',
    fontFamily: '"Okra", Helvetica, sans-serif',
    fontSize: '13px',
  },
  elements: {
    rootBox: { width: '100%' },
    card: {
      boxShadow: 'none',
      border: '1.5px solid rgba(31,37,32,0.18)',
      borderRadius: '14px',
      padding: '28px',
      backgroundColor: '#ffffff',
      width: '100%',
    },
    header: { display: 'none' },
    logoBox: { display: 'none' },
    footer: { display: 'none' },
    formFieldLabel: {
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: '600',
      color: '#8a948c',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '5px',
    },
    formFieldInput: {
      height: '42px',
      borderRadius: '8px',
      border: '1.5px solid rgba(31,37,32,0.18)',
      fontFamily: 'inherit',
      fontSize: '13px',
      color: '#1f2520',
      backgroundColor: '#ffffff',
      boxShadow: 'none',
      outline: 'none',
    },
    formButtonPrimary: {
      backgroundColor: '#1f4d34',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '14px',
      fontWeight: '600',
      height: '44px',
      marginTop: '4px',
      boxShadow: 'none',
    },
    dividerLine: { backgroundColor: 'rgba(31,37,32,0.18)' },
    dividerText: {
      fontFamily: 'inherit',
      fontSize: '11px',
      color: '#8a948c',
    },
    alternativeMethodsBlockButton: {
      border: '1.5px solid rgba(31,37,32,0.18)',
      borderRadius: '8px',
      fontFamily: 'inherit',
    },
    identityPreviewText: { fontFamily: 'inherit' },
    identityPreviewEditButton: { color: '#2a6a47' },
  },
}

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams
  const returnTo = params?.returnTo || '/admin/dashboard'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px 16px',
      background: 'var(--color-fm-paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

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

        <SignIn
          appearance={appearance}
          fallbackRedirectUrl={returnTo}
          signUpUrl={undefined}
        />

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
