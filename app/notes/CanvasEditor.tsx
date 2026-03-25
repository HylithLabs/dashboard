"use client"

import * as React from "react"
import {
  PlusIcon,
  GripVerticalIcon,
  Pin,
  PinOff,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Upload,
  Undo2,
  Redo2,
  Link2,
  CheckSquare,
  Square,
  Grid3X3,
  Maximize2,
  Minimize2,
  Clock,
  Tag,
  AlertCircle,
  Star,
  Layers,
  Eye,
  EyeOff,
  Moon,
  Sun,
  X,
  Check,
  MoreHorizontal,
  Move,
  Home,
  ArrowUp,
  ArrowDown,
  Target,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const AUTOSAVE_INTERVAL = 5000
const GRID_SIZE = 20
const MAX_HISTORY = 50
const CONTEXT_MENU_WIDTH = 220
const CONTEXT_MENU_HEIGHT = 480

type Priority = "none" | "low" | "medium" | "high" | "urgent"
type NoteType = "note" | "checklist" | "image"

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

interface NoteConnection {
  id: string
  fromNoteId: string
  toNoteId: string
  color: string
}

interface NoteBox {
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
}

interface CanvasEditorProps {
  projectId?: string
}

const COLORS = [
  "#F0B000", "#5E6AD2", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FF9F43", "#A29BFE", "#FD79A8", "#00B894",
  "#636E72", "#2D3436", "#74B9FF", "#FFEAA7", "#DFE6E9",
]

const PRIORITY_COLORS: Record<Priority, string> = {
  none: "transparent",
  low: "#00B894",
  medium: "#F0B000",
  high: "#FF9F43",
  urgent: "#FF6B6B",
}

const PRIORITY_ICONS: Record<Priority, React.ReactNode> = {
  none: null,
  low: <Star className="size-3" />,
  medium: <AlertCircle className="size-3" />,
  high: <AlertCircle className="size-3 fill-current" />,
  urgent: <AlertCircle className="size-3 fill-current animate-pulse" />,
}

const NOTE_TEMPLATES = [
  { name: "Blank Note", title: "", text: "", type: "note" as NoteType },
  { name: "To-Do List", title: "To-Do", text: "", type: "checklist" as NoteType },
  { name: "Meeting Notes", title: "Meeting Notes", text: "Date:\nAttendees:\n\nAgenda:\n- \n\nAction Items:\n- ", type: "note" as NoteType },
  { name: "Idea", title: "💡 Idea", text: "", type: "note" as NoteType },
  { name: "Bug Report", title: "🐛 Bug", text: "Description:\n\nSteps to Reproduce:\n1. \n\nExpected:\n\nActual:", type: "note" as NoteType },
]

function SixDotsIcon({ color }: { color: string }) {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-3 h-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
      ))}
    </div>
  )
}

function getMenuPosition(
  clickX: number,
  clickY: number,
  menuWidth: number,
  menuHeight: number,
  padding: number = 10
): { x: number; y: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x = clickX
  let y = clickY

  if (x + menuWidth + padding > viewportWidth) {
    x = clickX - menuWidth
  }
  if (y + menuHeight + padding > viewportHeight) {
    y = viewportHeight - menuHeight - padding
  }
  if (x < padding) x = padding
  if (y < padding) y = padding

  return { x, y }
}

