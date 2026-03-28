'use client';
import React from 'react'
import dynamic from "next/dynamic"
import { ProjectsProvider, useProjects } from "@/components/projects-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckSquareIcon, FileTextIcon, LayoutIcon } from "lucide-react"
import { SimpleNotes } from "@/components/simple-notes"

const CanvasEditor = dynamic(
  () => import("@/app/notes/CanvasEditor").then((mod) => mod.CanvasEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    ),
  }
)

function DashboardContent() {
  const router = useRouter()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos, activeTab, setActiveTab } = useProjects()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    if (storedEmail && storedEmail !== "undefined") {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn")
      if (justLoggedIn) {
        toast.success("Login successful")
        sessionStorage.removeItem("justLoggedIn")
      }
      setIsLoaded(true)
    } else {
      router.push('/')
    }
  }, [router])

  if (!isLoaded) return null

  const project = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
  const pageTitle = project?.name || 'All Todos'

  const todosToShow = selectedProjectId ? getCurrentProjectTodos() : getAllTodos()
  const showTabs = !!selectedProjectId

  const tabs = [
    { key: "todos", label: "Todos", icon: CheckSquareIcon },
    { key: "notes", label: "Canvas", icon: LayoutIcon },
    { key: "simple-notes", label: "Notes", icon: FileTextIcon },
  ]

  const isCanvasMode = activeTab === "notes" && showTabs

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset className={isCanvasMode ? "overflow-hidden" : ""}>
        <SiteHeader />
        <div className={`flex flex-1 flex-col ${isCanvasMode ? "overflow-hidden" : ""}`}>
          <div className={`@container/main flex flex-1 flex-col gap-2 ${isCanvasMode ? "overflow-hidden" : ""}`}>
            <div className={`flex flex-col gap-4 py-4 md:gap-6 md:py-6 flex-1 ${isCanvasMode ? "overflow-hidden" : ""}`}>
              <div className={`px-4 lg:px-6 flex flex-col flex-1 ${isCanvasMode ? "overflow-hidden" : ""}`}>

                {/* Header row */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h1 className="text-2xl font-semibold">{pageTitle}</h1>
                  {showTabs && (
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                      {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
                            activeTab === key
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                {showTabs ? (
                  <div className={`flex-1 flex flex-col ${isCanvasMode ? "overflow-hidden" : ""}`}>
                    {activeTab === "todos" && (
                      <DataTable todos={todosToShow} selectedProjectId={selectedProjectId} />
                    )}
                    {activeTab === "notes" && (
                      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden relative bg-muted/20">
                        <CanvasEditor projectId={selectedProjectId} />
                      </div>
                    )}
                    {activeTab === "simple-notes" && (
                      <SimpleNotes projectId={selectedProjectId} />
                    )}
                  </div>
                ) : (
                  <DataTable todos={todosToShow} selectedProjectId={undefined} />
                )}

              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

export default function Page() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      } as React.CSSProperties}
    >
      <ProjectsProvider>
        <DashboardContent />
      </ProjectsProvider>
    </SidebarProvider>
  )
}
