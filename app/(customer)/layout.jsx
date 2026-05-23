import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'

export default function CustomerLayout({ children }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-fm-paper)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Toaster position="bottom-right" />
    </div>
  )
}
