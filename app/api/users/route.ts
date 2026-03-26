import getClientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"
import { z } from "zod"

const adminEmail = "jotirmoybhowmik1976@gmail.com"

// Schema for creating a user (admin only)
const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
    
    const users = await db.collection("users").find({}).project({ password: 0 }).toArray()
    return Response.json({ success: true, data: users })
  } catch (error) {
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

    return Response.json({ success: true, data: {
      email: body.email
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
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to create user" }, { status: 500 })
  }
}
