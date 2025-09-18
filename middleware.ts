import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    // Allow access to sign-in page for non-authenticated users
    if (pathname === '/sign-in' && !token) {
      return NextResponse.next()
    }

    // Redirect non-authenticated users to sign-in
    if (!token && pathname !== '/sign-in') {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Redirect authenticated users away from sign-in page
    if (token && pathname === '/sign-in') {
      const redirectUrl = token.role === 'CEO' ? '/dashboard' : '/my-requests'
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Role-based access control
    if (token) {
      // CEO-only routes
      if (pathname.startsWith('/dashboard') && token.role !== 'CEO') {
        return NextResponse.redirect(new URL('/my-requests', req.url))
      }

      // Executive-only routes
      if (pathname.startsWith('/my-requests') && token.role !== 'EXECUTIVE') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // API route protection
      if (pathname.startsWith('/api/requests') && pathname.includes('/choose')) {
        if (token.role !== 'CEO') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      if (pathname.startsWith('/api/requests') && pathname.includes('/other')) {
        if (token.role !== 'CEO') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      if (pathname.startsWith('/api/requests') && pathname.includes('/reject')) {
        if (token.role !== 'CEO') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to sign-in page for non-authenticated users
        if (req.nextUrl.pathname === '/sign-in') {
          return true
        }
        // Require token for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
