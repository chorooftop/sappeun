import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { updateSession } = await import('@/lib/supabase/middleware')
  return updateSession(request)
}

export const config = {
  matcher: [
    '/(auth)/:path*',
    '/api/auth/:path*',
  ],
}
