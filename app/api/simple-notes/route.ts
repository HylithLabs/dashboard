import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"

const COLORS = [
  "#F0B000", "#5E6AD2", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FF9F43", "#A29BFE", "#FD79A8", "#00B894",
  "#636E72", "#2D3436", "#74B9FF", "#FFEAA7", "#DFE6E9",
]

const noteSchema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().optional(),
  projectId: z.string().min(1, "Project ID required"),
  userEmail: z.string().email().optional(),
})

function createCanvasNote(simpleNoteId: string, title: string, content: string) {
  const now = Date.now()
  return {
    id: now.toString(),
    x: 100,
    y: 100,
    width: 250,
    height: 150,
    minWidth: 150,
    minHeight: 100,
    title: title,
    text: content,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    type: "note" as const,
    checklist: [],
    isPinned: false,
    isCollapsed: false,
    isHidden: false,
    priority: "none" as const,
    tags: [],
    fontSize: 13,
    zIndex: 1,
    createdAt: now,
    updatedAt: now,
    source: "simple",
    simpleNoteId: simpleNoteId,
  }
}

async function syncWithCanvas(
  projectId: string,
  userEmail: string | undefined,
  simpleNoteId: string,
  title: string,
  content: string,
  operation: "add" | "update" | "delete"
) {
  const client = await getClientPromise()
  const db = client.db("hylithhub")
  let snapshotDoc = await db.collection("canvas_snapshots").findOne({ projectId, userEmail })

  if (operation === "delete") {
    if (snapshotDoc && snapshotDoc.snapshot?.notes) {
      const updatedNotes = snapshotDoc.snapshot.notes.filter(
        (n: any) => n.simpleNoteId !== simpleNoteId
      )
      await db.collection("canvas_snapshots").updateOne(
        { _id: snapshotDoc._id },
        { $set: { "snapshot.notes": updatedNotes, updatedAt: new Date() } }
      )
    }
    return
  }

  const canvasNote = createCanvasNote(simpleNoteId, title, content)

  if (!snapshotDoc) {
    const newSnapshot = {
      projectId,
      userEmail,
      snapshot: {
        notes: [canvasNote],
        connections: [],
        camera: { x: 0, y: 0 },
        zoom: 1,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection("canvas_snapshots").insertOne(newSnapshot)
  } else {
    let notes = snapshotDoc.snapshot.notes || []
    if (operation === "add") {
      // Only add if not already present (prevent duplicates)
      if (!notes.some((n: any) => n.simpleNoteId === simpleNoteId)) {
        notes.push(canvasNote)
      }
    } else if (operation === "update") {
      const existingIndex = notes.findIndex((n: any) => n.simpleNoteId === simpleNoteId)
      if (existingIndex >= 0) {
        notes[existingIndex] = { ...notes[existingIndex], title, text: content, updatedAt: Date.now() }
      } else {
        notes.push(canvasNote)
      }
    }
    await db.collection("canvas_snapshots").updateOne(
      { _id: snapshotDoc._id },
      { $set: { "snapshot.notes": notes, updatedAt: new Date() } }
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const userEmail = url.searchParams.get("userEmail")

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const query: any = {}
    if (projectId) query.projectId = projectId
    if (userEmail) query.userEmail = userEmail

    const notes = await db.collection("simple-notes").find(query).sort({ createdAt: -1 }).toArray()

    return Response.json({ success: true, data: notes })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return Response.json({ success: false, message: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = noteSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const note = {
      ...parsed,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("simple-notes").insertOne(note)
    const insertedId = result.insertedId.toString()

    await syncWithCanvas(
      parsed.projectId,
      parsed.userEmail,
      insertedId,
      parsed.title,
      parsed.content || "",
      "add"
    )

    return Response.json({
      success: true,
      data: {
        id: insertedId,
        ...parsed,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Error creating note:", error)
    return Response.json({ success: false, message: "Failed to create note" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id || id === 'undefined') {
      return Response.json({ success: false, message: "Note ID required" }, { status: 400 })
    }

    if (!ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Invalid note ID format" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const note = await db.collection("simple-notes").findOne({ _id: new ObjectId(id) })
    if (note) {
      await syncWithCanvas(note.projectId, note.userEmail, id, "", "", "delete")
    }

    await db.collection("simple-notes").deleteOne({ _id: new ObjectId(id) })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return Response.json({ success: false, message: "Failed to delete note" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, title, content, userEmail, projectId } = body

    if (!id || id === 'undefined') {
      return Response.json({ success: false, message: "Note ID required" }, { status: 400 })
    }

    if (!ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Invalid note ID format" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const noteToUpdate = await db.collection("simple-notes").findOne({ _id: new ObjectId(id) })
    if (!noteToUpdate) {
      return Response.json({ success: false, message: "Note not found" }, { status: 404 })
    }

    const finalProjectId = projectId || noteToUpdate.projectId
    const finalUserEmail = userEmail || noteToUpdate.userEmail

    await db.collection("simple-notes").updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, content, updatedAt: new Date() } }
    )

    await syncWithCanvas(
      finalProjectId,
      finalUserEmail,
      id,
      title,
      content || "",
      "update"
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating note:", error)
    return Response.json({ success: false, message: "Failed to update note" }, { status: 500 })
  }
}