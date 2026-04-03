import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { getSession } from "@/lib/auth"

const roleSchema = z.object({
  name: z.string().min(1, "Role name required").toLowerCase(),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const roles = await db.collection("roles").find({}).toArray()

    // Ensure default roles exist
    if (roles.length === 0) {
      const defaultRoles = [
        { name: "admin", description: "Full system access", isDefault: true },
        { name: "user", description: "Standard user access", isDefault: true },
      ]
      await db.collection("roles").insertMany(defaultRoles)
      return Response.json({ success: true, data: defaultRoles })
    }

    return Response.json({ success: true, data: roles })
  } catch (error) {
    console.error("Fetch roles error:", error)
    return Response.json({ success: false, message: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = roleSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    // Check if role exists
    const existing = await db.collection("roles").findOne({ name: parsed.name })
    if (existing) {
      return Response.json({ success: false, message: "Role already exists" }, { status: 400 })
    }

    const newRole = {
      name: parsed.name,
      description: parsed.description || "",
      createdAt: new Date(),
      isDefault: false,
    }

    await db.collection("roles").insertOne(newRole)
    return Response.json({ success: true, message: "Role created successfully", data: newRole })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Create role error:", error)
    return Response.json({ success: false, message: "Failed to create role" }, { status: 500 })
  }
}
