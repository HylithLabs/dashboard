import getClientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"
import { z } from "zod"
import { getSession } from "@/lib/auth"

// Schema for creating a user (admin only)
const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("user"),
})

// Schema for updating a user role (admin only)
const updateUserSchema = z.object({
  email: z.string().email("Invalid user email"),
  role: z.string(),
})

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("mode")

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    if (mode === "options") {
      const users = await db.collection("users").find({}).project({ email: 1 }).sort({ email: 1 }).toArray()
      return Response.json({ success: true, data: users })
    }

    if (session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const users = await db.collection("users").find({}).project({ password: 0 }).toArray()
    return Response.json({ success: true, data: users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return Response.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createUserSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: parsed.email })
    if (existingUser) {
      return Response.json({ success: false, message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 10)

    const newUser = {
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role || "user",
      createdAt: new Date(),
      createdBy: session.email,
    }

    const result = await db.collection("users").insertOne(newUser)

    return Response.json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.insertedId.toString(),
        email: parsed.email,
        role: newUser.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateUserSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const result = await db.collection("users").updateOne(
      { email: parsed.email },
      { $set: { role: parsed.role, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return Response.json({ success: true, message: "User role updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to update user role" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return Response.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    // Admin cannot delete themselves
    if (email === session.email) {
      return Response.json({ success: false, message: "You cannot delete yourself" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const result = await db.collection("users").deleteOne({ email })

    if (result.deletedCount === 0) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return Response.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return Response.json({ success: false, message: "Failed to delete user" }, { status: 500 })
  }
}
