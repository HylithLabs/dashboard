import getClientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }
  const email = session.email

  if (!email) {
    return Response.json({ success: false, message: "Email required" })
  }

  const client = await getClientPromise()
  const db = client.db("hylithhub")

  const user = await db.collection("users").findOne({ email })
  if (!user) {
    return Response.json({ success: false, message: "User not found" })
  }

  const todos = await db.collection("todos").find({ userId: user._id }).sort({ createdAt: -1 }).toArray()

  return Response.json({ success: true, data: todos })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { text } = body
  const session = await getSession(req)
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }
  const email = session.email

  if (!text || !email) {
    return Response.json({ success: false, message: "Text and email required" })
  }

  const client = await getClientPromise()
  const db = client.db("hylithhub")

  const user = await db.collection("users").findOne({ email })
  if (!user) {
    return Response.json({ success: false, message: "User not found" })
  }

  const result = await db.collection("todos").insertOne({
    text,
    completed: false,
    userId: user._id,
    createdAt: new Date(),
  })

  return Response.json({ success: true, data: { _id: result.insertedId.toString(), text, completed: false } })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return Response.json({ success: false, message: "Todo ID required" })
  }

  const client = await getClientPromise()
  const db = client.db("hylithhub")

  await db.collection("todos").deleteOne({ _id: new ObjectId(id) })

  return Response.json({ success: true })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, text, completed } = body

  const client = await getClientPromise()
  const db = client.db("hylithhub")

  await db.collection("todos").updateOne(
    { _id: new ObjectId(id) },
    { $set: { text, completed, updatedAt: new Date() } }
  )

  return Response.json({ success: true })
}
