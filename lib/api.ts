import { ApiResponse } from "@/types"
import { NoteBox, CanvasSnapshot, CanvasMetadata } from "@/types/canvas"

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options)
    const json = await response.json()
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
    getAll: (email?: string) => 
      apiFetch<any[]>(`/api/projects${email ? `?email=${encodeURIComponent(email)}` : ""}`),
    create: (name: string, userEmail?: string) =>
      apiFetch<any>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userEmail }),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/projects?id=${id}`, { method: "DELETE" }),
  },
  todos: {
    getAll: (userEmail?: string) =>
      apiFetch<any[]>(`/api/todos${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ""}`),
    create: (todo: any) =>
      apiFetch<any>("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      }),
    update: (id: string, updates: any) =>
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
    getAll: (projectId: string, userEmail?: string) =>
      apiFetch<CanvasSnapshot>(`/api/notes?projectId=${projectId}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ""}`),
    
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
    saveCanvasMetadata: (projectId: string, userEmail: string, metadata: CanvasMetadata) =>
      apiFetch<void>("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userEmail, metadata }),
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
    getAll: (projectId?: string, userEmail?: string) => {
      let url = "/api/simple-notes"
      const params = new URLSearchParams()
      if (projectId) params.append("projectId", projectId)
      if (userEmail) params.append("userEmail", userEmail)
      if (params.toString()) url += `?${params.toString()}`
      return apiFetch<NoteBox[]>(url)
    },
    create: (note: any) => api.notes.create(note),
    update: (id: string, updates: any) => api.notes.update(id, updates),
    delete: (id: string) => api.notes.delete(id),
  }
}
