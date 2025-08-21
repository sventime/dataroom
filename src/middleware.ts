import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isRootPage = req.nextUrl.pathname === '/'

    if (isAuth && (isAuthPage || isRootPage)) {
      return NextResponse.redirect(new URL('/dataroom', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token && req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }
        
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/auth/:path*", 
    "/dataroom/:path*",
    "/dashboard/:path*",
  ]
}