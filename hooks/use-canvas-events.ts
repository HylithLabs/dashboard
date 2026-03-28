"use client"

import * as React from "react"
import { NoteBox } from "@/types/canvas"
import { toast } from "sonner"

interface UseCanvasEventsProps {
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  camera: { x: number; y: number }
  setCamera: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  undo: () => void
  redo: () => void
  notes: NoteBox[]
  selectedNotes: Set<string>
  setSelectedNotes: React.Dispatch<React.SetStateAction<Set<string>>>
  deleteSelectedNotes: () => void
  addNote: () => void
  onSearchOpen: () => void
  resetView: () => void
  containerSize: { width: number; height: number }
}

export function useCanvasEvents({
  zoom,
  setZoom,
  camera,
  setCamera,
  undo,
  redo,
  notes,
  selectedNotes,
  setSelectedNotes,
  deleteSelectedNotes,
  addNote,
  onSearchOpen,
  resetView,
  containerSize,
}: UseCanvasEventsProps) {
  const [isSpacePressed, setIsSpacePressed] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setIsSpacePressed(true)
      }
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault()
        if (e.key === '+' || e.key === '=') setZoom(prev => Math.min(prev * 1.2, 5))
        else if (e.key === '-') setZoom(prev => Math.max(prev / 1.2, 0.1))
        else if (e.key === '0') resetView()
        return
      }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) { e.preventDefault(); redo() }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); onSearchOpen() }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); addNote() }
      if (e.key === 'Delete' && selectedNotes.size > 0) deleteSelectedNotes()
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        setSelectedNotes(new Set(notes.map(n => n.id)))
      }
      if (e.key === 'Home') resetView()
    }
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false) }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [undo, redo, notes, selectedNotes, zoom, resetView, onSearchOpen, addNote, deleteSelectedNotes, setSelectedNotes])

  return { isSpacePressed }
}
