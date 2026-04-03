import { ApiResponse, Todo } from "@/types"
import { NoteBox, CanvasSnapshot, CanvasMetadata } from "@/types/canvas"

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options)
    const json = await response.json()
    if (!response.ok) {
      return {
        success: false,
        message: json.message || `API error: ${response.status} ${response.statusText}`,
      }
    }
    return json
  } catch (error) {
    console.error(`API Fetch Error (${url}):`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export const api = {
  projects: {
    getAll: () => 
      apiFetch<unknown[]>(`/api/projects`),
    create: (name: string) =>
      apiFetch<unknown>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/projects?id=${id}`, { method: "DELETE" }),
  },
  todos: {
    getAll: () =>
      apiFetch<unknown[]>(`/api/todos`),
    getAssignedByMe: () =>
      apiFetch<Todo[]>(`/api/todos?mode=assigned-by-me`),
    create: (todo: Record<string, unknown>) =>
      apiFetch<unknown>("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      }),
    update: (id: string, updates: Record<string, unknown>) =>
      apiFetch<void>("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/todos?id=${id}`, { method: "DELETE" }),
  },
  notes: {
    // Unified API for all notes
    getAll: (projectId: string | null) =>
      apiFetch<CanvasSnapshot>(`/api/notes?projectId=${projectId}`),
    
    create: (note: Partial<NoteBox>) =>
      apiFetch<NoteBox>("/api/simple-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      }),
    
    update: (id: string, updates: Partial<NoteBox>) =>
      apiFetch<void>("/api/simple-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      }),
    
    delete: (id: string) =>
      apiFetch<void>(`/api/simple-notes?id=${id}`, { method: "DELETE" }),

    // Batch update for note positions/metadata
    saveCanvasMetadata: (projectId: string | null, metadata: CanvasMetadata) =>
      apiFetch<void>("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, metadata }),
      }),
    
    batchUpdateNotes: (notes: NoteBox[]) =>
      apiFetch<void>("/api/notes/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }),
  },
  // simpleNotes endpoint now just an alias for standard note CRUD
  simpleNotes: {
    getAll: (projectId?: string | null) => {
      let url = "/api/simple-notes"
      const params = new URLSearchParams()
      if (projectId) params.append("projectId", projectId)
      if (params.toString()) url += `?${params.toString()}`
      return apiFetch<NoteBox[]>(url)
    },
    create: (note: Partial<NoteBox>) => api.notes.create(note),
    update: (id: string, updates: Partial<NoteBox>) => api.notes.update(id, updates),
    delete: (id: string) => api.notes.delete(id),
  },
  users: {
    getAll: () =>
      apiFetch<unknown[]>("/api/users"),
    getOptions: () =>
      apiFetch<unknown[]>("/api/users?mode=options"),
    create: (user: Record<string, unknown>) =>
      apiFetch<unknown>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      }),
    updateRole: (email: string, role: string) =>
      apiFetch<void>("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      }),
    delete: (email: string) =>
      apiFetch<void>(`/api/users?email=${email}`, { method: "DELETE" }),
  }
}
