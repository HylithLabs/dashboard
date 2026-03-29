export type Priority = "none" | "low" | "medium" | "high" | "urgent"
export type NoteType = "note" | "checklist" | "image"

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface NoteConnection {
  id: string
  fromNoteId: string
  toNoteId: string
  color: string
}

export interface NoteBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  title: string
  text: string
  color: string
  type: NoteType
  checklist: ChecklistItem[]
  imageUrl?: string
  isPinned: boolean
  isCollapsed: boolean
  isHidden: boolean
  priority: Priority
  tags: string[]
  fontSize: number
  zIndex: number
  createdAt: number
  updatedAt: number
  projectId: string
  userEmail: string
  source?: "canvas" | "simple"
  simpleNoteId?: string
}

export interface CanvasMetadata {
  connections: NoteConnection[]
  camera: { x: number; y: number }
  zoom: number
}

export interface CanvasSnapshot {
  notes: NoteBox[]
  metadata: CanvasMetadata
}
