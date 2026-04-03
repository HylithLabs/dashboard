"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { XIcon } from "lucide-react"
import { toast } from "sonner"

export type ProjectCreated = { id: string; name: string }

interface NewProjectDialogProps {
  children?: React.ReactNode
  onProjectCreated?: (proj: ProjectCreated) => void
}

export function NewProjectDialog({ children, onProjectCreated }: NewProjectDialogProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Project name required")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Project created")
        onProjectCreated?.({ id: json.data.id, name: json.data.name })
        setOpen(false)
        setName("")
      } else {
        toast.error(json.message ?? "Failed to create project")
      }
    } catch (err) {
      console.error("Project creation error:", err)
      toast.error("Error creating project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{children || <Button variant="outline" size="sm">New Project</Button>}</DrawerTrigger>
      <DrawerContent className="sm:max-w-xl">
        <DrawerDescription className="sr-only">Create a new project</DrawerDescription>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerHeader className="border-b px-4 py-3 flex flex-row items-center justify-between gap-4">
            <DrawerTitle className="text-lg font-medium">Create Project</DrawerTitle>
            <div className="flex items-center gap-1">
              <DrawerClose asChild>
                <Button type="button" variant="ghost" size="icon" className="size-7">
                  <XIcon className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <Input
              placeholder="Project name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DrawerFooter className="border-t px-4 py-3 flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DrawerClose>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>Create</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
