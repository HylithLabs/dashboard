import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"

const noteSchema = z.object({
  title: z.string().min(1, "Title required"),
  text: z.string().optional().default(""),
  projectId: z.string().min(1, "Project ID required"),
  // Optional canvas props with defaults
  x: z.number().optional().default(100),
  y: z.number().optional().default(100),
  width: z.number().optional().default(250),
  height: z.number().optional().default(150),
  color: z.string().optional().default("#6B7280"),
  type: z.enum(["note", "checklist", "image"]).optional().default("note"),
  checklist: z.array(z.any()).optional().default([]),
  isPinned: z.boolean().optional().default(false),
  isCollapsed: z.boolean().optional().default(false),
  isHidden: z.boolean().optional().default(false),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional().default("none"),
  tags: z.array(z.string()).optional().default([]),
  zIndex: z.number().optional().default(1),
})

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const query: Record<string, string> = { userEmail: session.email }
    if (projectId) query.projectId = projectId

    const notes = await db.collection("notes").find(query).sort({ createdAt: -1 }).toArray()
    return Response.json({ success: true, data: notes.map((n) => ({ ...n, id: n._id.toString() })) })
  } catch (error) {
    console.error("Fetch notes error:", error)
    return Response.json({ success: false, message: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = noteSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    const note = {
      ...parsed,
      userEmail: session.email,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("notes").insertOne(note)
    
    return Response.json({
      success: true,
      data: {
        ...note,
        id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Create note error:", error)
    return Response.json({ success: false, message: "Failed to create note" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Valid Note ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    await db.collection("notes").deleteOne({ _id: new ObjectId(id) })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete note error:", error)
    return Response.json({ success: false, message: "Failed to delete note" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Valid Note ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    await db.collection("notes").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: now } }
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("Update note error:", error)
    return Response.json({ success: false, message: "Failed to update note" }, { status: 500 })
  }
}
