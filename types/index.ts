export interface Todo {
  id: string
  title: string
  description?: string
  status: "in-progress" | "done" | "cancelled" | "delayed"
  priority: "no-priority" | "urgent" | "high" | "medium" | "low"
  projectId: string
  createdAt: string
  updatedAt?: string
}

export interface Project {
  id: string
  name: string
  todos: Todo[]
  notes: number
  userEmail?: string
  createdAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
