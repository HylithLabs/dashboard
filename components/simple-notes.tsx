"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, Trash2Icon, EditIcon, CheckIcon, XIcon, Search, LayoutIcon } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { NoteBox } from "@/types/canvas"

export function SimpleNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = React.useState<NoteBox[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newTitle, setNewTitle] = React.useState("")
  const [newContent, setNewContent] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editContent, setEditContent] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")

  const loadNotes = React.useCallback(async () => {
    setLoading(true)
    try {
      const userEmail = localStorage.getItem("email") || ""
      const res = await api.simpleNotes.getAll(projectId, userEmail)
      
      if (res.success && res.data) {
        setNotes(res.data)
      }
    } catch (error) {
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const addNote = async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return }
    try {
      const userEmail = localStorage.getItem("email") || ""
      const res = await api.simpleNotes.create({ 
        projectId, 
        userEmail, 
        title: newTitle.trim(), 
        text: newContent.trim() 
      })
      if (res.success && res.data) {
        setNotes(prev => [res.data!, ...prev])
        setNewTitle(""); setNewContent(""); setAdding(false)
        toast.success("Note added")
      }
    } catch { toast.error("Failed to add note") }
  }

  const saveEdit = async (id: string) => {
    try {
      const res = await api.simpleNotes.update(id, { 
        title: editTitle.trim(), 
        text: editContent.trim() 
      })
      if (res.success) {
        setNotes(prev => prev.map(n =>
          n.id === id
            ? { ...n, title: editTitle.trim(), text: editContent.trim(), updatedAt: Date.now() }
            : n
        ))
        setEditingId(null)
        toast.success("Note updated")
      }
    } catch { toast.error("Failed to update note") }
  }

  const deleteNote = async (id: string) => {
    try {
      const res = await api.simpleNotes.delete(id)
      if (res.success) {
        setNotes(prev => prev.filter(n => n.id !== id))
        toast.success("Note deleted")
      }
    } catch { toast.error("Failed to delete note") }
  }

  const startEdit = (note: NoteBox) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.text)
  }

  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.text.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search all notes..."
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

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading notes...</p>
      ) : filteredNotes.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-16">
          {searchQuery ? `No notes found matching "${searchQuery}"` : "No notes yet. Start writing!"}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotes.map((note) => {
            const isEditing = editingId === note.id
            
            return (
              <div key={note.id} className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors group">
                {isEditing ? (
                <div className="flex flex-col gap-3">
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
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-base leading-snug">{note.title}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                           <LayoutIcon className="size-2.5" /> Canvas Linked
                         </span>
                         {note.priority !== "none" && (
                           <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: note.color }}>
                             {note.priority}
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(note)}>
                        <EditIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {note.text && (
                    <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap line-clamp-3">
                      {note.type === "checklist" ? 
                        note.checklist.map(i => `${i.checked ? '✓' : '○'} ${i.text}`).join('\n') : 
                        note.text
                      }
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground uppercase tracking-tight">
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
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
