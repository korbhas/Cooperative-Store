import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const CUSTOMER_PROTECTED = ['/orders', '/settings', '/wishlist', '/checkout']
const CUSTOMER_AUTH_ROUTES = ['/login', '/register']
const ADMIN_LOGIN = '/admin/login'

export async function middleware(request) {
  // Skip middleware if Supabase is not configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isAdmin = user?.user_metadata?.role === 'admin'

  // Admin routes
  if (pathname === ADMIN_LOGIN) {
    if (isAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    return supabaseResponse
  }
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
    return supabaseResponse
  }

  // Customer routes
  const isProtected = CUSTOMER_PROTECTED.some((r) => pathname.startsWith(r))
  const isAuthPage = CUSTOMER_AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
