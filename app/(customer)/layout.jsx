import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CustomerLayout({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-fm-card)',
            color: 'var(--color-fm-ink)',
            border: '1px solid var(--color-fm-line-soft)',
          },
        }}
      />
    </div>
  )
}
