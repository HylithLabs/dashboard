import { GRID_SIZE } from "@/types/canvas-constants"

export const snapPosition = (value: number, snapToGrid: boolean) => 
  snapToGrid ? Math.round(value / GRID_SIZE) * GRID_SIZE : value

export const screenToWorld = (screenX: number, screenY: number, camera: { x: number, y: number }, zoom: number) => ({
  x: screenX / zoom + camera.x,
  y: screenY / zoom + camera.y,
})

export const worldToScreen = (worldX: number, worldY: number, camera: { x: number, y: number }, zoom: number) => ({
  x: (worldX - camera.x) * zoom,
  y: (worldY - camera.y) * zoom,
})

export const getMenuPosition = (
  clickX: number,
  clickY: number,
  menuWidth: number,
  menuHeight: number,
  padding: number = 10
): { x: number; y: number } => {
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
