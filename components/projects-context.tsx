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
  addTodo: (projectId: string, todo: Omit<Todo, "id" | "projectId" | "createdAt">) => Promise<void>
  updateTodo: (projectId: string, todoId: string, updates: Partial<Omit<Todo, "id" | "projectId" | "createdAt">>) => Promise<void>
  deleteTodo: (projectId: string, todoId: string) => Promise<void>
  getAllTodos: () => Todo[]
  getCurrentProjectTodos: () => Todo[]
}

const ProjectsContext = React.createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<string>("todos")
  const projectsLoadedRef = React.useRef(false)

  const loadProjects = React.useCallback(async () => {
    const userEmail = localStorage.getItem("email")
    const res = await api.projects.getAll(userEmail || undefined)
    
    if (res.success && Array.isArray(res.data)) {
      const loaded: Project[] = res.data.map((p: any) => ({
        id: p._id?.toString() || p.id?.toString(),
        name: p.name,
        todos: [],
        notes: 0,
      }))
      setProjects(loaded)
      projectsLoadedRef.current = true
      if (!selectedProjectId && loaded.length) {
        setSelectedProjectId(loaded[0].id)
      }
      return loaded
    }
    projectsLoadedRef.current = true
    return []
  }, [selectedProjectId])

  const loadTodos = React.useCallback(async (currentProjects: Project[]) => {
    const userEmail = localStorage.getItem("email")
    const res = await api.todos.getAll(userEmail || undefined)
    
    if (res.success && Array.isArray(res.data)) {
      const todosByProject: Record<string, Todo[]> = {}
      res.data.forEach((t: any) => {
        const projectId = String(t.projectId)
        if (!todosByProject[projectId]) todosByProject[projectId] = []
        todosByProject[projectId].push({
          id: t._id?.toString() || t.id?.toString(),
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          projectId: projectId,
          createdAt: t.createdAt,
        })
      })

      setProjects(prev => prev.map(p => ({
        ...p,
        todos: todosByProject[p.id] || []
      })))
    }
  }, [])

  React.useEffect(() => {
    loadProjects().then(loaded => {
      if (loaded.length > 0) loadTodos(loaded)
    })
  }, [])

  const selectProject = (id: string | null) => setSelectedProjectId(id)

  const addProject = async (name: string, existingId?: string) => {
    if (existingId) {
      setProjects(prev => [...prev, { id: existingId, name, todos: [], notes: 0 }])
      setSelectedProjectId(existingId)
      return
    }
    
    const userEmail = localStorage.getItem("email")
    const res = await api.projects.create(name, userEmail || undefined)
    if (res.success) {
      const newId = res.data.id || res.data._id?.toString()
      setProjects(prev => [...prev, { id: newId, name, todos: [], notes: 0 }])
      setSelectedProjectId(newId)
      toast.success("Project created")
    }
  }

  const deleteProject = async (id: string) => {
    const res = await api.projects.delete(id)
    if (res.success) {
      setProjects(prev => prev.filter(p => p.id !== id))
      if (selectedProjectId === id) setSelectedProjectId(null)
      toast.success("Project deleted")
    }
  }

  const addTodo = async (projectId: string, todo: Omit<Todo, "id" | "projectId" | "createdAt">) => {
    const userEmail = localStorage.getItem("email")
    const res = await api.todos.create({ ...todo, projectId, userEmail })
    if (res.success) {
      const newTodo: Todo = {
        id: res.data.id || res.data._id?.toString(),
        ...todo,
        projectId,
        createdAt: new Date().toISOString(),
      }
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, todos: [...p.todos, newTodo] } : p))
      toast.success("Todo added")
    }
  }

  const updateTodo = async (projectId: string, todoId: string, updates: Partial<Omit<Todo, "id" | "projectId" | "createdAt">>) => {
    const res = await api.todos.update(todoId, updates)
    if (res.success) {
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, todos: p.todos.map(t => t.id === todoId ? { ...t, ...updates } : t) }
          : p
      ))
    }
  }

  const deleteTodo = async (projectId: string, todoId: string) => {
    const res = await api.todos.delete(todoId)
    if (res.success) {
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, todos: p.todos.filter(t => t.id !== todoId) }
          : p
      ))
      toast.success("Todo deleted")
    }
  }

  const getAllTodos = () => projects.flatMap(p => p.todos)
  const getCurrentProjectTodos = () => projects.find(p => p.id === selectedProjectId)?.todos || []

  return (
    <ProjectsContext.Provider
      value={{
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
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = React.useContext(ProjectsContext)
  if (!context) throw new Error("useProjects must be used within ProjectsProvider")
  return context
}
