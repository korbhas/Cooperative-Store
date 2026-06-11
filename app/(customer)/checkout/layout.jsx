import CheckoutSteps from '@/components/CheckoutSteps'

export default function CheckoutLayout({ children }) {
  return (
    <div style={{ flex: 1, background: 'var(--color-fm-paper)' }}>
      <div className="pb-20 md:pb-8" style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 16 }}>
          Checkout
        </div>
        <CheckoutSteps />
        {children}
      </div>
    </div>
  )
}
