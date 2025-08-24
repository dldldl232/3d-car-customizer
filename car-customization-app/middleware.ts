// import { NextResponse } from "next/server"
// import type { NextRequest } from "next/server"

// export function middleware(request: NextRequest) {
//   // Get the pathname of the request
//   const { pathname } = request.nextUrl

//   // Define protected routes
//   const protectedRoutes = ["/customize", "/dashboard"]

//   // Check if the current route is protected
//   const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

//   if (isProtectedRoute) {
//     // Check for auth token in cookies or headers
//     const token =
//       request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

//     if (!token) {
//       // Redirect to login if no token found
//       return NextResponse.redirect(new URL("/login", request.url))
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ["/customize/:path*", "/dashboard/:path*"],
// }

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLE AUTH MIDDLEWARE FOR TESTING
  return NextResponse.next()

  // // Get the pathname of the request
  // const { pathname } = request.nextUrl

  // // Define protected routes
  // const protectedRoutes = ["/customize", "/dashboard"]

  // // Check if the current route is protected
  // const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // if (isProtectedRoute) {
  //   // Check for auth token in cookies or headers
  //   const token =
  //     request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  //   if (!token) {
  //     // Redirect to login if no token found
  //     return NextResponse.redirect(new URL("/login", request.url))
  //   }
  // }

  // return NextResponse.next()
}

export const config = {
  matcher: ["/customize/:path*", "/dashboard/:path*"],
}
