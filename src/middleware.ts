import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not logged in and trying to access protected routes
  if (!session && (
    req.nextUrl.pathname.startsWith('/tickets') ||
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/settings')
  )) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in but trying to access auth pages
  if (session && (
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register')
  )) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/tickets'
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin access
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user?.id)
        .single()

      if (error || user?.role !== 'admin') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/tickets'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/tickets'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/tickets/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
} 