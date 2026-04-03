import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) {
    return Response.json({ success: false, message: "Not authenticated" }, { status: 401 })
  }
  return Response.json({ success: true, data: { email: session.email, role: session.role } })
}
