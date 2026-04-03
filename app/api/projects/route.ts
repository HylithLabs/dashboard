import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"

const projectSchema = z.object({
  name: z.string().min(1, "Project name required"),
})

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const projects = await db
      .collection("projects")
      .find({ userEmail: session.email })
      .sort({ createdAt: -1 })
      .toArray()

    return Response.json({ success: true, data: projects })
  } catch (error) {
    console.error("Fetch projects error:", error)
    return Response.json({ success: false, message: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = projectSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    const newProject = {
      name: parsed.name,
      userEmail: session.email,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("projects").insertOne(newProject)
    return Response.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: parsed.name,
        createdAt: now.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Create project error:", error)
    return Response.json({ success: false, message: "Failed to create project" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Valid Project ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")
    
    // Also delete associated todos and notes? 
    // For now just the project
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return Response.json({ success: false, message: "Project not found" }, { status: 404 })
    }
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return Response.json({ success: false, message: "Failed to delete project" }, { status: 500 })
  }
}
