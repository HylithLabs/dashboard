import getClientPromise from "@/lib/mongodb"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"

const todoSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  status: z.enum(["in-progress", "done", "cancelled", "delayed"]),
  priority: z.enum(["no-priority", "urgent", "high", "medium", "low"]),
  projectId: z.string().min(1, "Project ID required").optional().nullable(),
  assignedToEmail: z.string().email("Invalid assignee email").optional(),
})

const normalizeTodo = (todo: {
  _id?: ObjectId
  title?: string
  description?: string
  status?: "in-progress" | "done" | "cancelled" | "delayed"
  priority?: "no-priority" | "urgent" | "high" | "medium" | "low"
  projectId?: string | null
  userEmail?: string
  assignedToEmail?: string
  assignedByEmail?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}) => ({
  id: todo._id?.toString() || "",
  title: todo.title || "",
  description: todo.description,
  status: todo.status || "in-progress",
  priority: todo.priority || "medium",
  projectId: todo.projectId || null,
  userEmail: todo.userEmail,
  assignedToEmail: todo.assignedToEmail,
  assignedByEmail: todo.assignedByEmail,
  createdAt:
    todo.createdAt instanceof Date
      ? todo.createdAt.toISOString()
      : todo.createdAt || new Date().toISOString(),
  updatedAt:
    todo.updatedAt instanceof Date
      ? todo.updatedAt.toISOString()
      : todo.updatedAt,
})

export async function GET(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const mode = url.searchParams.get("mode")

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const query: Record<string, unknown> =
      mode === "assigned-by-me"
        ? {
            assignedByEmail: session.email,
            assignedToEmail: { $ne: session.email },
          }
        : { userEmail: session.email }

    if (projectId) {
      query.projectId = projectId
    }

    const todos = await db.collection("todos").find(query).sort({ createdAt: -1 }).toArray()
    return Response.json({
      success: true,
      data: todos.map((todo) =>
        normalizeTodo(
          todo as {
            _id?: ObjectId
            title?: string
            description?: string
            status?: "in-progress" | "done" | "cancelled" | "delayed"
            priority?: "no-priority" | "urgent" | "high" | "medium" | "low"
            projectId?: string | null
            userEmail?: string
            assignedToEmail?: string
            assignedByEmail?: string
            createdAt?: Date | string
            updatedAt?: Date | string
          }
        )
      ),
    })
  } catch (error) {
    console.error("Fetch todos error:", error)
    return Response.json({ success: false, message: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = todoSchema.parse(body)

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const assignedToEmail = parsed.assignedToEmail || session.email
    const projectId = parsed.projectId || null

    const now = new Date()
    const todo = {
      ...parsed,
      projectId,
      userEmail: assignedToEmail,
      assignedToEmail,
      assignedByEmail: session.email,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("todos").insertOne(todo)
    return Response.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...parsed,
        projectId,
        userEmail: assignedToEmail,
        assignedToEmail,
        assignedByEmail: session.email,
        createdAt: now.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, message: error.issues[0].message }, { status: 400 })
    }
    console.error("Create todo error:", error)
    return Response.json({ success: false, message: "Failed to create todo" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Valid Todo ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    await db.collection("todos").deleteOne({ _id: new ObjectId(id) })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete todo error:", error)
    return Response.json({ success: false, message: "Failed to delete todo" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Valid Todo ID required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    await db.collection("todos").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: now } }
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("Update todo error:", error)
    return Response.json({ success: false, message: "Failed to update todo" }, { status: 500 })
  }
}
