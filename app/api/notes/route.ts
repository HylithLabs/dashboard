import getClientPromise from "@/lib/mongodb"
import { z } from "zod"

const canvasSnapshotSchema = z.object({
  projectId: z.string().min(1),
  userEmail: z.string().email().optional(),
  snapshot: z.object({
    notes: z.array(z.any()).optional().default([]),
    connections: z.array(z.any()).optional().default([]),
    camera: z.object({ x: z.number(), y: z.number() }).optional(),
    zoom: z.number().optional(),
  }),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId")
  const userEmail = url.searchParams.get("userEmail")

  if (!projectId) {
    return Response.json({ success: false, message: "projectId required" }, { status: 400 })
  }

  const client = await getClientPromise()
  const db = client.db("hylithhub")

  const query: any = { projectId }
  if (userEmail) query.userEmail = userEmail

  const snapshotDoc = await db.collection("canvas_snapshots").findOne(query)

  if (!snapshotDoc) {
    // Return empty snapshot
    return Response.json({
      success: true,
      snapshot: {
        notes: [],
        connections: [],
        camera: { x: 0, y: 0 },
        zoom: 1,
      },
    })
  }

  return Response.json({
    success: true,
    snapshot: snapshotDoc.snapshot,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = canvasSnapshotSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    const snapshotDoc = {
      ...parsed,
      updatedAt: now,
    }

    const existingSnapshot = await db.collection("canvas_snapshots").findOne({
      projectId: parsed.projectId,
      userEmail: parsed.userEmail,
    })

    if (existingSnapshot) {
      await db.collection("canvas_snapshots").updateOne(
        { _id: existingSnapshot._id },
        { $set: { snapshot: parsed.snapshot, updatedAt: now } }
      )
    } else {
      await db.collection("canvas_snapshots").insertOne({
        ...snapshotDoc,
        createdAt: now,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Error saving canvas snapshot:", error)
    return Response.json({ success: false, message: "Failed to save canvas snapshot" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return Response.json({ success: false, message: "Note ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const snapshots = await db.collection("canvas_snapshots").find({}).toArray()
    let found = false

    for (const snapshot of snapshots) {
      if (snapshot.snapshot?.notes) {
        const noteExists = snapshot.snapshot.notes.some((n: any) => n.id === id)
        if (noteExists) {
          const updatedNotes = snapshot.snapshot.notes.filter((n: any) => n.id !== id)
          await db.collection("canvas_snapshots").updateOne(
            { _id: snapshot._id },
            { $set: { "snapshot.notes": updatedNotes, updatedAt: new Date() } }
          )
          found = true
          break
        }
      }
    }

    if (!found) {
      return Response.json({ success: false, message: "Note not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting canvas note:", error)
    return Response.json({ success: false, message: "Failed to delete note" }, { status: 500 })
  }
}