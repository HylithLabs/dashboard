import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schema for note document
const noteSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  snapshot: z.object({}).passthrough(),
})

// GET /api/notes?projectId=xxx - Fetch notes for a project
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")

    if (!projectId) {
      return Response.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("hylithhub")

    const note = await db.collection("notes").findOne({ projectId })

    if (!note) {
      return Response.json({
        success: true,
        snapshot: null,
        message: "No notes found for this project",
      })
    }

    return Response.json({
      success: true,
      snapshot: note.snapshot,
      updatedAt: note.updatedAt,
    })
  } catch (error) {
    console.error("Failed to fetch notes:", error)
    return Response.json(
      { success: false, message: "Failed to fetch notes" },
      { status: 500 }
    )
  }
}

// POST /api/notes - Save or update notes for a project
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = noteSchema.parse(body)

    const client = await clientPromise
    const db = client.db("hylithhub")

    // Upsert the note document
    const result = await db.collection("notes").updateOne(
      { projectId: parsed.projectId },
      {
        $set: {
          projectId: parsed.projectId,
          snapshot: parsed.snapshot,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    return Response.json({
      success: true,
      message: result.upsertedCount > 0 ? "Notes created" : "Notes updated",
      id: result.upsertedId?.toString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Failed to save notes:", error)
    return Response.json(
      { success: false, message: "Failed to save notes" },
      { status: 500 }
    )
  }
}

// DELETE /api/notes?projectId=xxx - Delete notes for a project
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")

    if (!projectId) {
      return Response.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("hylithhub")

    await db.collection("notes").deleteOne({ projectId })

    return Response.json({
      success: true,
      message: "Notes deleted",
    })
  } catch (error) {
    console.error("Failed to delete notes:", error)
    return Response.json(
      { success: false, message: "Failed to delete notes" },
      { status: 500 }
    )
  }
}
