import { Priority, NoteType } from "./canvas"

export const COLORS = [
  "#6B7280", // slate gray (anchor)
  "#3A5CCC", // muted blue
  "#2F4F9D", // deep steel blue
  "#4C6EF5", // controlled indigo
  "#3F8F8B", // muted teal
  "#2C7A7B", // deep teal
  "#3B6B7D", // blue-gray
  "#6D5FA6", // dusty purple
  "#7C6ACF", // soft violet
  "#B7791F", // muted amber
  "#9C6B30", // warm bronze
  "#4A5568", // cool gray alt
  "#2D3748", // dark slate
  "#718096", // soft gray 
  "#2D3436"
]

export const PRIORITY_COLORS: Record<Priority, string> = {
  none: "transparent",
  low: "#00B894",
  medium: "#F0B000",
  high: "#FF9F43",
  urgent: "#FF6B6B",
}

export const NOTE_TEMPLATES = [
  { name: "Blank Note", title: "", text: "", type: "note" as NoteType },
  { name: "To-Do List", title: "To-Do", text: "", type: "checklist" as NoteType },
  { name: "Meeting Notes", title: "Meeting Notes", text: "Date:\nAttendees:\n\nAgenda:\n- \n\nAction Items:\n- ", type: "note" as NoteType },
  { name: "Idea", title: "Idea", text: "", type: "note" as NoteType },
  { name: "Bug Report", title: "Bug", text: "Description:\n\nSteps to Reproduce:\n1. \n\nExpected:\n\nActual:", type: "note" as NoteType },
]

export const GRID_SIZE = 20
export const AUTOSAVE_INTERVAL = 5000
export const MAX_HISTORY = 50
export const CONTEXT_MENU_WIDTH = 220
export const CONTEXT_MENU_HEIGHT = 480
