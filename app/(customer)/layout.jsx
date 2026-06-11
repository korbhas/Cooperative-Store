import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CustomerLayout({ children }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  )
}
