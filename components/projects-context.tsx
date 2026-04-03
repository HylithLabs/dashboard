"use client"

import * as React from "react"
import { Todo, Project } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface ProjectsContextType {
  projects: Project[]
  selectedProjectId: string | null
  selectProject: (id: string | null) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  addProject: (name: string, existingId?: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addTodo: (
    projectId: string | null,
    todo: Omit<Todo, "id" | "projectId" | "createdAt">
  ) => Promise<void>
  updateTodo: (
    projectId: string | null,
    todoId: string,
    updates: Partial<Omit<Todo, "id" | "projectId" | "createdAt">>
  ) => Promise<void>
  deleteTodo: (projectId: string | null, todoId: string) => Promise<void>
  getAllTodos: () => Todo[]
  getCurrentProjectTodos: () => Todo[]
}

const ProjectsContext = React.createContext<ProjectsContextType | undefined>(undefined)

/* ---------------- Utilities ---------------- */

type IdSource = {
  _id?: { toString(): string }
  id?: { toString(): string }
}

type ProjectRecord = IdSource & {
  name?: string
}

type TodoRecord = IdSource & {
  title?: string
  description?: string
  status?: Todo["status"]
  priority?: Todo["priority"]
  projectId?: string | null
  userEmail?: string
  assignedToEmail?: string
  assignedByEmail?: string
  createdAt?: string
  updatedAt?: string
}

const normalizeId = (obj: IdSource) =>
  obj._id?.toString() || obj.id?.toString() || ""

/* ---------------- Provider ---------------- */

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [allTodos, setAllTodos] = React.useState<Todo[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<string>("todos")

  /* ---------------- Load Projects ---------------- */

  const loadProjects = React.useCallback(async () => {
    try {
      const res = await api.projects.getAll()

      if (!res.success || !Array.isArray(res.data)) return []

      const loaded: Project[] = res.data.map((p) => {
        const project = p as ProjectRecord
        return {
        id: normalizeId(p),
        name: project.name || "",
        todos: [],
        notes: 0,
        }
      })

      setProjects(loaded)

      // safer selection logic
      setSelectedProjectId((prev) =>
        prev ?? (loaded.length ? loaded[0].id : null)
      )

      return loaded
    } catch (err) {
      console.error("Failed to load projects:", err)
      toast.error("Failed to load projects")
      return []
    }
  }, [])

  /* ---------------- Load Todos ---------------- */

  const loadTodos = React.useCallback(async () => {
    try {
      const res = await api.todos.getAll()

      if (!res.success || !Array.isArray(res.data)) return

      const todosByProject: Record<string, Todo[]> = {}
      const nextAllTodos: Todo[] = []

      res.data.forEach((t) => {
        const todo = t as TodoRecord
        const projectId = todo.projectId ? String(todo.projectId) : null
        const normalizedTodo: Todo = {
          id: normalizeId(t),
          title: todo.title || "",
          description: todo.description,
          status: todo.status || "in-progress",
          priority: todo.priority || "medium",
          projectId,
          userEmail: todo.userEmail,
          assignedToEmail: todo.assignedToEmail,
          assignedByEmail: todo.assignedByEmail,
          createdAt: todo.createdAt || new Date().toISOString(),
          updatedAt: todo.updatedAt,
        }

        nextAllTodos.push(normalizedTodo)

        if (projectId) {
          if (!todosByProject[projectId]) {
            todosByProject[projectId] = []
          }

          todosByProject[projectId].push(normalizedTodo)
        }
      })

      setAllTodos(nextAllTodos)

      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          todos: todosByProject[p.id] || [],
        }))
      )
    } catch (err) {
      console.error("Failed to load todos:", err)
      toast.error("Failed to load todos")
    }
  }, [])

  /* ---------------- Initial Load ---------------- */

  React.useEffect(() => {
    ;(async () => {
      await loadProjects()
      await loadTodos()
    })()
  }, [loadProjects, loadTodos])

  /* ---------------- Actions ---------------- */

  const selectProject = React.useCallback((id: string | null) => {
    setSelectedProjectId(id)
  }, [])

  const addProject = React.useCallback(async (name: string, existingId?: string) => {
    try {
      if (existingId) {
        setProjects((prev) => [
          ...prev,
          { id: existingId, name, todos: [], notes: 0 },
        ])
        setSelectedProjectId(existingId)
        return
      }

      const res = await api.projects.create(name)

      if (!res.success) throw new Error()

      const newId = normalizeId(res.data)

      setProjects((prev) => [
        ...prev,
        { id: newId, name, todos: [], notes: 0 },
      ])

      setSelectedProjectId(newId)
      toast.success("Project created")
    } catch {
      toast.error("Failed to create project")
    }
  }, [])

  const deleteProject = React.useCallback(async (id: string) => {
    try {
      const res = await api.projects.delete(id)
      if (!res.success) throw new Error()

      setProjects((prev) => prev.filter((p) => p.id !== id))

      setSelectedProjectId((prev) =>
        prev === id ? null : prev
      )

      toast.success("Project deleted")
    } catch {
      toast.error("Failed to delete project")
    }
  }, [])

  const addTodo = React.useCallback(async (projectId: string | null, todo: Omit<Todo, "id" | "projectId" | "createdAt">) => {
    try {
      const res = await api.todos.create({ ...todo, projectId })
      if (!res.success) throw new Error()

      const newTodo: Todo = {
        id: normalizeId(res.data),
        ...todo,
        projectId,
        userEmail: (res.data as Todo | undefined)?.userEmail || todo.assignedToEmail,
        assignedToEmail: (res.data as Todo | undefined)?.assignedToEmail || todo.assignedToEmail,
        assignedByEmail: (res.data as Todo | undefined)?.assignedByEmail || todo.assignedByEmail,
        createdAt: new Date().toISOString(),
      }

      setAllTodos((prev) => [newTodo, ...prev])

      if (projectId) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, todos: [...p.todos, newTodo] }
              : p
          )
        )
      }

      toast.success("Todo added")
    } catch {
      toast.error("Failed to add todo")
    }
  }, [])

  const updateTodo = React.useCallback(async (projectId: string | null, todoId: string, updates: Partial<Omit<Todo, "id" | "projectId" | "createdAt">>) => {
    try {
      const res = await api.todos.update(todoId, updates)
      if (!res.success) throw new Error()

      setAllTodos((prev) =>
        prev.map((t) =>
          t.id === todoId ? { ...t, ...updates } : t
        )
      )

      if (projectId) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  todos: p.todos.map((t) =>
                    t.id === todoId ? { ...t, ...updates } : t
                  ),
                }
              : p
          )
        )
      }
    } catch {
      toast.error("Failed to update todo")
    }
  }, [])

  const deleteTodo = React.useCallback(async (projectId: string | null, todoId: string) => {
    try {
      const res = await api.todos.delete(todoId)
      if (!res.success) throw new Error()

      setAllTodos((prev) => prev.filter((t) => t.id !== todoId))

      if (projectId) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, todos: p.todos.filter((t) => t.id !== todoId) }
              : p
          )
        )
      }

      toast.success("Todo deleted")
    } catch {
      toast.error("Failed to delete todo")
    }
  }, [])

  /* ---------------- Selectors ---------------- */

  const getAllTodos = React.useCallback(
    () => allTodos,
    [allTodos]
  )

  const getCurrentProjectTodos = React.useCallback(
    () =>
      projects.find((p) => p.id === selectedProjectId)?.todos || [],
    [projects, selectedProjectId]
  )

  /* ---------------- Context Value ---------------- */

  const value = React.useMemo(
    () => ({
      projects,
      selectedProjectId,
      selectProject,
      activeTab,
      setActiveTab,
      addProject,
      deleteProject,
      addTodo,
      updateTodo,
      deleteTodo,
      getAllTodos,
      getCurrentProjectTodos,
    }),
    [
      projects,
      selectedProjectId,
      activeTab,
      selectProject,
      addProject,
      deleteProject,
      addTodo,
      updateTodo,
      deleteTodo,
      getAllTodos,
      getCurrentProjectTodos,
    ]
  )

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

/* ---------------- Hook ---------------- */

export function useProjects() {
  const context = React.useContext(ProjectsContext)
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider")
  }
  return context
}
