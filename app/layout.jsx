import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import { JetBrains_Mono } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jbmono',
})

export const metadata = {
  title: 'TU Cooperative Store',
  description: 'Fresh groceries delivered to your door',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`h-full ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
            {children}
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
