import { SignIn } from '@clerk/nextjs'

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
    footerActionText: {
      fontFamily: 'inherit',
      fontSize: '11px',
      color: '#8a948c',
    },
    footerActionLink: {
      color: '#2a6a47',
      fontFamily: 'inherit',
      fontSize: '14px',
      fontWeight: '500',
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

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const returnTo = params?.returnTo || '/'

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: '24px 16px',
      background: 'var(--color-fm-paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

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

        <SignIn
          appearance={appearance}
          signUpUrl="/register"
          fallbackRedirectUrl={returnTo}
        />
      </div>
    </div>
  )
}
