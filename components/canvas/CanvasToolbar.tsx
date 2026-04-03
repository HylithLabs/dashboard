"use client"

import * as React from "react"
import {
  Undo2,
  Redo2,
  Search,
  Link2,
  Grid3X3,
  Layers,
  Download,
  Upload,
  Sun,
  Moon,
  Home,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  CheckSquare,
  Users,
  Lightbulb,
  Bug,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface CanvasToolbarProps {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  searchOpen: boolean
  onToggleSearch: () => void
  isConnecting: boolean
  onToggleConnecting: () => void
  snapToGrid: boolean
  onToggleSnapToGrid: () => void
  showMiniMap: boolean
  onToggleMiniMap: () => void
  onExport: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  darkMode: boolean
  onToggleDarkMode: () => void
  onResetView: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResultsCount: number
  searchIndex: number
  onGoToPrevSearch: () => void
  onGoToNextSearch: () => void
  onAddNote: () => void
  onToggleTemplateMenu: () => void
  templateMenuOpen: boolean
  templates: { name: string; title: string; text: string; type: string }[]
}

export function CanvasToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  searchOpen,
  onToggleSearch,
  isConnecting,
  onToggleConnecting,
  snapToGrid,
  onToggleSnapToGrid,
  showMiniMap,
  onToggleMiniMap,
  onExport,
  onImport,
  darkMode,
  onToggleDarkMode,
  onResetView,
  searchQuery,
  onSearchQueryChange,
  searchResultsCount,
  searchIndex,
  onGoToPrevSearch,
  onGoToNextSearch,
  onAddNote,
  onToggleTemplateMenu,
  templateMenuOpen,
  templates,
}: CanvasToolbarProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  return (
    <>
      <div className="absolute top-14 left-4 flex items-center gap-2 z-50">
        <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
          <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} className="text-white hover:bg-white/10 rounded-none disabled:opacity-30" title="Undo"><Undo2 className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} className="text-white hover:bg-white/10 rounded-none disabled:opacity-30" title="Redo"><Redo2 className="size-4" /></Button>
        </div>
        <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
          <Button variant="ghost" size="sm" onClick={onToggleSearch} className={`text-white hover:bg-white/10 rounded-none ${searchOpen ? 'bg-white/20' : ''}`} title="Search (Ctrl+F)"><Search className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onToggleConnecting} className={`text-white hover:bg-white/10 rounded-none ${isConnecting ? 'bg-yellow-500/30' : ''}`} title="Connect"><Link2 className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onToggleSnapToGrid} className={`text-white hover:bg-white/10 rounded-none ${snapToGrid ? 'bg-blue-500/30' : ''}`} title="Grid"><Grid3X3 className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onToggleMiniMap} className={`text-white hover:bg-white/10 rounded-none ${showMiniMap ? 'bg-green-500/30' : ''}`} title="Minimap"><Layers className="size-4" /></Button>
        </div>
        <div className="flex items-center bg-black/50 rounded-lg border border-white/20 overflow-hidden">
          <Button variant="ghost" size="sm" onClick={onExport} className="text-white hover:bg-white/10 rounded-none" title="Export"><Download className="size-4" /></Button>
          <label className="cursor-pointer" title="Import">
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
            <div className="p-2 text-white hover:bg-white/10"><Upload className="size-4" /></div>
          </label>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleDarkMode} className="bg-black/50 border border-white/20 text-white hover:bg-white/10" title="Theme">{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
        <Button variant="ghost" size="sm" onClick={onResetView} className="bg-black/50 border border-white/20 text-white hover:bg-white/10" title="Reset (Home)"><Home className="size-4" /></Button>
      </div>

      {searchOpen && (
        <div className="absolute top-28 left-4 flex items-center gap-2 bg-black/90 rounded-lg border border-white/20 px-3 py-2 z-50">
          <Search className="size-4 text-white/50" />
          <input
            ref={searchInputRef}
            className="bg-transparent outline-none text-white text-sm w-64"
            placeholder="Search notes... (Enter = next)"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onGoToNextSearch() }
              if (e.key === 'Escape') { onToggleSearch() }
            }}
          />
          {searchResultsCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50">{searchIndex + 1}/{searchResultsCount}</span>
              <button onClick={onGoToPrevSearch} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="size-3 text-white/70" /></button>
              <button onClick={onGoToNextSearch} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="size-3 text-white/70" /></button>
            </div>
          )}
          {searchQuery && searchResultsCount === 0 && <span className="text-xs text-red-400">No results</span>}
          <button onClick={onToggleSearch}><X className="size-4 text-white/50 hover:text-white" /></button>
        </div>
      )}

      {templateMenuOpen && (
        <div className="absolute bottom-20 right-6 bg-black/90 border border-white/20 rounded-lg overflow-hidden shadow-xl z-50">
          {templates.map((template, i) => {
            const Icon = template.type === "checklist" ? CheckSquare : 
                        template.name === "Idea" ? Lightbulb :
                        template.name === "Bug Report" ? Bug :
                        template.name === "Meeting Notes" ? Users : FileText;
            return (
              <button
                key={i}
                className="w-full px-4 py-2 text-sm text-white text-left hover:bg-white/10 flex items-center gap-3"
                onClick={() => {
                  onAddNote()
                  onToggleTemplateMenu()
                }}
              >
                <Icon className="size-4 opacity-70" />
                {template.name}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
