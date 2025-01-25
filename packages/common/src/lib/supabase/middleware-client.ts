'use server'

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '../types/database.types'
import { serverConfig } from './server-config'

export const { dynamic, runtime } = serverConfig

// Helper function to create a middleware Supabase client
export const createMiddlewareSupabaseClient = ({
  req,
  res,
}: {
  req: NextRequest
  res: NextResponse
}) => {
  // Create the client without relying on Node.js specific features
  return createMiddlewareClient<Database>({ req, res })
}

// Helper function to handle auth middleware
export const handleAuthMiddleware = async (
  req: NextRequest,
  res: NextResponse,
  protectedPaths: string[] = ['/(dashboard)']
) => {
  try {
    const supabase = createMiddlewareSupabaseClient({ req, res })

    // Check auth status
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and trying to access protected route, redirect to login
    const isProtectedPath = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))
    if (!session && isProtectedPath) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    // On error, redirect to login as a safety measure
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }
}
