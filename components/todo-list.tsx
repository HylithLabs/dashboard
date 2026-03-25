"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

interface Todo {
  id: string
  text: string
  completed: boolean
}

export function TodoList({ email }: { email: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`/api/todos?email=${encodeURIComponent(email)}`)
      if (response.data.success) {
        setTodos(response.data.data)
      }
    } catch (error) {
      toast.error("Failed to fetch todos")
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const response = await axios.post("/api/todos", { text: newTodo, email })
      if (response.data.success) {
        setTodos([{ id: response.data.data.id, text: newTodo, completed: false }, ...todos])
        setNewTodo("")
        toast.success("Todo added")
      }
    } catch (error) {
      toast.error("Failed to add todo")
    }
  }

  const toggleTodo = async (todo: Todo) => {
    try {
      const response = await axios.put("/api/todos", {
        id: todo.id,
        text: todo.text,
        completed: !todo.completed,
      })
      if (response.data.success) {
        setTodos(todos.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)))
        toast.success("Todo updated")
      }
    } catch (error) {
      toast.error("Failed to update todo")
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await axios.delete(`/api/todos?id=${id}`)
      if (response.data.success) {
        setTodos(todos.filter((t) => t.id !== id))
        toast.success("Todo deleted")
      }
    } catch (error) {
      toast.error("Failed to delete todo")
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">My Todo List</h2>
        <p className="text-muted-foreground">Stay organized and track your tasks</p>
      </div>

      <form onSubmit={addTodo} className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Plus />
        </Button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Loading todos...</p>
      ) : todos.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No todos yet. Add one above!</p>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo)}
                aria-label={`Mark ${todo.text} as ${todo.completed ? "incomplete" : "complete"}`}
              />
              <span
                className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {todo.text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTodo(todo.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
