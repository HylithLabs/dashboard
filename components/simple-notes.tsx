"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, Trash2Icon, EditIcon, CheckIcon, XIcon, Search } from "lucide-react"
import { toast } from "sonner"

interface SimpleNote {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Canvas note extraction interface
interface CanvasNote {
  id: string
  title: string
  text: string
  type: string
  checklist?: Array<{ text: string; checked: boolean }>
  createdAt: number
  updatedAt: number
}

export function SimpleNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = React.useState<SimpleNote[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newTitle, setNewTitle] = React.useState("")
  const [newContent, setNewContent] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editContent, setEditContent] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    loadNotes()
  }, [projectId])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const userEmail = localStorage.getItem("email") || ""
      
      // Load simple notes
      const simpleNotesRes = await fetch(
        `/api/simple-notes?projectId=${projectId}&userEmail=${encodeURIComponent(userEmail)}`
      )
      const simpleNotesJson = await simpleNotesRes.json()
      
      // Load canvas notes and extract them
      const canvasRes = await fetch(
        `/api/notes?projectId=${projectId}&userEmail=${encodeURIComponent(userEmail)}`
      )
      const canvasJson = await canvasRes.json()
      
      const allNotes: SimpleNote[] = []
      
      // Add simple notes
      if (simpleNotesJson.success && simpleNotesJson.data) {
        const mappedSimpleNotes: SimpleNote[] = simpleNotesJson.data.map((note: any) => ({
          id: note._id ? note._id.toString() : note.id?.toString(),
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }))
        allNotes.push(...mappedSimpleNotes)
      }
      
      // Extract canvas notes (filter out synced simple notes to avoid duplicates)
      if (canvasJson.success && canvasJson.snapshot?.notes) {
        const canvasNotes: CanvasNote[] = canvasJson.snapshot.notes.filter(
          (note: any) => !(note.source === "simple" && note.simpleNoteId)
        )
        const extractedNotes: SimpleNote[] = canvasNotes.map((note) => {
          let content = note.text

          // Convert checklist to text format
          if (note.type === "checklist" && note.checklist) {
            content = note.checklist.map(item =>
              `${item.checked ? '[x]' : '[ ]'} ${item.text}`
            ).join('\n')
          }

          return {
            id: `canvas-${note.id}`,
            title: note.title || 'Untitled Canvas Note',
            content: content || '',
            createdAt: new Date(note.createdAt).toISOString(),
            updatedAt: new Date(note.updatedAt).toISOString(),
          }
        })
        allNotes.push(...extractedNotes)
      }
      
      // Sort by updated date (newest first)
      allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      
      setNotes(allNotes)
    } catch {
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return }
    try {
      const userEmail = localStorage.getItem("email") || ""
      
      // Create in simple notes only
      const res = await fetch("/api/simple-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userEmail, title: newTitle.trim(), content: newContent.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setNotes(prev => [json.data, ...prev])
        setNewTitle(""); setNewContent(""); setAdding(false)
        toast.success("Note added")
      }
    } catch { toast.error("Failed to add note") }
  }

  const saveEdit = async (id: string) => {
    try {
      const userEmail = localStorage.getItem("email") || ""
      const res = await fetch("/api/simple-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userEmail, title: editTitle.trim(), content: editContent.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setNotes(prev => prev.map(n =>
          n.id === id
            ? { ...n, title: editTitle.trim(), content: editContent.trim(), updatedAt: new Date().toISOString() }
            : n
        ))
        setEditingId(null)
        toast.success("Note updated")
      }
    } catch { toast.error("Failed to update note") }
  }

  const deleteNote = async (id: string) => {
    // Prevent deletion of canvas-synced notes from this interface
    if (id.startsWith("canvas-")) {
      toast.info("Canvas notes must be deleted from the canvas editor.")
      return
    }

    try {
      const res = await fetch(`/api/simple-notes?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        setNotes(prev => prev.filter(n => n.id !== id))
        toast.success("Note deleted")
      }
    } catch { toast.error("Failed to delete note") }
  }

  const startEdit = (note: SimpleNote) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchQuery("")}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      {/* Add button / form */}
      {!adding ? (
        <Button variant="outline" size="sm" className="w-fit gap-2" onClick={() => setAdding(true)}>
          <PlusIcon className="size-4" /> New Note
        </Button>
      ) : (
        <div className="border rounded-lg p-4 flex flex-col gap-3 bg-card">
          <Input
            placeholder="Note title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") addNote() }}
          />
          <textarea
            className="w-full min-h-[120px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Write your note..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addNote}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewTitle(""); setNewContent("") }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading notes...</p>
      ) : filteredNotes.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-16">
          {searchQuery ? `No notes found matching "${searchQuery}"` : "No notes yet. Click \"New Note\" to get started."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotes.map((note, index) => {
            const uniqueKey = note.id || `note-${index}`
            const isEditing = editingId && editingId === uniqueKey
            
            return (
              <div key={uniqueKey} className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                {isEditing ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">Editing: {note.title}</p>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
                  <textarea
                    className="w-full min-h-[100px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(note.id)}>
                      <CheckIcon className="size-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <XIcon className="size-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-snug">{note.title}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(() => {
                        const isCanvasNote = uniqueKey && uniqueKey.startsWith('canvas-')
                        return isCanvasNote ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">Canvas</span>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(note)} title="Edit note">
                              <EditIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => deleteNote(note.id)}
                              title="Delete note"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  {note.content && (
                    <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">{note.content}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    {note.updatedAt !== note.createdAt && (
                      <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </>
              )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
