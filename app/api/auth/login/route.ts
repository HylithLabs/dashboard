import getClientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"
import { z } from "zod"
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth"
import { cookies } from "next/headers"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const user = await db.collection("users").findOne({ email: parsed.email })

    // Use constant-time comparison path to prevent user enumeration
    if (!user) {
      // Still run bcrypt to prevent timing attacks
      await bcrypt.compare(parsed.password, "$2b$10$invalidhashfortimingprotection000000000000000000000000")
      return Response.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isPasswordCorrect = await bcrypt.compare(parsed.password, user.password)
    if (!isPasswordCorrect) {
      return Response.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Assign role — backfill if missing
    const role: string = user.role || (user.email === process.env.ADMIN_EMAIL ? "admin" : "user")

    // Backfill role in DB if missing
    if (!user.role) {
      await db.collection("users").updateOne({ _id: user._id }, { $set: { role } })
    }

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      role,
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return Response.json({ success: true, data: { email: user.email, role } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Login error:", error)
    return Response.json({ success: false, message: "Login failed" }, { status: 500 })
  }
}