function MiniMap({
  notes,
  camera,
  zoom,
  containerSize,
  onNavigate,
  darkMode,
}: {
  notes: NoteBox[]
  camera: { x: number; y: number }
  zoom: number
  containerSize: { width: number; height: number }
  onNavigate: (x: number, y: number) => void
  darkMode: boolean
}) {
  const mapWidth = 200
  const mapHeight = 150
  
  const visibleNotes = notes.filter(n => !n.isHidden)
  
  const bounds = React.useMemo(() => {
    const viewLeft = camera.x
    const viewRight = camera.x + containerSize.width / zoom
    const viewTop = camera.y
    const viewBottom = camera.y + containerSize.height / zoom
    
    let minX = viewLeft, maxX = viewRight, minY = viewTop, maxY = viewBottom
    
    visibleNotes.forEach(note => {
      minX = Math.min(minX, note.x)
      maxX = Math.max(maxX, note.x + note.width)
      minY = Math.min(minY, note.y)
      maxY = Math.max(maxY, note.y + (note.isCollapsed ? 32 : note.height))
    })
    
    const padding = 100
    return { minX: minX - padding, maxX: maxX + padding, minY: minY - padding, maxY: maxY + padding }
  }, [visibleNotes, camera, containerSize, zoom])
  
  const worldWidth = bounds.maxX - bounds.minX
  const worldHeight = bounds.maxY - bounds.minY
  const scale = Math.min((mapWidth - 20) / worldWidth, (mapHeight - 20) / worldHeight)
  
  const worldToMinimap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale + 10,
    y: (y - bounds.minY) * scale + 10,
  })
  
  const viewportWorld = { left: camera.x, top: camera.y, width: containerSize.width / zoom, height: containerSize.height / zoom }
  const viewportMinimap = worldToMinimap(viewportWorld.left, viewportWorld.top)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const worldX = (clickX - 10) / scale + bounds.minX
    const worldY = (clickY - 10) / scale + bounds.minY
    onNavigate(worldX - containerSize.width / (2 * zoom), worldY - containerSize.height / (2 * zoom))
  }

  return (
    <div
      className="absolute top-4 right-4 rounded-lg overflow-hidden cursor-pointer shadow-lg z-50"
      style={{ 
        width: mapWidth, 
        height: mapHeight,
        backgroundColor: darkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
      }}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="relative w-full h-full">
        {(() => {
          const origin = worldToMinimap(0, 0)
          if (origin.x >= 0 && origin.x <= mapWidth && origin.y >= 0 && origin.y <= mapHeight) {
            return (
              <>
                <div className="absolute w-2 h-2 rounded-full bg-red-500" style={{ left: origin.x - 4, top: origin.y - 4 }} />
                <div className="absolute h-px bg-red-500/50" style={{ left: origin.x, top: origin.y, width: 20 }} />
                <div className="absolute w-px bg-red-500/50" style={{ left: origin.x, top: origin.y, height: 20 }} />
              </>
            )
          }
          return null
        })()}
        
        {visibleNotes.map((note) => {
          const pos = worldToMinimap(note.x, note.y)
          return (
            <div
              key={note.id}
              className="absolute rounded-sm"
              style={{
                left: pos.x,
                top: pos.y,
                width: Math.max(note.width * scale, 4),
                height: Math.max((note.isCollapsed ? 32 : note.height) * scale, 3),
                backgroundColor: note.color,
                opacity: 0.9,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
          )
        })}
        
        <div
          className="absolute rounded pointer-events-none"
          style={{
            left: viewportMinimap.x,
            top: viewportMinimap.y,
            width: Math.max(viewportWorld.width * scale, 10),
            height: Math.max(viewportWorld.height * scale, 10),
            border: `2px solid ${darkMode ? '#fff' : '#000'}`,
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        />
        
        <div className="absolute bottom-1 left-1 right-1 flex justify-between text-xs px-1" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
          <span>{visibleNotes.length} notes</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

// CSS to hide scrollbar but keep functionality
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
  const [notes, setNotes] = React.useState<NoteBox[]>([])
  const [connections, setConnections] = React.useState<NoteConnection[]>([])
  const [camera, setCamera] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  
  const [isDraggingCanvas, setIsDraggingCanvas] = React.useState(false)
  const [canvasDragStart, setCanvasDragStart] = React.useState({ mouseX: 0, mouseY: 0, cameraX: 0, cameraY: 0 })
  const [draggingNote, setDraggingNote] = React.useState<string | null>(null)
  const [resizingNote, setResizingNote] = React.useState<string | null>(null)
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [editingNote, setEditingNote] = React.useState<string | null>(null)
  const [selectedNotes, setSelectedNotes] = React.useState<Set<string>>(new Set())
  const [isSpacePressed, setIsSpacePressed] = React.useState(false)
  
  const [colorPickerOpen, setColorPickerOpen] = React.useState<string | null>(null)
  const [colorPickerPos, setColorPickerPos] = React.useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; noteId: string } | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<string[]>([])
  const [searchIndex, setSearchIndex] = React.useState(0)
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false)
  const [snapToGrid, setSnapToGrid] = React.useState(false)
  const [showMiniMap, setShowMiniMap] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(true)
  const [connectingFrom, setConnectingFrom] = React.useState<string | null>(null)
  const [tagInput, setTagInput] = React.useState<{ noteId: string; value: string } | null>(null)
  
  const [history, setHistory] = React.useState<NoteBox[][]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const contextMenuRef = React.useRef<HTMLDivElement>(null)
  const lastSavedData = React.useRef<string | null>(null)
  const noteRefs = React.useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const [containerSize, setContainerSize] = React.useState({ width: 1000, height: 800 })

  const screenToWorld = React.useCallback((screenX: number, screenY: number) => ({
    x: screenX / zoom + camera.x,
    y: screenY / zoom + camera.y,
  }), [camera, zoom])

  const worldToScreen = React.useCallback((worldX: number, worldY: number) => ({
    x: (worldX - camera.x) * zoom,
    y: (worldY - camera.y) * zoom,
  }), [camera, zoom])

  const getViewportCenter = React.useCallback(() => screenToWorld(containerSize.width / 2, containerSize.height / 2), [screenToWorld, containerSize])

  const navigateToWorldPosition = React.useCallback((worldX: number, worldY: number) => {
    setCamera({ x: worldX - containerSize.width / (2 * zoom), y: worldY - containerSize.height / (2 * zoom) })
  }, [containerSize, zoom])

  const navigateToNote = React.useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      navigateToWorldPosition(note.x + note.width / 2, note.y + (note.isCollapsed ? 16 : note.height / 2))
      setSelectedNotes(new Set([noteId]))
      toast.success(`Found: ${note.title || 'Untitled note'}`)
    }
  }, [notes, navigateToWorldPosition])

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
      // Don't handle wheel if context menu or color picker is open and mouse is over them
      if (contextMenu || colorPickerOpen) {
        const target = e.target as HTMLElement
        if (target.closest('.context-menu-scrollable') || target.closest('.color-picker-popup')) {
          return // Let the menu handle its own scroll
        }
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const worldBefore = { x: mouseX / zoom + camera.x, y: mouseY / zoom + camera.y }
        
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
  }, [zoom, camera, contextMenu, colorPickerOpen])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu])

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchIndex(0)
      return
    }
    const query = searchQuery.toLowerCase()
    const results = notes
      .filter(n => !n.isHidden && (
        n.title.toLowerCase().includes(query) ||
        n.text.toLowerCase().includes(query) ||
        n.tags.some(t => t.toLowerCase().includes(query)) ||
        n.checklist.some(item => item.text.toLowerCase().includes(query))
      ))
      .map(n => n.id)
    setSearchResults(results)
    setSearchIndex(0)
    if (results.length > 0) navigateToNote(results[0])
  }, [searchQuery, notes])

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return
    const nextIndex = (searchIndex + 1) % searchResults.length
    setSearchIndex(nextIndex)
    navigateToNote(searchResults[nextIndex])
  }

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return
    const prevIndex = (searchIndex - 1 + searchResults.length) % searchResults.length
    setSearchIndex(prevIndex)
    navigateToNote(searchResults[prevIndex])
  }

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
      setHistoryIndex(prev => prev - 1)
      setNotes(JSON.parse(JSON.stringify(history[historyIndex - 1])))
      toast.info("Undone")
    }
  }, [history, historyIndex])

  const redo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setNotes(JSON.parse(JSON.stringify(history[historyIndex + 1])))
      toast.info("Redone")
    }
  }, [history, historyIndex])

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
        else if (e.key === '0') { setZoom(1); setCamera({ x: -containerSize.width / 2, y: -containerSize.height / 2 }) }
        return
      }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) { e.preventDefault(); redo() }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === 'Enter' && searchOpen) {
        e.preventDefault()
        if (e.shiftKey) goToPrevSearchResult()
        else goToNextSearchResult()
      }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); addNote() }
      if (e.key === 'Delete' && selectedNotes.size > 0) deleteSelectedNotes()
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery("")
        setColorPickerOpen(null)
        setContextMenu(null)
        setConnectingFrom(null)
        setSelectedNotes(new Set())
        setTemplateMenuOpen(false)
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        setSelectedNotes(new Set(notes.map(n => n.id)))
      }
      if (e.key === 'Home') {
        setCamera({ x: -containerSize.width / 2, y: -containerSize.height / 2 })
        setZoom(1)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false) }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp) }
  }, [undo, redo, notes, selectedNotes, searchOpen, searchResults, searchIndex, containerSize])

  React.useEffect(() => {
    const loadData = async () => {
      if (!projectId) return
      try {
        const response = await fetch(`/api/notes?projectId=${projectId}`)
        const data = await response.json()
        if (data.success && data.snapshot) {
          const loadedNotes = data.snapshot.notes || []
          setNotes(loadedNotes)
          setConnections(data.snapshot.connections || [])
          setCamera(data.snapshot.camera || { x: 0, y: 0 })
          setZoom(data.snapshot.zoom || 1)
          lastSavedData.current = JSON.stringify(data.snapshot)
          saveToHistory(loadedNotes)
          toast.success("Notes loaded")
        }
      } catch (error) { console.error("Failed to load notes:", error) }
    }
    loadData()
  }, [projectId])

  React.useEffect(() => {
    if (!projectId) return
    const saveData = async () => {
      try {
        const snapshot = { notes, connections, camera, zoom }
        const currentData = JSON.stringify(snapshot)
        if (currentData === lastSavedData.current) return
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, snapshot }),
        })
        const data = await response.json()
        if (data.success) lastSavedData.current = currentData
      } catch (error) { console.error("Failed to autosave:", error) }
    }
    const intervalId = setInterval(saveData, AUTOSAVE_INTERVAL)
    window.addEventListener("beforeunload", saveData)
    return () => { clearInterval(intervalId); window.removeEventListener("beforeunload", saveData); saveData() }
  }, [notes, connections, camera, zoom, projectId])

  const snapPosition = (value: number) => snapToGrid ? Math.round(value / GRID_SIZE) * GRID_SIZE : value
  const getMaxZIndex = () => Math.max(0, ...notes.map(n => n.zIndex))

  const addNote = (template?: typeof NOTE_TEMPLATES[0]) => {
    const now = Date.now()
    const center = getViewportCenter()
    const newNote: NoteBox = {
      id: now.toString(),
      x: snapPosition(center.x - 125),
      y: snapPosition(center.y - 75),
      width: 250,
      height: 150,
      minWidth: 150,
      minHeight: 100,
      title: template?.title || "",
      text: template?.text || "",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type: template?.type || "note",
      checklist: template?.type === "checklist" ? [{ id: `${now}-0`, text: "", checked: false }] : [],
      isPinned: false,
      isCollapsed: false,
      isHidden: false,
      priority: "none",
      tags: [],
      fontSize: 13,
      zIndex: getMaxZIndex() + 1,
      createdAt: now,
      updatedAt: now,
    }
    const newNotes = [...notes, newNote]
    setNotes(newNotes)
    saveToHistory(newNotes)
    setTemplateMenuOpen(false)
    toast.success("Note added")
  }

  const duplicateNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const now = Date.now()
    const newNote: NoteBox = { ...JSON.parse(JSON.stringify(note)), id: now.toString(), x: note.x + 30, y: note.y + 30, zIndex: getMaxZIndex() + 1, createdAt: now, updatedAt: now }
    const newNotes = [...notes, newNote]
    setNotes(newNotes)
    saveToHistory(newNotes)
    toast.success("Note duplicated")
  }

  const deleteNote = (id: string) => {
    const newNotes = notes.filter(n => n.id !== id)
    setNotes(newNotes)
    setConnections(connections.filter(c => c.fromNoteId !== id && c.toNoteId !== id))
    saveToHistory(newNotes)
  }

  const deleteSelectedNotes = () => {
    if (selectedNotes.size === 0) return
    const newNotes = notes.filter(n => !selectedNotes.has(n.id))
    setNotes(newNotes)
    setConnections(connections.filter(c => !selectedNotes.has(c.fromNoteId) && !selectedNotes.has(c.toNoteId)))
    saveToHistory(newNotes)
    setSelectedNotes(new Set())
    toast.success(`${selectedNotes.size} notes deleted`)
  }

  const updateNote = (id: string, updates: Partial<NoteBox>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
  }

  const bringToFront = (id: string) => updateNote(id, { zIndex: getMaxZIndex() + 1 })
  const sendToBack = (id: string) => updateNote(id, { zIndex: Math.min(...notes.map(n => n.zIndex)) - 1 })

  const moveNoteToHome = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const homeNotes = notes.filter(n => n.id !== noteId && n.x >= -300 && n.x <= 300 && n.y >= -300 && n.y <= 300)
    let newX = -note.width / 2, newY = -note.height / 2
    if (homeNotes.length > 0) {
      const offset = homeNotes.length * 30
      newX = (offset % 150) - 75 - note.width / 2
      newY = Math.floor(offset / 150) * 50 - 25 - note.height / 2
    }
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, x: snapPosition(newX), y: snapPosition(newY) } : n)
    setNotes(updatedNotes)
    saveToHistory(updatedNotes)
    navigateToWorldPosition(newX + note.width / 2, newY + note.height / 2)
    toast.success("Note moved to home area")
  }

  const moveNoteToCurrentView = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const center = getViewportCenter()
    const newX = snapPosition(center.x - note.width / 2)
    const newY = snapPosition(center.y - note.height / 2)
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, x: newX, y: newY } : n)
    setNotes(updatedNotes)
    saveToHistory(updatedNotes)
    toast.success("Note moved to current view")
  }

  const goToNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    navigateToWorldPosition(note.x + note.width / 2, note.y + (note.isCollapsed ? 16 : note.height / 2))
    setSelectedNotes(new Set([noteId]))
    toast.success("Navigated to note")
  }

  const togglePin = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) { updateNote(id, { isPinned: !note.isPinned }); toast.success(note.isPinned ? "Note unpinned" : "Note pinned") }
  }

  const toggleCollapse = (id: string) => { const note = notes.find(n => n.id === id); if (note) updateNote(id, { isCollapsed: !note.isCollapsed }) }
  const toggleHide = (id: string) => { const note = notes.find(n => n.id === id); if (note) updateNote(id, { isHidden: !note.isHidden }) }

  const toggleNoteType = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    if (note.type === "note") {
      const items: ChecklistItem[] = note.text.split('\n').filter(line => line.trim()).map((line, i) => ({ id: `${Date.now()}-${i}`, text: line.trim(), checked: false }))
      if (items.length === 0) items.push({ id: `${Date.now()}-0`, text: "", checked: false })
      updateNote(id, { type: "checklist", checklist: items, text: "" })
    } else {
      const text = note.checklist.map(item => `${item.checked ? '✓' : '○'} ${item.text}`).join('\n')
      updateNote(id, { type: "note", text, checklist: [] })
    }
  }

  const addChecklistItem = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    updateNote(noteId, { checklist: [...note.checklist, { id: Date.now().toString(), text: "", checked: false }] })
  }

  const updateChecklistItem = (noteId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    updateNote(noteId, { checklist: note.checklist.map(item => item.id === itemId ? { ...item, ...updates } : item) })
  }

  const removeChecklistItem = (noteId: string, itemId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const newChecklist = note.checklist.filter(item => item.id !== itemId)
    if (newChecklist.length === 0) newChecklist.push({ id: Date.now().toString(), text: "", checked: false })
    updateNote(noteId, { checklist: newChecklist })
  }

  const addTag = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note || note.tags.includes(tag)) return
    updateNote(noteId, { tags: [...note.tags, tag] })
    setTagInput(null)
  }

  const removeTag = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    updateNote(noteId, { tags: note.tags.filter(t => t !== tag) })
  }

  const createConnection = (toNoteId: string) => {
    if (!connectingFrom || connectingFrom === toNoteId) { setConnectingFrom(null); return }
    const exists = connections.some(c => (c.fromNoteId === connectingFrom && c.toNoteId === toNoteId) || (c.fromNoteId === toNoteId && c.toNoteId === connectingFrom))
    if (exists) { toast.error("Connection already exists"); setConnectingFrom(null); return }
    setConnections([...connections, { id: Date.now().toString(), fromNoteId: connectingFrom, toNoteId, color: notes.find(n => n.id === connectingFrom)?.color || "#fff" }])
    setConnectingFrom(null)
    toast.success("Notes connected")
  }

  const exportNotes = () => {
    const data = { notes, connections, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Notes exported")
  }

  const importNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const handleNoteMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (isSpacePressed) return
    e.stopPropagation()
    const note = notes.find(n => n.id === noteId)
    if (!note || note.isPinned) return
    if (connectingFrom) { createConnection(noteId); return }
    bringToFront(noteId)
    setDraggingNote(noteId)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    setDragOffset({ x: mouseWorld.x - note.x, y: mouseWorld.y - note.y })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    const note = notes.find(n => n.id === noteId)
    if (!note || note.isPinned) return
    setResizingNote(noteId)
    setResizeStart({ x: e.clientX, y: e.clientY, width: note.width, height: note.height })
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

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    if (draggingNote) {
      const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
      const newX = snapPosition(mouseWorld.x - dragOffset.x)
      const newY = snapPosition(mouseWorld.y - dragOffset.y)
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
    if (draggingNote || resizingNote) saveToHistory(notes)
    setDraggingNote(null)
    setResizingNote(null)
    setIsDraggingCanvas(false)
  }

  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const position = getMenuPosition(e.clientX, e.clientY, CONTEXT_MENU_WIDTH, CONTEXT_MENU_HEIGHT)
    setContextMenu({ x: position.x, y: position.y, noteId })
  }

  const handleColorPickerOpen = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const position = getMenuPosition(rect.left, rect.bottom + 4, 180, 120)
    setColorPickerPos(position)
    setColorPickerOpen(colorPickerOpen === noteId ? null : noteId)
  }

  const getConnectionPath = (connection: NoteConnection) => {
    const fromNote = notes.find(n => n.id === connection.fromNoteId)
    const toNote = notes.find(n => n.id === connection.toNoteId)
    if (!fromNote || !toNote) return null
    const fromX = fromNote.x + fromNote.width / 2
    const fromY = fromNote.y + (fromNote.isCollapsed ? 16 : fromNote.height / 2)
    const toX = toNote.x + toNote.width / 2
    const toY = toNote.y + (toNote.isCollapsed ? 16 : toNote.height / 2)
    const midX = (fromX + toX) / 2
    const offsetX = Math.abs(toX - fromX) / 3
    return `M ${fromX} ${fromY} Q ${fromX + offsetX} ${fromY} ${midX} ${(fromY + toY) / 2} Q ${toX - offsetX} ${toY} ${toX} ${toY}`
  }

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1))
  const resetView = () => { setZoom(1); setCamera({ x: -containerSize.width / 2, y: -containerSize.height / 2 }) }

  const bgColor = darkMode ? '#0a0a0a' : '#f5f5f5'
  const dotColor = darkMode ? '#333' : '#ccc'
  const gridLineColor = darkMode ? '#1a1a1a' : '#e0e0e0'
  const notesBgColor = darkMode ? '#1a1a1a' : '#ffffff'
  const notesBorderColor = darkMode ? '#333' : '#e0e0e0'
  const textColor = darkMode ? '#fff' : '#1a1a1a'

  const getCursor = () => {
    if (isDraggingCanvas) return 'grabbing'
    if (isSpacePressed) return 'grab'
    if (draggingNote) return 'grabbing'
    if (resizingNote) return 'se-resize'
    if (connectingFrom) return 'crosshair'
    return 'default'
  }

  const visibleNotes = notes.filter(n => !n.isHidden)

  return (
    <>
      {/* Inject scrollbar hide styles */}
      <style>{scrollbarHideStyles}</style>
      
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none"
        style={{ backgroundColor: bgColor, cursor: getCursor() }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: snapToGrid 
              ? `linear-gradient(${gridLineColor} 1px, transparent 1px), linear-gradient(90deg, ${gridLineColor} 1px, transparent 1px)`
              : `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
            backgroundSize: snapToGrid ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px` : `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${-camera.x * zoom}px ${-camera.y * zoom}px`,
          }}
        />

        <div className="absolute inset-0 canvas-bg" />

        {/* Origin */}
        {(() => {
          const originScreen = worldToScreen(0, 0)
          return (
            <div className="absolute pointer-events-none z-10" style={{ left: originScreen.x, top: originScreen.y }}>
              <div className="relative">
                <div className="w-4 h-4 bg-red-500/70 rounded-full -translate-x-2 -translate-y-2 border-2 border-red-300" />
                <div className="absolute top-0 left-0 w-12 h-0.5 bg-red-500/50" />
                <div className="absolute top-0 left-0 w-0.5 h-12 bg-red-500/50" />
                <span className="absolute top-1 left-2 text-red-400 text-xs font-mono whitespace-nowrap">0, 0</span>
              </div>
            </div>
          )
        })()}

        {/* Canvas */}
        <div className="absolute" style={{ transform: `translate(${-camera.x * zoom}px, ${-camera.y * zoom}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {/* Connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {connections.map(conn => {
              const path = getConnectionPath(conn)
              if (!path) return null
              return <path key={conn.id} d={path} fill="none" stroke={conn.color} strokeWidth={2} strokeDasharray="5,5" opacity={0.6} />
            })}
          </svg>

          {/* Notes */}
          {visibleNotes.map((note) => (
            <div
              key={note.id}
              className={`absolute rounded-lg overflow-hidden shadow-lg group/note ${selectedNotes.has(note.id) ? 'ring-2 ring-blue-500' : ''} ${connectingFrom === note.id ? 'ring-2 ring-yellow-500' : ''} ${searchResults.includes(note.id) ? 'ring-2 ring-green-500' : ''}`}
              style={{ left: note.x, top: note.y, width: note.width, minHeight: note.isCollapsed ? 32 : note.minHeight, maxHeight: note.isCollapsed ? 32 : 'none', backgroundColor: notesBgColor, border: `1px solid ${notesBorderColor}`, zIndex: note.zIndex }}
              onClick={(e) => {
                e.stopPropagation()
                if (e.shiftKey) {
                  setSelectedNotes(prev => { const newSet = new Set(prev); if (newSet.has(note.id)) newSet.delete(note.id); else newSet.add(note.id); return newSet })
                } else if (connectingFrom) { createConnection(note.id) }
              }}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
            >
              {note.priority !== "none" && <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: PRIORITY_COLORS[note.priority] }} />}

              {/* Title bar */}
              <div className="h-8 flex items-center px-2 gap-1" style={{ backgroundColor: note.color, cursor: note.isPinned ? 'not-allowed' : 'grab' }} onMouseDown={(e) => handleNoteMouseDown(e, note.id)}>
                <GripVerticalIcon className="size-4 text-white/70 flex-shrink-0" />
                {note.isPinned && <Pin className="size-3 text-white/70" />}
                {note.priority !== "none" && <span style={{ color: PRIORITY_COLORS[note.priority] }}>{PRIORITY_ICONS[note.priority]}</span>}
                <button type="button" className="p-1 rounded hover:bg-white/20 transition-colors" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleColorPickerOpen(e, note.id)}>
                  <SixDotsIcon color="rgba(255,255,255,0.7)" />
                </button>
                <input className="flex-1 bg-transparent text-white outline-none font-medium text-sm placeholder:text-white/50 min-w-0" placeholder="Title" value={note.title} onChange={(e) => updateNote(note.id, { title: e.target.value })} onMouseDown={(e) => e.stopPropagation()} style={{ cursor: 'text' }} />
                <button className="p-0.5 rounded hover:bg-white/20 text-white/70" onMouseDown={(e) => e.stopPropagation()} onClick={() => toggleCollapse(note.id)}>{note.isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}</button>
                <button className="p-0.5 rounded hover:bg-white/20 text-white/70" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleContextMenu(e, note.id)}><MoreHorizontal className="size-4" /></button>
                <button className="p-0.5 rounded hover:bg-white/20 text-white/70 hover:text-white" onMouseDown={(e) => e.stopPropagation()} onClick={() => deleteNote(note.id)}><X className="size-4" /></button>
              </div>

              {/* Content */}
              {!note.isCollapsed && (
                <div className="p-3" style={{ cursor: 'default' }} onMouseDown={(e) => e.stopPropagation()}>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${note.color}30`, color: textColor }}>
                          #{tag}<button className="hover:text-red-500" onClick={() => removeTag(note.id, tag)}><X className="size-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}

                  {note.type === "checklist" ? (
                    <div className="space-y-1">
                      {note.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group/item">
                          <button onClick={() => updateChecklistItem(note.id, item.id, { checked: !item.checked })} className="flex-shrink-0">
                            {item.checked ? <CheckSquare className="size-4" style={{ color: note.color }} /> : <Square className="size-4" style={{ color: textColor, opacity: 0.5 }} />}
                          </button>
                          <input className={`flex-1 bg-transparent outline-none text-sm ${item.checked ? 'line-through opacity-50' : ''}`} style={{ color: textColor, fontSize: note.fontSize, cursor: 'text' }} value={item.text} placeholder="New item..." onChange={(e) => updateChecklistItem(note.id, item.id, { text: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(note.id) } else if (e.key === 'Backspace' && !item.text && note.checklist.length > 1) { e.preventDefault(); removeChecklistItem(note.id, item.id) } }} />
                          <button className="opacity-0 group-hover/item:opacity-100 text-red-500 flex-shrink-0" onClick={() => removeChecklistItem(note.id, item.id)}><X className="size-3" /></button>
                        </div>
                      ))}
                      <button className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100" style={{ color: textColor }} onClick={() => addChecklistItem(note.id)}><PlusIcon className="size-4" /> Add item</button>
                    </div>
                  ) : (
                    <textarea ref={(el) => { if (el) noteRefs.current.set(note.id, el) }} className="w-full bg-transparent resize-none outline-none overflow-hidden" style={{ color: textColor, fontSize: note.fontSize, lineHeight: '1.5', minHeight: '50px', cursor: 'text' }} placeholder="Type your note..." value={note.text} onChange={(e) => { updateNote(note.id, { text: e.target.value }); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} onFocus={() => setEditingNote(note.id)} onBlur={() => setEditingNote(null)} rows={1} />
                  )}

                  {tagInput?.noteId === note.id && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="size-3" style={{ color: textColor, opacity: 0.5 }} />
                      <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: textColor, cursor: 'text' }} placeholder="Add tag..." value={tagInput.value} onChange={(e) => setTagInput({ ...tagInput, value: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.value.trim()) addTag(note.id, tagInput.value.trim()); else if (e.key === 'Escape') setTagInput(null) }} autoFocus />
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2 text-xs opacity-40" style={{ color: textColor }}><Clock className="size-3" />{new Date(note.updatedAt).toLocaleString()}</div>
                </div>
              )}

              {!note.isCollapsed && !note.isPinned && (
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group-hover/note:opacity-100 opacity-0 transition-opacity" onMouseDown={(e) => handleResizeMouseDown(e, note.id)}>
                  <svg viewBox="0 0 16 16" className="w-full h-full" style={{ color: note.color }}><path d="M14 14L8 14L14 8L14 14Z" fill="currentColor" opacity={0.5} /><path d="M14 14L11 14L14 11L14 14Z" fill="currentColor" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Position indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white/70 text-xs font-mono flex items-center gap-3 border border-white/10 z-50">
          <span className="flex items-center gap-1"><Move className="size-3" />{Math.round(camera.x)}, {Math.round(camera.y)}</span>
          <span className="text-white/30">|</span>
          <span>{Math.round(zoom * 100)}%</span>
          {isDraggingCanvas && <><span className="text-white/30">|</span><span className="text-green-400 animate-pulse">Panning</span></>}
          {isSpacePressed && <><span className="text-white/30">|</span><span className="text-blue-400">Space</span></>}
        </div>

        {/* Toolbar */}
        <div className="absolute top-14 left-4 flex items-center gap-2 z-50">
          <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} className="text-white hover:bg-white/10 rounded-none disabled:opacity-30" title="Undo"><Undo2 className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="text-white hover:bg-white/10 rounded-none disabled:opacity-30" title="Redo"><Redo2 className="size-4" /></Button>
          </div>
          <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchInputRef.current?.focus(), 50) }} className={`text-white hover:bg-white/10 rounded-none ${searchOpen ? 'bg-white/20' : ''}`} title="Search (Ctrl+F)"><Search className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setConnectingFrom(connectingFrom ? null : 'select')} className={`text-white hover:bg-white/10 rounded-none ${connectingFrom ? 'bg-yellow-500/30' : ''}`} title="Connect"><Link2 className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setSnapToGrid(!snapToGrid)} className={`text-white hover:bg-white/10 rounded-none ${snapToGrid ? 'bg-blue-500/30' : ''}`} title="Grid"><Grid3X3 className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMiniMap(!showMiniMap)} className={`text-white hover:bg-white/10 rounded-none ${showMiniMap ? 'bg-green-500/30' : ''}`} title="Minimap"><Layers className="size-4" /></Button>
          </div>
          <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
            <Button variant="ghost" size="sm" onClick={exportNotes} className="text-white hover:bg-white/10 rounded-none" title="Export"><Download className="size-4" /></Button>
            <label className="cursor-pointer" title="Import"><input type="file" accept=".json" onChange={importNotes} className="hidden" /><div className="p-2 text-white hover:bg-white/10"><Upload className="size-4" /></div></label>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className="bg-black/50 border border-white/20 text-white hover:bg-white/10" title="Theme">{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
          <Button variant="ghost" size="sm" onClick={resetView} className="bg-black/50 border border-white/20 text-white hover:bg-white/10" title="Reset (Home)"><Home className="size-4" /></Button>
        </div>

        {/* Search */}
        {searchOpen && (
          <div className="absolute top-28 left-4 flex items-center gap-2 bg-black/90 rounded-lg border border-white/20 px-3 py-2 z-50">
            <Search className="size-4 text-white/50" />
            <input ref={searchInputRef} className="bg-transparent outline-none text-white text-sm w-64" placeholder="Search notes... (Enter = next)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/50">{searchIndex + 1}/{searchResults.length}</span>
                <button onClick={goToPrevSearchResult} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="size-3 text-white/70" /></button>
                <button onClick={goToNextSearchResult} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="size-3 text-white/70" /></button>
              </div>
            )}
            {searchQuery && searchResults.length === 0 && <span className="text-xs text-red-400">No results</span>}
            <button onClick={() => { setSearchOpen(false); setSearchQuery("") }}><X className="size-4 text-white/50 hover:text-white" /></button>
          </div>
        )}

        {connectingFrom && <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm font-medium z-50">Click another note to connect • Escape to cancel</div>}

        {/* Add buttons */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 z-50">
          {templateMenuOpen && (
            <div className="absolute bottom-14 right-0 bg-black/90 border border-white/20 rounded-lg overflow-hidden shadow-xl">
              {NOTE_TEMPLATES.map((template, i) => (
                <button key={i} className="w-full px-4 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => addNote(template)}>
                  {template.type === "checklist" ? <CheckSquare className="size-4" /> : <div className="size-4" />}{template.name}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setTemplateMenuOpen(!templateMenuOpen)} className="bg-black/50 border-white/20 text-white hover:bg-white/10">Templates</Button>
          <Button className="rounded-full size-12 shadow-lg" onClick={() => addNote()} title="Add (Ctrl+N)"><PlusIcon className="size-6" /></Button>
        </div>

        {/* Zoom */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 z-50">
          <Button variant="outline" size="sm" onClick={zoomOut} className="bg-black/50 border-white/20 text-white hover:bg-white/10">−</Button>
          <span className="text-white text-sm min-w-[60px] text-center bg-black/50 px-2 py-1 rounded border border-white/20">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} className="bg-black/50 border-white/20 text-white hover:bg-white/10">+</Button>
          <Button variant="outline" size="sm" onClick={resetView} className="bg-black/50 border-white/20 text-white hover:bg-white/10">Reset</Button>
        </div>

        {/* Minimap */}
        {showMiniMap && <MiniMap notes={notes} camera={camera} zoom={zoom} containerSize={containerSize} onNavigate={(x, y) => setCamera({ x, y })} darkMode={darkMode} />}

        {/* Color picker */}
        {colorPickerOpen && (
          <div 
            className="fixed z-[100] flex flex-wrap gap-1.5 p-3 bg-gray-900 rounded-lg shadow-xl border border-gray-700 color-picker-popup" 
            style={{ left: colorPickerPos.x, top: colorPickerPos.y, maxWidth: '180px' }} 
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {COLORS.map((color) => (
              <button key={color} className="w-6 h-6 rounded-full border-2 border-white/30 hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => { updateNote(colorPickerOpen, { color }); setColorPickerOpen(null) }} />
            ))}
          </div>
        )}

        {/* Context menu - scrollable without visible scrollbar */}
        {contextMenu && (
          <div 
            ref={contextMenuRef}
            className="fixed z-[100] bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1 overflow-y-auto hide-scrollbar context-menu-scrollable"
            style={{ 
              left: contextMenu.x, 
              top: contextMenu.y,
              width: CONTEXT_MENU_WIDTH,
              maxHeight: `min(${CONTEXT_MENU_HEIGHT}px, calc(100vh - 20px))`,
            }} 
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {(() => {
              const note = notes.find(n => n.id === contextMenu.noteId)
              if (!note) return null
              return (
                <>
                  <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Navigation</div>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { moveNoteToHome(contextMenu.noteId); setContextMenu(null) }}><Home className="size-4 text-blue-400" /> Move to Home Area</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { moveNoteToCurrentView(contextMenu.noteId); setContextMenu(null) }}><Target className="size-4 text-green-400" /> Move to Current View</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { goToNote(contextMenu.noteId); setContextMenu(null) }}><Navigation className="size-4 text-yellow-400" /> Go to Note</button>
                  
                  <hr className="border-white/10 my-1" />
                  <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Actions</div>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { togglePin(contextMenu.noteId); setContextMenu(null) }}>{note.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />} {note.isPinned ? "Unpin" : "Pin"}</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { duplicateNote(contextMenu.noteId); setContextMenu(null) }}><Copy className="size-4" /> Duplicate</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { toggleNoteType(contextMenu.noteId); setContextMenu(null) }}><CheckSquare className="size-4" /> {note.type === "checklist" ? "To Note" : "To Checklist"}</button>
                  
                  <hr className="border-white/10 my-1" />
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { setConnectingFrom(contextMenu.noteId); setContextMenu(null) }}><Link2 className="size-4" /> Connect</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { setTagInput({ noteId: contextMenu.noteId, value: "" }); setContextMenu(null) }}><Tag className="size-4" /> Add Tag</button>
                  
                  <hr className="border-white/10 my-1" />
                  <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Priority</div>
                  <div className="flex px-3 py-2 gap-1.5">
                    {(["none", "low", "medium", "high", "urgent"] as Priority[]).map(p => (
                      <button key={p} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${note.priority === p ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: PRIORITY_COLORS[p] || '#333' }} onClick={() => { updateNote(contextMenu.noteId, { priority: p }); setContextMenu(null) }} title={p.charAt(0).toUpperCase() + p.slice(1)}>
                        {note.priority === p && <Check className="size-3 text-white" />}
                      </button>
                    ))}
                  </div>
                  
                  <hr className="border-white/10 my-1" />
                  <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Layer</div>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { bringToFront(contextMenu.noteId); setContextMenu(null) }}><Maximize2 className="size-4" /> Bring to Front</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { sendToBack(contextMenu.noteId); setContextMenu(null) }}><Minimize2 className="size-4" /> Send to Back</button>
                  <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={() => { toggleHide(contextMenu.noteId); setContextMenu(null) }}>{note.isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {note.isHidden ? "Show" : "Hide"}</button>
                  
                  <hr className="border-white/10 my-1" />
                  <div className="px-3 py-2 text-xs text-white/40 space-y-1">
                    <div>Position: {Math.round(note.x)}, {Math.round(note.y)}</div>
                    <div>Size: {Math.round(note.width)} × {Math.round(note.height)}</div>
                  </div>
                  
                  <hr className="border-white/10 my-1" />
                  <button className="w-full px-3 py-2 text-sm text-red-400 text-left hover:bg-red-500/20 flex items-center gap-2" onClick={() => { deleteNote(contextMenu.noteId); setContextMenu(null) }}><Trash2 className="size-4" /> Delete</button>
                </>
              )
            })()}
          </div>
        )}

        {/* Hidden notes */}
        {notes.some(n => n.isHidden) && (
          <div className="absolute bottom-20 left-6 bg-black/50 border border-white/20 rounded-lg px-3 py-2 z-50">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <EyeOff className="size-4" /> {notes.filter(n => n.isHidden).length} hidden
              <button className="text-blue-400 hover:text-blue-300" onClick={() => setNotes(notes.map(n => ({ ...n, isHidden: false })))}>Show all</button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none text-center z-50">
          Space+Drag or Middle-click to pan • Ctrl+Scroll to zoom • Ctrl+F to search • Right-click for options
        </div>
      </div>
    </>
  )
}