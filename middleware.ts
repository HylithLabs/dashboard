import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "auth-token"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")
  return new TextEncoder().encode(secret)
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow /api/auth/* (login, logout, me)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  const authed = await isAuthenticated(req)

  // Login page: redirect to dashboard if already logged in
  if (pathname === "/") {
    if (authed) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Protect dashboard pages
  if (pathname.startsWith("/dashboard")) {
    if (!authed) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // Protect all other API routes
  if (pathname.startsWith("/api/")) {
    if (!authed) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*"],
}
