"use client"

import * as React from "react"
import { toast } from "sonner"
import { NoteCard } from "@/components/canvas/NoteCard"
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar"
import { Minimap } from "@/components/canvas/Minimap"
import { ContextMenu } from "@/components/canvas/ContextMenu"
import { useCanvasState } from "@/hooks/use-canvas-state"
import { useCanvasEvents } from "@/hooks/use-canvas-events"
import { NoteBox, NoteConnection, Priority, ChecklistItem } from "@/types/canvas"
import { COLORS, NOTE_TEMPLATES, AUTOSAVE_INTERVAL } from "@/types/canvas-constants"
import { snapPosition, screenToWorld, worldToScreen, getMenuPosition } from "@/lib/canvas-utils"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Move, Target, Navigation, PlusIcon } from "lucide-react"

interface CanvasEditorProps {
  projectId?: string
}

const scrollbarHideStyles = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`

export function CanvasEditor({ projectId }: CanvasEditorProps) {
  const {
    notes, setNotes,
    connections, setConnections,
    camera, setCamera,
    zoom, setZoom,
    undo, redo, canUndo, canRedo,
    saveToHistory, loadData, saveData,
    isInitializing
  } = useCanvasState(projectId)

  const [containerSize, setContainerSize] = React.useState({ width: 1000, height: 800 })
  const [selectedNotes, setSelectedNotes] = React.useState<Set<string>>(new Set())
  const [draggingNote, setDraggingNote] = React.useState<string | null>(null)
  const [resizingNote, setResizingNote] = React.useState<string | null>(null)
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [isDraggingCanvas, setIsDraggingCanvas] = React.useState(false)
  const [canvasDragStart, setCanvasDragStart] = React.useState({ mouseX: 0, mouseY: 0, cameraX: 0, cameraY: 0 })
  
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; noteId: string } | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = React.useState<string | null>(null)
  const [colorPickerPos, setColorPickerPos] = React.useState({ x: 0, y: 0 })
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<string[]>([])
  const [searchIndex, setSearchIndex] = React.useState(0)
  const [snapToGrid, setSnapToGrid] = React.useState(false)
  const [showMiniMap, setShowMiniMap] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(true)
  const [connectingFrom, setConnectingFrom] = React.useState<string | null>(null)
  const [tagInput, setTagInput] = React.useState<{ noteId: string; value: string } | null>(null)

  const containerRef = React.useRef<HTMLDivElement>(null)

  const resetView = React.useCallback(() => {
    setZoom(1)
    setCamera({ x: -containerSize.width / 2, y: -containerSize.height / 2 })
  }, [containerSize])

  const addNote = React.useCallback(async (template?: typeof NOTE_TEMPLATES[0]) => {
    if (!projectId) return
    const userEmail = localStorage.getItem("email") || ""
    
    const now = Date.now()
    const center = screenToWorld(containerSize.width / 2, containerSize.height / 2, camera, zoom)
    const newNoteData: Partial<NoteBox> = {
      projectId,
      userEmail,
      x: snapPosition(center.x - 125, snapToGrid),
      y: snapPosition(center.y - 75, snapToGrid),
      width: 250,
      height: 150,
      minWidth: 150,
      minHeight: 100,
      title: template?.title || "New Note",
      text: template?.text || "",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type: (template?.type as any) || "note",
      checklist: template?.type === "checklist" ? [{ id: `${now}-0`, text: "", checked: false }] : [],
      isPinned: false,
      isCollapsed: false,
      isHidden: false,
      priority: "none",
      tags: [],
      fontSize: 13,
      zIndex: Math.max(0, ...notes.map(n => n.zIndex)) + 1,
    }

    try {
      const res = await api.notes.create(newNoteData)
      if (res.success && res.data) {
        const newNotes = [...notes, res.data]
        setNotes(newNotes)
        saveToHistory(newNotes)
        toast.success("Note added")
      } else {
        toast.error(res.message || "Failed to add note")
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast.error("An unexpected error occurred")
    }
  }, [notes, camera, zoom, containerSize, snapToGrid, setNotes, saveToHistory, projectId])

  const deleteSelectedNotes = React.useCallback(async () => {
    if (selectedNotes.size === 0) return
    
    try {
      await Promise.all(Array.from(selectedNotes).map(id => api.notes.delete(id)))
      const newNotes = notes.filter(n => !selectedNotes.has(n.id))
      setNotes(newNotes)
      setConnections(connections.filter(c => !selectedNotes.has(c.fromNoteId) && !selectedNotes.has(c.toNoteId)))
      saveToHistory(newNotes)
      setSelectedNotes(new Set())
      toast.success(`${selectedNotes.size} notes deleted`)
    } catch (error) {
      toast.error("Failed to delete some notes")
    }
  }, [selectedNotes, notes, connections, setNotes, setConnections, saveToHistory])

  const { isSpacePressed } = useCanvasEvents({
    zoom, setZoom, camera, setCamera,
    undo, redo, notes,
    selectedNotes, setSelectedNotes,
    deleteSelectedNotes, addNote,
    onSearchOpen: () => setSearchOpen(true),
    resetView, containerSize
  })

  React.useEffect(() => {
    if (!containerRef.current) return
    setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      if (contextMenu || colorPickerOpen) {
        const target = e.target as HTMLElement
        if (target.closest('.context-menu-scrollable') || target.closest('.color-picker-popup')) return
      }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const worldBefore = screenToWorld(mouseX, mouseY, camera, zoom)
        const delta = e.deltaY < 0 ? 1.15 : 0.85
        const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5)
        setZoom(newZoom)
        setCamera({ x: worldBefore.x - mouseX / newZoom, y: worldBefore.y - mouseY / newZoom })
      } else {
        e.preventDefault()
        setCamera(prev => ({ x: prev.x + e.deltaX / zoom, y: prev.y + e.deltaY / zoom }))
      }
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [zoom, camera, contextMenu, colorPickerOpen, setZoom, setCamera])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  React.useEffect(() => {
    const intervalId = setInterval(saveData, AUTOSAVE_INTERVAL)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveData()
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [saveData])

  const handleNoteMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (isSpacePressed) return
    e.stopPropagation()
    const note = notes.find(n => n.id === noteId)
    if (!note || note.isPinned) return
    if (connectingFrom) {
      if (connectingFrom !== noteId) {
        const exists = connections.some(c => (c.fromNoteId === connectingFrom && c.toNoteId === noteId) || (c.fromNoteId === noteId && c.toNoteId === connectingFrom))
        if (!exists) {
          setConnections([...connections, { id: Date.now().toString(), fromNoteId: connectingFrom, toNoteId: noteId, color: notes.find(n => n.id === connectingFrom)?.color || "#fff" }])
          toast.success("Notes connected")
        }
        setConnectingFrom(null)
      }
      return
    }
    setNotes(notes.map(n => n.id === noteId ? { ...n, zIndex: Math.max(0, ...notes.map(n2 => n2.zIndex)) + 1 } : n))
    setDraggingNote(noteId)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, camera, zoom)
    setDragOffset({ x: mouseWorld.x - note.x, y: mouseWorld.y - note.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    if (draggingNote) {
      const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, camera, zoom)
      const newX = snapPosition(mouseWorld.x - dragOffset.x, snapToGrid)
      const newY = snapPosition(mouseWorld.y - dragOffset.y, snapToGrid)
      setNotes(notes.map(n => n.id === draggingNote ? { ...n, x: newX, y: newY, updatedAt: Date.now() } : n))
    } else if (resizingNote) {
      const note = notes.find(n => n.id === resizingNote)
      if (!note) return
      const deltaX = (e.clientX - resizeStart.x) / zoom
      const deltaY = (e.clientY - resizeStart.y) / zoom
      setNotes(notes.map(n => n.id === resizingNote ? { ...n, width: Math.max(note.minWidth, resizeStart.width + deltaX), height: Math.max(note.minHeight, resizeStart.height + deltaY), updatedAt: Date.now() } : n))
    } else if (isDraggingCanvas) {
      const deltaX = e.clientX - canvasDragStart.mouseX
      const deltaY = e.clientY - canvasDragStart.mouseY
      setCamera({ x: canvasDragStart.cameraX - deltaX / zoom, y: canvasDragStart.cameraY - deltaY / zoom })
    }
  }

  const handleMouseUp = () => {
    if (draggingNote || resizingNote) {
      saveToHistory(notes)
      void saveData()
    }
    setDraggingNote(null)
    setResizingNote(null)
    setIsDraggingCanvas(false)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const isMiddleButton = e.button === 1
    const isSpacePan = isSpacePressed && e.button === 0
    const isEmptyCanvas = (e.target as HTMLElement).classList.contains('canvas-bg')
    if (isMiddleButton || isSpacePan || (e.button === 0 && isEmptyCanvas)) {
      e.preventDefault()
      setIsDraggingCanvas(true)
      setCanvasDragStart({ mouseX: e.clientX, mouseY: e.clientY, cameraX: camera.x, cameraY: camera.y })
      setContextMenu(null)
      setColorPickerOpen(null)
      setTemplateMenuOpen(false)
      if (!e.shiftKey) setSelectedNotes(new Set())
    }
  }

  const bgColor = darkMode ? '#0a0a0a' : '#f5f5f5'
  const dotColor = darkMode ? '#333' : '#ccc'
  const gridLineColor = darkMode ? '#1a1a1a' : '#e0e0e0'
  const notesBgColor = darkMode ? '#1a1a1a' : '#ffffff'
  const notesBorderColor = darkMode ? '#333' : '#e0e0e0'
  const textColor = darkMode ? '#fff' : '#1a1a1a'

  return (
    <>
      <style>{scrollbarHideStyles}</style>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none"
        style={{ backgroundColor: bgColor, cursor: isDraggingCanvas ? 'grabbing' : isSpacePressed ? 'grab' : draggingNote ? 'grabbing' : resizingNote ? 'se-resize' : connectingFrom ? 'crosshair' : 'default' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: snapToGrid 
              ? `linear-gradient(${gridLineColor} 1px, transparent 1px), linear-gradient(90deg, ${gridLineColor} 1px, transparent 1px)`
              : `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
            backgroundSize: snapToGrid ? `${20 * zoom}px ${20 * zoom}px` : `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${-camera.x * zoom}px ${-camera.y * zoom}px`,
          }}
        />
        <div className="absolute inset-0 canvas-bg" />

        <div className="absolute" style={{ transform: `translate(${-camera.x * zoom}px, ${-camera.y * zoom}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {connections.map(conn => {
              const fromNote = notes.find(n => n.id === conn.fromNoteId)
              const toNote = notes.find(n => n.id === conn.toNoteId)
              if (!fromNote || !toNote) return null
              const fromX = fromNote.x + fromNote.width / 2
              const fromY = fromNote.y + (fromNote.isCollapsed ? 16 : fromNote.height / 2)
              const toX = toNote.x + toNote.width / 2
              const toY = toNote.y + (toNote.isCollapsed ? 16 : toNote.height / 2)
              const midX = (fromX + toX) / 2
              const offsetX = Math.abs(toX - fromX) / 3
              const path = `M ${fromX} ${fromY} Q ${fromX + offsetX} ${fromY} ${midX} ${(fromY + toY) / 2} Q ${toX - offsetX} ${toY} ${toX} ${toY}`
              return <path key={conn.id} d={path} fill="none" stroke={conn.color} strokeWidth={2} strokeDasharray="5,5" opacity={0.6} />
            })}
          </svg>

          {notes.filter(n => !n.isHidden).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selected={selectedNotes.has(note.id)}
              isConnecting={connectingFrom === note.id}
              isSearchResult={searchResults.includes(note.id)}
              textColor={textColor}
              notesBgColor={notesBgColor}
              notesBorderColor={notesBorderColor}
              onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
              onResizeMouseDown={(e) => {
                e.stopPropagation()
                setResizingNote(note.id)
                setResizeStart({ x: e.clientX, y: e.clientY, width: note.width, height: note.height })
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (e.shiftKey) {
                  setSelectedNotes(prev => { const newSet = new Set(prev); if (newSet.has(note.id)) newSet.delete(note.id); else newSet.add(note.id); return newSet })
                } else if (connectingFrom) {
                   // handled in mousedown
                } else {
                  setSelectedNotes(new Set([note.id]))
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const position = getMenuPosition(e.clientX, e.clientY, 220, 480)
                setContextMenu({ x: position.x, y: position.y, noteId: note.id })
              }}
              onUpdate={(updates) => setNotes(notes.map(n => n.id === note.id ? { ...n, ...updates, updatedAt: Date.now() } : n))}
              onDelete={async () => {
                if (note.source === "simple" && note.simpleNoteId) {
                  await api.simpleNotes.delete(note.simpleNoteId)
                }
                const newNotes = notes.filter(n => n.id !== note.id)
                setNotes(newNotes)
                setConnections(connections.filter(c => c.fromNoteId !== note.id && c.toNoteId !== note.id))
                saveToHistory(newNotes)
                void saveData()
              }}
              onToggleCollapse={() => setNotes(notes.map(n => n.id === note.id ? { ...n, isCollapsed: !n.isCollapsed } : n))}
              onColorPickerOpen={(e) => {
                e.stopPropagation()
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                const position = getMenuPosition(rect.left, rect.bottom + 4, 180, 120)
                setColorPickerPos(position)
                setColorPickerOpen(colorPickerOpen === note.id ? null : note.id)
              }}
              onAddChecklistItem={() => {
                const newChecklist = [...note.checklist, { id: Date.now().toString(), text: "", checked: false }]
                setNotes(notes.map(n => n.id === note.id ? { ...n, checklist: newChecklist } : n))
              }}
              onUpdateChecklistItem={(itemId, updates) => {
                const newChecklist = note.checklist.map(item => item.id === itemId ? { ...item, ...updates } : item)
                setNotes(notes.map(n => n.id === note.id ? { ...n, checklist: newChecklist } : n))
              }}
              onRemoveChecklistItem={(itemId) => {
                const newChecklist = note.checklist.filter(item => item.id !== itemId)
                if (newChecklist.length === 0) newChecklist.push({ id: Date.now().toString(), text: "", checked: false })
                setNotes(notes.map(n => n.id === note.id ? { ...n, checklist: newChecklist } : n))
              }}
              onRemoveTag={(tag) => setNotes(notes.map(n => n.id === note.id ? { ...n, tags: n.tags.filter(t => t !== tag) } : n))}
              tagInput={tagInput?.noteId === note.id ? tagInput.value : null}
              onTagInputChange={(value) => setTagInput({ noteId: note.id, value })}
              onAddTag={(tag) => {
                if (!note.tags.includes(tag)) {
                  setNotes(notes.map(n => n.id === note.id ? { ...n, tags: [...n.tags, tag] } : n))
                }
                setTagInput(null)
              }}
              onCancelTagInput={() => setTagInput(null)}
              onSave={saveData}
            />
          ))}
        </div>

        <CanvasToolbar
          onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
          searchOpen={searchOpen} onToggleSearch={() => setSearchOpen(!searchOpen)}
          isConnecting={!!connectingFrom} onToggleConnecting={() => setConnectingFrom(connectingFrom ? null : 'select')}
          snapToGrid={snapToGrid} onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
          showMiniMap={showMiniMap} onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
          onExport={() => {
            const data = { notes, connections, exportedAt: new Date().toISOString() }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `notes-${Date.now()}.json`; a.click()
            URL.revokeObjectURL(url)
          }}
          onImport={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target?.result as string)
                if (data.notes) { setNotes(data.notes); setConnections(data.connections || []); saveToHistory(data.notes); toast.success("Notes imported") }
              } catch { toast.error("Failed to import notes") }
            }
            reader.readAsText(file)
            e.target.value = ''
          }}
          darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}
          onResetView={resetView}
          searchQuery={searchQuery} onSearchQueryChange={setSearchQuery}
          searchResultsCount={searchResults.length}
          searchIndex={searchIndex}
          onGoToPrevSearch={() => {
            const prevIndex = (searchIndex - 1 + searchResults.length) % searchResults.length
            setSearchIndex(prevIndex)
            const note = notes.find(n => n.id === searchResults[prevIndex])
            if (note) setCamera({ x: note.x - containerSize.width / (2 * zoom), y: note.y - containerSize.height / (2 * zoom) })
          }}
          onGoToNextSearch={() => {
            const nextIndex = (searchIndex + 1) % searchResults.length
            setSearchIndex(nextIndex)
            const note = notes.find(n => n.id === searchResults[nextIndex])
            if (note) setCamera({ x: note.x - containerSize.width / (2 * zoom), y: note.y - containerSize.height / (2 * zoom) })
          }}
          onAddNote={() => addNote()}
          onToggleTemplateMenu={() => setTemplateMenuOpen(!templateMenuOpen)}
          templateMenuOpen={templateMenuOpen}
          templates={NOTE_TEMPLATES}
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white/70 text-xs font-mono flex items-center gap-3 border border-white/10 z-50">
          <span className="flex items-center gap-1"><Move className="size-3" />{Math.round(camera.x)}, {Math.round(camera.y)}</span>
          <span className="text-white/30">|</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>

        <div className="absolute bottom-6 left-6 flex items-center gap-2 z-50">
          <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))} className="bg-black/50 border-white/20 text-white hover:bg-white/10">−</Button>
          <span className="text-white text-sm min-w-[60px] text-center bg-black/50 px-2 py-1 rounded border border-white/20">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))} className="bg-black/50 border-white/20 text-white hover:bg-white/10">+</Button>
        </div>

        <div className="absolute bottom-6 right-6 z-50">
          <Button className="rounded-full size-12 shadow-lg" onClick={() => addNote()} title="Add (Ctrl+N)"><PlusIcon className="size-6" /></Button>
        </div>

        {showMiniMap && <Minimap notes={notes} camera={camera} zoom={zoom} containerSize={containerSize} onNavigate={(x, y) => setCamera({ x, y })} darkMode={darkMode} />}

        {colorPickerOpen && (
          <div 
            className="fixed z-[100] flex flex-wrap gap-1.5 p-3 bg-gray-900 rounded-lg shadow-xl border border-gray-700 color-picker-popup" 
            style={{ left: colorPickerPos.x, top: colorPickerPos.y, maxWidth: '180px' }} 
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {COLORS.map((color) => (
              <button key={color} className="w-6 h-6 rounded-full border-2 border-white/30 hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => { setNotes(notes.map(n => n.id === colorPickerOpen ? { ...n, color } : n)); setColorPickerOpen(null); void saveData() }} />
            ))}
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x} y={contextMenu.y}
            note={notes.find(n => n.id === contextMenu.noteId)!}
            onClose={() => setContextMenu(null)}
            onMoveToHome={() => {
              const note = notes.find(n => n.id === contextMenu.noteId)!
              const newX = snapPosition(-note.width / 2, snapToGrid)
              const newY = snapPosition(-note.height / 2, snapToGrid)
              setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, x: newX, y: newY } : n))
              setCamera({ x: newX + note.width / 2 - containerSize.width / (2 * zoom), y: newY + note.height / 2 - containerSize.height / (2 * zoom) })
              setContextMenu(null)
            }}
            onMoveToCurrentView={() => {
              const note = notes.find(n => n.id === contextMenu.noteId)!
              const center = screenToWorld(containerSize.width / 2, containerSize.height / 2, camera, zoom)
              setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, x: snapPosition(center.x - note.width / 2, snapToGrid), y: snapPosition(center.y - note.height / 2, snapToGrid) } : n))
              setContextMenu(null)
            }}
            onGoToNote={() => {
              const note = notes.find(n => n.id === contextMenu.noteId)!
              setCamera({ x: note.x + note.width / 2 - containerSize.width / (2 * zoom), y: note.y + note.height / 2 - containerSize.height / (2 * zoom) })
              setSelectedNotes(new Set([note.id]))
              setContextMenu(null)
            }}
            onTogglePin={() => { setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, isPinned: !n.isPinned } : n)); setContextMenu(null) }}
            onDuplicate={() => {
              const note = notes.find(n => n.id === contextMenu.noteId)!
              const now = Date.now()
              const newNote = { ...JSON.parse(JSON.stringify(note)), id: now.toString(), x: note.x + 30, y: note.y + 30, createdAt: now, updatedAt: now }
              setNotes([...notes, newNote])
              setContextMenu(null)
            }}
            onToggleType={() => {
              const note = notes.find(n => n.id === contextMenu.noteId)
              if (!note) return
              if (note.type === "note") {
                const items: ChecklistItem[] = note.text.split('\n').filter(line => line.trim()).map((line, i) => ({ id: `${Date.now()}-${i}`, text: line.trim(), checked: false }))
                if (items.length === 0) items.push({ id: `${Date.now()}-0`, text: "", checked: false })
                setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, type: "checklist", checklist: items, text: "", updatedAt: Date.now() } : n))
              } else {
                const text = note.checklist.map(item => `${item.checked ? '✓' : '○'} ${item.text}`).join('\n')
                setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, type: "note", text, checklist: [], updatedAt: Date.now() } : n))
              }
              setContextMenu(null)
              void saveData()
            }}
            onConnect={() => { setConnectingFrom(contextMenu.noteId); setContextMenu(null) }}
            onAddTag={() => { setTagInput({ noteId: contextMenu.noteId, value: "" }); setContextMenu(null) }}
            onUpdatePriority={(p) => { setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, priority: p } : n)); setContextMenu(null) }}
            onBringToFront={() => { setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, zIndex: Math.max(0, ...notes.map(n2 => n2.zIndex)) + 1 } : n)); setContextMenu(null) }}
            onSendToBack={() => { setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, zIndex: Math.min(...notes.map(n2 => n2.zIndex)) - 1 } : n)); setContextMenu(null) }}
            onToggleHide={() => { setNotes(notes.map(n => n.id === contextMenu.noteId ? { ...n, isHidden: !n.isHidden } : n)); setContextMenu(null) }}
            onDelete={() => { setNotes(notes.filter(n => n.id !== contextMenu.noteId)); setContextMenu(null) }}
          />
        )}
      </div>
    </>
  )
}
