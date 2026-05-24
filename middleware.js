import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CUSTOMER_PROTECTED = ['/orders', '/settings', '/wishlist', '/checkout']
const CUSTOMER_AUTH_ROUTES = ['/login', '/register']
const CUSTOMER_AUTH_PREFIXES = ['/login/', '/register/']

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const { userId } = await auth()

  // Admin routes — Clerk auth
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/')

    if (isLoginPage) {
      // Already signed in → send to dashboard (role check happens in protected layout)
      if (userId) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      return NextResponse.next()
    }

    // All other /admin/* require authentication; role check is in (protected)/layout.jsx
    if (!userId) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // Customer routes — Clerk auth
  const isProtected = CUSTOMER_PROTECTED.some((r) => pathname.startsWith(r))
  if (isProtected && !userId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isAuthPage = CUSTOMER_AUTH_ROUTES.some((r) => pathname === r) ||
    CUSTOMER_AUTH_PREFIXES.some((r) => pathname.startsWith(r))
  if (isAuthPage && userId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
