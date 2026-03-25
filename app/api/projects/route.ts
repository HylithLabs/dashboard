import clientPromise from "@/lib/mongodb"
import { z } from "zod"

// Zod schema for a project (used for validation if needed)
export const projectSchema = z.object({
  name: z.string().min(1, "Project name required"),
  // Assuming projects are scoped to a user like todos
  email: z.string().email().optional(),
})

type Project = z.infer<typeof projectSchema> & {
  _id?: any
  createdAt: Date
  userId?: any
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("email")

  const client = await clientPromise
  const db = client.db("hylithhub")

  // If an email is supplied, filter projects for that user; otherwise return all
  const query = email ? { userEmail: email } : {}

  const projects: Project[] = await db.collection("projects").find(query).sort({ createdAt: -1 }).toArray()
  return Response.json({ success: true, data: projects })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = projectSchema.parse(body)
    
    const client = await clientPromise
    const db = client.db("hylithhub")
    
    const newProject: Project = {
      ...parsed,
      createdAt: new Date(),
    }
    
    const result = await db.collection("projects").insertOne(newProject)
    return Response.json({ 
      success: true, 
      data: { 
        id: result.insertedId.toString(),
        name: parsed.name 
      } 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to create project" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return Response.json({ success: false, message: "Project ID required" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db("hylithhub")
  const result = await db.collection("projects").deleteOne({ _id: new (require('mongodb').ObjectId)(id) })
  if (result.deletedCount === 0) {
    return Response.json({ success: false, message: "Project not found" }, { status: 404 })
  }
  return Response.json({ success: true })
}
