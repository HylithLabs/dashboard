import { SignJWT, jwtVerify } from "jose"

export const COOKIE_NAME = "auth-token"
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export interface SessionPayload {
  sub: string  // MongoDB user _id
  email: string
  role: string
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET environment variable is not set")
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

/** Extract the raw token string from a cookie header value. Works in all runtimes. */
function extractToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  return (
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1) ?? null
  )
}

/**
 * Get the verified session from a Request object.
 * Works in both Edge (middleware) and Node.js (route handlers) runtimes.
 */
export async function getSession(req: Request): Promise<SessionPayload | null> {
  const token = extractToken(req.headers.get("cookie"))
  if (!token) return null
  
  const payload = await verifyToken(token)
  if (!payload) return null

  // Fetch the fresh role from the database to prevent stale roles
  try {
    const getClientPromise = (await import("./mongodb")).default
    const client = await getClientPromise()
    const db = client.db("hylithhub")
    const user = await db.collection("users").findOne({ email: payload.email })
    
    if (user && user.role) {
      payload.role = user.role
    }
  } catch (error) {
    console.error("Error refreshing role from DB in getSession:", error)
  }

  return payload
}
