import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    "/dataroom/:path*",
    "/dashboard/:path*",
    // Add other protected routes here
  ]
}