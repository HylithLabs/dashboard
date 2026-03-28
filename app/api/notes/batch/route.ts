import getClientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { notes } = body

    if (!Array.isArray(notes)) {
      return Response.json({ success: false, message: "Notes array required" }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db("hylithhub")

    const now = new Date()
    
    // Efficiently update multiple notes
    const operations = notes.map((note: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(note.id) },
        update: { 
          $set: { 
            x: note.x, 
            y: note.y, 
            width: note.width, 
            height: note.height, 
            zIndex: note.zIndex,
            updatedAt: now 
          } 
        }
      }
    }))

    if (operations.length > 0) {
      await db.collection("notes").bulkWrite(operations)
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, message: "Batch update failed" }, { status: 500 })
  }
}
