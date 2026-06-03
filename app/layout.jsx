import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata = {
  title: 'FreshMart',
  description: 'Fresh groceries delivered to your door',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
