"use client"

import * as React from "react"
import { NoteBox, NoteConnection, CanvasSnapshot, CanvasMetadata } from "@/types/canvas"
import { MAX_HISTORY } from "@/types/canvas-constants"
import { api } from "@/lib/api"
import { toast } from "sonner"
export function useCanvasState(projectId?: string | null) {
  const [notes, setNotes] = React.useState<NoteBox[]>([])
  const [connections, setConnections] = React.useState<NoteConnection[]>([])
  const [camera, setCamera] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)

  const [history, setHistory] = React.useState<NoteBox[][]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)

  const isInitializing = React.useRef(true)
  const lastSavedNotes = React.useRef<string | null>(null)
  const lastSavedMetadata = React.useRef<string | null>(null)

  const saveToHistory = React.useCallback((newNotes: NoteBox[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newNotes)))
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])

  const undo = React.useCallback(() => {
    if (historyIndex > 0) {
      const prevNotes = JSON.parse(JSON.stringify(history[historyIndex - 1]))
      setNotes(prevNotes)
      setHistoryIndex(prev => prev - 1)
      toast.info("Undone")
    }
  }, [history, historyIndex])

  const redo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextNotes = JSON.parse(JSON.stringify(history[historyIndex + 1]))
      setNotes(nextNotes)
      setHistoryIndex(prev => prev + 1)
      toast.info("Redone")
    }
  }, [history, historyIndex])

  const loadData = React.useCallback(async () => {
    if (!projectId) return
    try {
      const res = await api.notes.getAll(projectId)
      
      if (res.success && res.data) {
        const { notes: loadedNotes, metadata } = res.data
        setNotes(loadedNotes || [])
        setConnections(metadata.connections || [])
        setCamera(metadata.camera || { x: 0, y: 0 })
        setZoom(metadata.zoom || 1)
        
        lastSavedNotes.current = JSON.stringify(loadedNotes)
        lastSavedMetadata.current = JSON.stringify(metadata)
        setHistory([JSON.parse(JSON.stringify(loadedNotes || []))])
        setHistoryIndex(0)
      }
    } catch (error) {
      console.error("Failed to load notes:", error)
    } finally {
      isInitializing.current = false
    }
  }, [projectId])

  const saveData = React.useCallback(async () => {
    if (!projectId || isInitializing.current) return
    try {
      // 1. Save Metadata (Connections, Camera, Zoom)
      const metadata: CanvasMetadata = { connections, camera, zoom }
      const metadataStr = JSON.stringify(metadata)
      if (metadataStr !== lastSavedMetadata.current) {
        const res = await api.notes.saveCanvasMetadata(projectId, metadata)
        if (res.success) lastSavedMetadata.current = metadataStr
      }

      // 2. Save Note positions/layout (Batch update)
      const notesStr = JSON.stringify(notes)
      if (notesStr !== lastSavedNotes.current) {
        const res = await api.notes.batchUpdateNotes(notes)
        if (res.success) lastSavedNotes.current = notesStr
      }
    } catch (error) {
      console.error("Failed to save data:", error)
    }
  }, [notes, connections, camera, zoom, projectId])

  return {
    notes, setNotes,
    connections, setConnections,
    camera, setCamera,
    zoom, setZoom,
    undo, redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    saveToHistory, loadData, saveData,
    isInitializing: isInitializing.current
  }
}
