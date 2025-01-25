'use server'

import { handleAuthMiddleware } from '@autocrm/common/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip auth routes
  if (req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // Protect all other routes except static assets
  return handleAuthMiddleware(req, NextResponse.next())
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
