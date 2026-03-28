import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"

const canvasMetadataSchema = z.object({
  projectId: z.string().min(1),
  userEmail: z.string().email().optional(),
  metadata: z.object({
    connections: z.array(z.any()).optional().default([]),
    camera: z.object({ x: z.number(), y: z.number() }).optional(),
    zoom: z.number().optional(),
  }),
})

export async function GET(req: Request) {
  try {
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

    // 1. Fetch all notes for this project
    const notes = await db.collection("notes").find(query).toArray()
    
    // 2. Fetch canvas metadata
    const metadataDoc = await db.collection("canvas_metadata").findOne(query)

    const snapshot = {
      notes: notes.map(n => ({ ...n, id: n._id.toString() })),
      metadata: metadataDoc?.metadata || {
        connections: [],
        camera: { x: 0, y: 0 },
        zoom: 1,
      },
    }

    return Response.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    return Response.json({ success: false, message: "Failed to fetch project data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = canvasMetadataSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    const query = {
      projectId: parsed.projectId,
      userEmail: parsed.userEmail,
    }

    const existingMetadata = await db.collection("canvas_metadata").findOne(query)

    if (existingMetadata) {
      await db.collection("canvas_metadata").updateOne(
        { _id: existingMetadata._id },
        { $set: { metadata: parsed.metadata, updatedAt: now } }
      )
    } else {
      await db.collection("canvas_metadata").insertOne({
        ...parsed,
        createdAt: now,
        updatedAt: now,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to save canvas metadata" }, { status: 500 })
  }
}
