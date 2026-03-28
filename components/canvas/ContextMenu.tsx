"use client"

import * as React from "react"
import {
  Pin,
  PinOff,
  Copy,
  Trash2,
  CheckSquare,
  Link2,
  Tag,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Home,
  Target,
  Navigation,
  Check,
} from "lucide-react"
import { NoteBox, Priority } from "@/types/canvas"
import { PRIORITY_COLORS, CONTEXT_MENU_WIDTH, CONTEXT_MENU_HEIGHT } from "@/types/canvas-constants"

interface ContextMenuProps {
  x: number
  y: number
  note: NoteBox
  onClose: () => void
  onMoveToHome: () => void
  onMoveToCurrentView: () => void
  onGoToNote: () => void
  onTogglePin: () => void
  onDuplicate: () => void
  onToggleType: () => void
  onConnect: () => void
  onAddTag: () => void
  onUpdatePriority: (priority: Priority) => void
  onBringToFront: () => void
  onSendToBack: () => void
  onToggleHide: () => void
  onDelete: () => void
}

export function ContextMenu({
  x,
  y,
  note,
  onClose,
  onMoveToHome,
  onMoveToCurrentView,
  onGoToNote,
  onTogglePin,
  onDuplicate,
  onToggleType,
  onConnect,
  onAddTag,
  onUpdatePriority,
  onBringToFront,
  onSendToBack,
  onToggleHide,
  onDelete,
}: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1 overflow-y-auto hide-scrollbar context-menu-scrollable"
      style={{ 
        left: x, 
        top: y,
        width: CONTEXT_MENU_WIDTH,
        maxHeight: `min(${CONTEXT_MENU_HEIGHT}px, calc(100vh - 20px))`,
      }} 
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Navigation</div>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onMoveToHome}><Home className="size-4 text-blue-400" /> Move to Home Area</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onMoveToCurrentView}><Target className="size-4 text-green-400" /> Move to Current View</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onGoToNote}><Navigation className="size-4 text-yellow-400" /> Go to Note</button>
      
      <hr className="border-white/10 my-1" />
      <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Actions</div>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onTogglePin}>{note.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />} {note.isPinned ? "Unpin" : "Pin"}</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onDuplicate}><Copy className="size-4" /> Duplicate</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onToggleType}><CheckSquare className="size-4" /> {note.type === "checklist" ? "To Note" : "To Checklist"}</button>
      
      <hr className="border-white/10 my-1" />
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onConnect}><Link2 className="size-4" /> Connect</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onAddTag}><Tag className="size-4" /> Add Tag</button>
      
      <hr className="border-white/10 my-1" />
      <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Priority</div>
      <div className="flex px-3 py-2 gap-1.5">
        {(["none", "low", "medium", "high", "urgent"] as Priority[]).map(p => (
          <button 
            key={p} 
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${note.priority === p ? 'border-white scale-110' : 'border-transparent'}`} 
            style={{ backgroundColor: PRIORITY_COLORS[p] || '#333' }} 
            onClick={() => onUpdatePriority(p)} 
            title={p.charAt(0).toUpperCase() + p.slice(1)}
          >
            {note.priority === p && <Check className="size-3 text-white" />}
          </button>
        ))}
      </div>
      
      <hr className="border-white/10 my-1" />
      <div className="px-3 py-1.5 text-xs text-white/50 uppercase font-semibold bg-white/5">Layer</div>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onBringToFront}><Maximize2 className="size-4" /> Bring to Front</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onSendToBack}><Minimize2 className="size-4" /> Send to Back</button>
      <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-2" onClick={onToggleHide}>{note.isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {note.isHidden ? "Show" : "Hide"}</button>
      
      <hr className="border-white/10 my-1" />
      <div className="px-3 py-2 text-xs text-white/40 space-y-1">
        <div>Position: {Math.round(note.x)}, {Math.round(note.y)}</div>
        <div>Size: {Math.round(note.width)} × {Math.round(note.height)}</div>
      </div>
      
      <hr className="border-white/10 my-1" />
      <button className="w-full px-3 py-2 text-sm text-red-400 text-left hover:bg-red-500/20 flex items-center gap-2" onClick={onDelete}><Trash2 className="size-4" /> Delete</button>
    </div>
  )
}
