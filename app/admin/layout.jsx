import { Toaster } from 'react-hot-toast'

export default function AdminRootLayout({ children }) {
  return (
    <>
      <Toaster position="bottom-right" />
      {children}
    </>
  )
}
