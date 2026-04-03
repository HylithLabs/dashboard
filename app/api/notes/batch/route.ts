import getClientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"

export async function PUT(req: Request) {
  const session = await getSession(req)
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { notes } = body

    if (!Array.isArray(notes)) {
      return Response.json({ success: false, message: "Notes array required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    
    // Efficiently update multiple notes (including content fields)
    const operations = notes.map((note: Record<string, unknown>) => {
      const fields: Record<string, unknown> = { updatedAt: now }
      // Positional fields
      if (note.x !== undefined) fields.x = note.x
      if (note.y !== undefined) fields.y = note.y
      if (note.width !== undefined) fields.width = note.width
      if (note.height !== undefined) fields.height = note.height
      if (note.zIndex !== undefined) fields.zIndex = note.zIndex
      // Content fields
      if (note.title !== undefined) fields.title = note.title
      if (note.text !== undefined) fields.text = note.text
      if (note.color !== undefined) fields.color = note.color
      if (note.type !== undefined) fields.type = note.type
      if (note.checklist !== undefined) fields.checklist = note.checklist
      if (note.isPinned !== undefined) fields.isPinned = note.isPinned
      if (note.isCollapsed !== undefined) fields.isCollapsed = note.isCollapsed
      if (note.isHidden !== undefined) fields.isHidden = note.isHidden
      if (note.priority !== undefined) fields.priority = note.priority
      if (note.tags !== undefined) fields.tags = note.tags
      if (note.fontSize !== undefined) fields.fontSize = note.fontSize
      return {
        updateOne: {
          filter: { _id: new ObjectId(note.id as string) },
          update: { $set: fields },
        },
      }
    })

    if (operations.length > 0) {
      await db.collection("notes").bulkWrite(operations)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Batch update error:", error)
    return Response.json({ success: false, message: "Batch update failed" }, { status: 500 })
  }
}
