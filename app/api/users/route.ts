import getClientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"
import { z } from "zod"

const adminEmail = process.env.ADMIN_EMAIL || "jotirmoybhowmik1976@gmail.com"

// Schema for creating a user (admin only)
const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminEmail: z.string().email("Admin email required"),
  role: z.string().default("user"),
})

// Schema for updating a user role (admin only)
const updateUserSchema = z.object({
  email: z.string().email("Invalid user email"),
  role: z.string(),
  adminEmail: z.string().email("Admin email required"),
})

export async function GET(req: Request) {
  try {
    const client = await getClientPromise()
    const db = client.db("hylithhub")
    
    // Get all users (for admin only)
    const url = new URL(req.url)
    const requestingEmail = url.searchParams.get("email")
    
    if (requestingEmail !== adminEmail) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }
    
    // Ensure admin user has admin role if not already set
    await db.collection("users").updateOne(
      { email: adminEmail, role: { $exists: false } },
      { $set: { role: "admin" } }
    )
    
    // Set default role for others if missing
    await db.collection("users").updateMany(
      { email: { $ne: adminEmail }, role: { $exists: false } },
      { $set: { role: "user" } }
    )

    const users = await db.collection("users").find({}).project({ password: 0 }).toArray()
    return Response.json({ success: true, data: users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return Response.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  
  // Check if this is a login request or create user request
  if (!body.adminEmail) {
    // This is a login request
    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const result = await db.collection("users").findOne({ email: body.email })
    if (!result) {
      return Response.json({ success: false, message: "User not found" })
    } 

    const isPasswordCorrect = await bcrypt.compare(body.password, result.password)
    if (!isPasswordCorrect) {
      return Response.json({ success: false, message: "Invalid password" })
    }

    // Update existing user to have a role if missing
    if (!result.role) {
      const role = body.email === adminEmail ? "admin" : "user"
      await db.collection("users").updateOne({ _id: result._id }, { $set: { role } })
      result.role = role
    }

    return Response.json({ success: true, data: {
      email: body.email,
      role: result.role
    }})
  }
  
  // This is a create user request
  try {
    const parsed = createUserSchema.parse(body)
    
    // Verify admin email
    if (parsed.adminEmail !== adminEmail) {
      return Response.json({ success: false, message: "Unauthorized - Admin access required" }, { status: 403 })
    }
    
    const client = await getClientPromise()
    const db = client.db("hylithhub")
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: parsed.email })
    if (existingUser) {
      return Response.json({ success: false, message: "User already exists" }, { status: 400 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 10)
    
    // Create new user
    const newUser = {
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role || "user",
      createdAt: new Date(),
      createdBy: adminEmail,
    }
    
    const result = await db.collection("users").insertOne(newUser)
    
    return Response.json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.insertedId.toString(),
        email: parsed.email,
        role: newUser.role
      }
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
    const body = await req.json()
    const parsed = updateUserSchema.parse(body)
    
    // Verify admin email
    if (parsed.adminEmail !== adminEmail) {
      return Response.json({ success: false, message: "Unauthorized - Admin access required" }, { status: 403 })
    }
    
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
