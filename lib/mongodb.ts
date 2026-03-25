import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient> | undefined

export default function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined")
  }
  
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  
  return global._mongoClientPromise
}
