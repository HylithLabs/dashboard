import clientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"

const todoSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  status: z.enum(["in-progress", "done", "cancelled", "delayed"]),
  priority: z.enum(["no-priority", "urgent", "high", "medium", "low"]),
  projectId: z.string().min(1, "Project ID required"),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")

    const client = await clientPromise
    const db = client.db("hylithhub")

    const query = projectId ? { projectId } : {}
    const todos = await db.collection("todos").find(query).sort({ createdAt: -1 }).toArray()

    return Response.json({ success: true, data: todos })
  } catch (error) {
    return Response.json({ success: false, message: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = todoSchema.parse(body)

    const client = await clientPromise
    const db = client.db("hylithhub")

    const todo = {
      ...parsed,
      createdAt: new Date(),
    }

    const result = await db.collection("todos").insertOne(todo)
    return Response.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...parsed,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    return Response.json({ success: false, message: "Failed to create todo" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return Response.json({ success: false, message: "Todo ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("hylithhub")

    await db.collection("todos").deleteOne({ _id: new ObjectId(id) })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, message: "Failed to delete todo" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json({ success: false, message: "Todo ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("hylithhub")

    await db.collection("todos").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, message: "Failed to update todo" }, { status: 500 })
  }
}
