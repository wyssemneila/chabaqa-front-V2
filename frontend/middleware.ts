import { NextRequest } from 'next/server'
import { authMiddleware } from './middleware/auth.middleware'

export async function middleware(req: NextRequest) {
  return authMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
