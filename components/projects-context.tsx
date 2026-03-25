"use client"

import * as React from "react"

export interface Todo {
  id: string
  title: string
  description?: string
  status: "in-progress" | "done" | "cancelled" | "delayed"
  priority: "no-priority" | "urgent" | "high" | "medium" | "low"
  projectId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  todos: Todo[]
  notes: number
}

interface ProjectsContextType {
  projects: Project[]
  selectedProjectId: string | null
  selectProject: (id: string | null) => void
  addProject: (name: string, existingId?: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addTodo: (projectId: string, todo: Omit<Todo, "id" | "projectId" | "createdAt">) => Promise<void>
  deleteTodo: (projectId: string, todoId: string) => Promise<void>
  getAllTodos: () => Todo[]
  getCurrentProjectTodos: () => Todo[]
}

const ProjectsContext = React.createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)

  // Load projects from API
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/projects')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const loaded: Project[] = json.data.map((p: any) => ({
            id: p._id ? p._id.toString() : p.id?.toString() ?? Math.random().toString(36).substr(2, 9),
            name: p.name,
            todos: [],
            notes: 0,
          }))
          setProjects(loaded)
          if (!selectedProjectId && loaded.length) {
            setSelectedProjectId(loaded[0].id)
          }
        }
      } catch (e) {
        console.error('Failed to load projects', e)
      }
    }
    load()
  }, [])

  // Load todos for all projects
  React.useEffect(() => {
    const loadTodos = async () => {
      try {
        const res = await fetch('/api/todos')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const todos: Todo[] = json.data.map((t: any) => ({
            id: t._id ? t._id.toString() : t.id?.toString() ?? Math.random().toString(36).substr(2, 9),
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            projectId: t.projectId?.toString(),
            createdAt: t.createdAt,
          }))
          // Group todos by project
          setProjects(prev => prev.map(p => ({
            ...p,
            todos: todos.filter(t => t.projectId === p.id)
          })))
        }
      } catch (e) {
        console.error('Failed to load todos', e)
      }
    }
    if (projects.length > 0) {
      loadTodos()
    }
  }, [projects.length])

  const selectProject = (id: string | null) => {
    setSelectedProjectId(id)
  }

  const addProject = async (name: string, existingId?: string) => {
    // If existingId is provided, project was already created via API
    if (existingId) {
      const newProject: Project = {
        id: existingId,
        name,
        todos: [],
        notes: 0,
      }
      setProjects(prev => [...prev, newProject])
      setSelectedProjectId(newProject.id)
      return
    }
    
    // Otherwise create via API
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (json.success) {
        const newProject: Project = {
          id: json.data.id || json.data._id?.toString(),
          name,
          todos: [],
          notes: 0,
        }
        setProjects(prev => [...prev, newProject])
        setSelectedProjectId(newProject.id)
      }
    } catch (e) {
      console.error('Failed to add project', e)
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setProjects(prev => prev.filter(p => p.id !== id))
        if (selectedProjectId === id) {
          setSelectedProjectId(null)
        }
      }
    } catch (e) {
      console.error('Error deleting project', e)
    }
  }

  const addTodo = async (projectId: string, todo: Omit<Todo, "id" | "projectId" | "createdAt">) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todo, projectId }),
      })
      const json = await res.json()
      if (json.success) {
        const newTodo: Todo = {
          id: json.data.id || json.data._id?.toString(),
          ...todo,
          projectId,
          createdAt: new Date().toISOString(),
        }
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, todos: [...p.todos, newTodo] }
            : p
        ))
      }
    } catch (e) {
      console.error('Failed to add todo', e)
    }
  }

  const deleteTodo = async (projectId: string, todoId: string) => {
    try {
      const res = await fetch(`/api/todos?id=${todoId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, todos: p.todos.filter(t => t.id !== todoId) }
            : p
        ))
      }
    } catch (e) {
      console.error('Failed to delete todo', e)
    }
  }

  const getAllTodos = () => {
    return projects.flatMap(p => p.todos)
  }

  const getCurrentProjectTodos = () => {
    const project = projects.find(p => p.id === selectedProjectId)
    return project?.todos || []
  }

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectProject,
        addProject,
        deleteProject,
        addTodo,
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
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider")
  }
  return context
}
