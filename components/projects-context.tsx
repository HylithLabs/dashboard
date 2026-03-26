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

  // Track if projects have been loaded to avoid duplicate todo loading
  const projectsLoadedRef = React.useRef(false)

  // Load projects from API
  React.useEffect(() => {
    const load = async () => {
      try {
        const userEmail = localStorage.getItem("email")
        console.log('Loading projects for user:', userEmail)
        if (!userEmail) {
          console.warn('No user email found in localStorage. Loading all projects.')
        }
        const res = await fetch(`/api/projects${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''}`)
        const json = await res.json()
        console.log('Projects response:', json)
        if (json.success && Array.isArray(json.data)) {
          const loaded: Project[] = json.data.map((p: any) => ({
            id: p._id ? p._id.toString() : p.id?.toString() ?? Math.random().toString(36).substr(2, 9),
            name: p.name,
            todos: [],
            notes: 0,
          }))
          console.log('Projects loaded:', loaded)
          setProjects(loaded)
          projectsLoadedRef.current = true
          if (!selectedProjectId && loaded.length) {
            setSelectedProjectId(loaded[0].id)
          }
        } else {
          console.error('Failed to load projects:', json)
          // Even if no projects found, mark as loaded so todos can still be attempted
          projectsLoadedRef.current = true
          setProjects([])
        }
      } catch (e) {
        console.error('Failed to load projects', e)
        projectsLoadedRef.current = true
        setProjects([])
      }
    }
    load()
  }, [])

  // Load todos for all projects - runs once after projects are loaded
  React.useEffect(() => {
    if (!projectsLoadedRef.current) return

    const loadTodos = async () => {
      try {
        const userEmail = localStorage.getItem("email")
        console.log('Loading todos for user:', userEmail)
        if (!userEmail) {
          console.warn('No user email found in localStorage. Loading all todos.')
        }
        const res = await fetch(`/api/todos${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ''}`)
        const json = await res.json()
        console.log('Todos response:', json)
        if (json.success && Array.isArray(json.data)) {
          // Create a map of todos by projectId for efficient lookup
          const todosByProject: Record<string, Todo[]> = {}

          json.data.forEach((t: any) => {
            // Ensure projectId is a string for consistent comparison
            const projectId = String(t.projectId)
            if (!todosByProject[projectId]) {
              todosByProject[projectId] = []
            }
            todosByProject[projectId].push({
              id: t._id ? t._id.toString() : t.id?.toString() ?? Math.random().toString(36).substr(2, 9),
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              projectId: projectId,
              createdAt: t.createdAt,
            })
          })

          // Update projects with their todos
          setProjects(prev => {
            const updated = prev.map(p => ({
              ...p,
              todos: todosByProject[p.id] || []
            }))
            console.log('Updated projects with todos:', updated)
            return updated
          })
        } else {
          console.error('Failed to load todos or no todos found:', json)
        }
      } catch (e) {
        console.error('Failed to load todos', e)
      }
    }
    loadTodos()
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
      const userEmail = localStorage.getItem("email")
      console.log('Creating project with userEmail:', userEmail)
      if (!userEmail) {
        console.warn('Creating project without user email - data may not persist after reload')
      }
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userEmail }),
      })
      const json = await res.json()
      console.log('Create project response:', json)
      if (json.success) {
        const newProject: Project = {
          id: json.data.id || json.data._id?.toString(),
          name,
          todos: [],
          notes: 0,
        }
        setProjects(prev => [...prev, newProject])
        setSelectedProjectId(newProject.id)
      } else {
        console.error('Failed to create project:', json)
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
      const userEmail = localStorage.getItem("email")
      console.log('Creating todo with userEmail:', userEmail, 'projectId:', projectId)
      if (!userEmail) {
        console.warn('Creating todo without user email - data may not persist after reload')
      }
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todo, projectId, userEmail }),
      })
      const json = await res.json()
      console.log('Create todo response:', json)
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
      } else {
        console.error('Failed to create todo:', json)
      }
    } catch (e) {
      console.error('Failed to add todo', e)
    }
  }

  const updateTodo = async (projectId: string, todoId: string, updates: Partial<Omit<Todo, "id" | "projectId" | "createdAt">>) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todoId, ...updates }),
      })
      const json = await res.json()
      if (json.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, todos: p.todos.map(t => t.id === todoId ? { ...t, ...updates } : t) }
            : p
        ))
      }
    } catch (e) {
      console.error('Failed to update todo', e)
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
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider")
  }
  return context
}
