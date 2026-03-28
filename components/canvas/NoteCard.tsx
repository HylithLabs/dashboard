"use client"

import * as React from "react"
import {
  GripVerticalIcon,
  Pin,
  ChevronDown,
  ChevronUp,
  X,
  MoreHorizontal,
  CheckSquare,
  Square,
  Tag,
  Clock,
  AlertCircle,
  Star,
} from "lucide-react"
import { NoteBox, Priority, ChecklistItem } from "@/types/canvas"
import { PRIORITY_COLORS } from "@/types/canvas-constants"

interface NoteCardProps {
  note: NoteBox
  selected: boolean
  isConnecting: boolean
  isSearchResult: boolean
  textColor: string
  notesBgColor: string
  notesBorderColor: string
  onMouseDown: (e: React.MouseEvent) => void
  onResizeMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<NoteBox>) => void
  onDelete: () => void
  onToggleCollapse: () => void
  onColorPickerOpen: (e: React.MouseEvent) => void
  onAddChecklistItem: () => void
  onUpdateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => void
  onRemoveChecklistItem: (itemId: string) => void
  onRemoveTag: (tag: string) => void
  tagInput: string | null
  onTagInputChange: (value: string) => void
  onAddTag: (tag: string) => void
  onCancelTagInput: () => void
  onSave: () => void
}

const PRIORITY_ICONS: Record<Priority, React.ReactNode> = {
  none: null,
  low: <Star className="size-3" />,
  medium: <AlertCircle className="size-3" />,
  high: <AlertCircle className="size-3 fill-current" />,
  urgent: <AlertCircle className="size-3 fill-current animate-pulse" />,
}

function SixDotsIcon({ color }: { color: string }) {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-3 h-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
      ))}
    </div>
  )
}

export function NoteCard({
  note,
  selected,
  isConnecting,
  isSearchResult,
  textColor,
  notesBgColor,
  notesBorderColor,
  onMouseDown,
  onResizeMouseDown,
  onClick,
  onContextMenu,
  onUpdate,
  onDelete,
  onToggleCollapse,
  onColorPickerOpen,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onRemoveChecklistItem,
  onRemoveTag,
  tagInput,
  onTagInputChange,
  onAddTag,
  onCancelTagInput,
  onSave,
}: NoteCardProps) {
  const noteRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (noteRef.current && !note.isCollapsed) {
      noteRef.current.style.height = 'auto'
      noteRef.current.style.height = noteRef.current.scrollHeight + 'px'
    }
  }, [note.text, note.isCollapsed])

  return (
    <div
      className={`absolute rounded-lg overflow-hidden shadow-lg group/note ${selected ? 'ring-2 ring-blue-500' : ''} ${isConnecting ? 'ring-2 ring-yellow-500' : ''} ${isSearchResult ? 'ring-2 ring-green-500' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.isCollapsed ? 32 : note.minHeight,
        maxHeight: note.isCollapsed ? 32 : 'none',
        backgroundColor: notesBgColor,
        border: `1px solid ${notesBorderColor}`,
        zIndex: note.zIndex
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {note.priority !== "none" && <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: PRIORITY_COLORS[note.priority] }} />}

      {/* Title bar */}
      <div
        className="h-8 flex items-center px-2 gap-1"
        style={{ backgroundColor: note.color, cursor: note.isPinned ? 'not-allowed' : 'grab' }}
        onMouseDown={onMouseDown}
      >
        <GripVerticalIcon className="size-4 text-white/70 flex-shrink-0" />
        {note.isPinned && <Pin className="size-3 text-white/70" />}
        {note.priority !== "none" && <span style={{ color: PRIORITY_COLORS[note.priority] }}>{PRIORITY_ICONS[note.priority]}</span>}
        <button
          type="button"
          className="p-1 rounded hover:bg-white/20 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onColorPickerOpen}
        >
          <SixDotsIcon color="rgba(255,255,255,0.7)" />
        </button>
        <input
          className="flex-1 bg-transparent text-white outline-none font-medium text-sm placeholder:text-white/50 min-w-0"
          placeholder="Title"
          value={note.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={onSave}
          style={{ cursor: 'text' }}
        />
        <button className="p-0.5 rounded hover:bg-white/20 text-white/70" onMouseDown={(e) => e.stopPropagation()} onClick={onToggleCollapse}>
          {note.isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
        <button className="p-0.5 rounded hover:bg-white/20 text-white/70" onMouseDown={(e) => e.stopPropagation()} onClick={onContextMenu}>
          <MoreHorizontal className="size-4" />
        </button>
        <button className="p-0.5 rounded hover:bg-white/20 text-white/70 hover:text-white" onMouseDown={(e) => e.stopPropagation()} onClick={onDelete}>
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      {!note.isCollapsed && (
        <div className="p-3" style={{ cursor: 'default' }} onMouseDown={(e) => e.stopPropagation()}>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${note.color}30`, color: textColor }}>
                  #{tag}
                  <button className="hover:text-red-500" onClick={() => onRemoveTag(tag)}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {note.type === "checklist" ? (
            <div className="space-y-1">
              {note.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group/item">
                  <button onClick={() => onUpdateChecklistItem(item.id, { checked: !item.checked })} className="flex-shrink-0">
                    {item.checked ? <CheckSquare className="size-4" style={{ color: note.color }} /> : <Square className="size-4" style={{ color: textColor, opacity: 0.5 }} />}
                  </button>
                  <input
                    className={`flex-1 bg-transparent outline-none text-sm ${item.checked ? 'line-through opacity-50' : ''}`}
                    style={{ color: textColor, fontSize: note.fontSize, cursor: 'text' }}
                    value={item.text}
                    placeholder="New item..."
                    onChange={(e) => onUpdateChecklistItem(item.id, { text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onAddChecklistItem()
                      } else if (e.key === 'Backspace' && !item.text && note.checklist.length > 1) {
                        e.preventDefault()
                        onRemoveChecklistItem(item.id)
                      }
                    }}
                    onBlur={onSave}
                  />
                  <button className="opacity-0 group-hover/item:opacity-100 text-red-500 flex-shrink-0" onClick={() => onRemoveChecklistItem(item.id)}>
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <button className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100" style={{ color: textColor }} onClick={onAddChecklistItem}>
                <PlusIcon className="size-4" /> Add item
              </button>
            </div>
          ) : (
            <textarea
              ref={noteRef}
              className="w-full bg-transparent resize-none outline-none overflow-hidden"
              style={{ color: textColor, fontSize: note.fontSize, lineHeight: '1.5', minHeight: '50px', cursor: 'text' }}
              placeholder="Type your note..."
              value={note.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              onBlur={onSave}
              rows={1}
            />
          )}

          {tagInput !== null && (
            <div className="flex items-center gap-1 mt-2">
              <Tag className="size-3" style={{ color: textColor, opacity: 0.5 }} />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: textColor, cursor: 'text' }}
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    onAddTag(tagInput.trim())
                  } else if (e.key === 'Escape') {
                    onCancelTagInput()
                  }
                }}
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center gap-1 mt-2 text-xs opacity-40" style={{ color: textColor }}>
            <Clock className="size-3" />
            {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {!note.isCollapsed && !note.isPinned && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group-hover/note:opacity-100 opacity-0 transition-opacity"
          onMouseDown={onResizeMouseDown}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full" style={{ color: note.color }}>
            <path d="M14 14L8 14L14 8L14 14Z" fill="currentColor" opacity={0.5} />
            <path d="M14 14L11 14L14 11L14 14Z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
