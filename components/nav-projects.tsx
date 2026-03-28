"use client"

import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  FolderIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckSquareIcon,
  FileTextIcon,
} from "lucide-react"
import { useProjects } from "./projects-context"
import { NewProjectDialog } from "./new-project-dialog"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const { projects, selectedProjectId, selectProject, setActiveTab, addProject, deleteProject } = useProjects()
  const [contextMenu, setContextMenu] = React.useState<{x:number, y:number, projectId:string} | null>(null);

  const [expandedProject, setExpandedProject] = React.useState<string | null>("1");

  const toggleExpand = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  React.useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
          Projects
        </SidebarGroupLabel>
        <NewProjectDialog onProjectCreated={(proj) => addProject(proj.name, proj.id)}>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <PlusIcon className="size-3" />
          </Button>
        </NewProjectDialog>
      </div>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton
              onClick={() => {
                selectProject(project.id)
                toggleExpand(project.id)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id })
              }}
              className={selectedProjectId === project.id ? "bg-muted" : undefined}
            >
              <FolderIcon className="size-4" />
              <span className="flex-1 capitalize">{project.name}</span>
              {expandedProject === project.id ? (
                <ChevronDownIcon className="size-3 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="size-3 text-muted-foreground" />
              )}
            </SidebarMenuButton>
            
            {/* Expanded submenu */}
            {expandedProject === project.id && (
              <SidebarMenu className="ml-6 mt-1 border-l border-border pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      selectProject(project.id)
                      setActiveTab("todos")
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckSquareIcon className="size-3.5" />
                    <span>Todos</span>
                    <span className="ml-auto text-xs text-muted-foreground">{project.todos.length}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      selectProject(project.id)
                      setActiveTab("notes")
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FileTextIcon className="size-3.5" />
                    <span>Canvas Note</span>
                    <span className="ml-auto text-xs text-muted-foreground">{project.notes}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      selectProject(project.id)
                      setActiveTab("simple-notes")
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FileTextIcon className="size-3.5" />
                    <span>Normal Note</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}

            {/* Context menu for project */}
            {contextMenu && contextMenu.projectId === project.id && (
              <div
                className="fixed bg-popover text-popover-foreground border rounded shadow-md p-1 min-w-[100px] z-50"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                  className="w-full text-left text-sm px-3 py-2 hover:bg-muted rounded"
                  onClick={() => {
                    deleteProject(project.id);
                    setContextMenu(null);
                  }}
                >
                  Delete
                </button>
              </div>
            )}

          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
