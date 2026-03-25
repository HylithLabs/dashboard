import getClientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const body = await req.json()
  const client = await getClientPromise()
  const db = client.db("hylithhub")

  const result = await db.collection("users").findOne({ email: body.email })
  if (!result) {
    return Response.json({ success: false, message: "User not found" })
  } 

  const isPasswordCorrect = await bcrypt.compare(body.password, result.password)
  if (!isPasswordCorrect) {
    return Response.json({ success: false, message: "Invalid password" })
  }

  return Response.json({ success: true, data: {
    email: body.email
  } })
}
