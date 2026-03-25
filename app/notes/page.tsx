"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import CanvasEditor to disable SSR
const CanvasEditor = dynamic(
  () => import("./CanvasEditor").then((mod) => mod.CanvasEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    ),
  }
)

export default function NotesPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-full bg-background">
            <div className="text-muted-foreground">Loading canvas...</div>
          </div>
        }
      >
        <CanvasEditor />
      </Suspense>
    </div>
  )
}
