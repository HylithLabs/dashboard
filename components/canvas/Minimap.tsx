"use client"

import * as React from "react"
import { NoteBox } from "@/types/canvas"

interface MinimapProps {
  notes: NoteBox[]
  camera: { x: number; y: number }
  zoom: number
  containerSize: { width: number; height: number }
  onNavigate: (x: number, y: number) => void
  darkMode: boolean
}

export function Minimap({
  notes,
  camera,
  zoom,
  containerSize,
  onNavigate,
  darkMode,
}: MinimapProps) {
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
