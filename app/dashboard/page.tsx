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
      <div className="flex items-center justify-center h-[600px] w-full bg-background">
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    ),
  }
)

function DashboardContent() {
  const router = useRouter()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos, activeTab, setActiveTab } = useProjects()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    if (storedEmail && storedEmail !== "undefined") {
      setEmail(storedEmail)
      toast.success("Login successful")
    } else {
      router.push('/')
    }
  }, [router])

  const pageTitle = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)?.name || 'Project'
    : 'All Todos'

  const todosToShow = selectedProjectId ? getCurrentProjectTodos() : getAllTodos()
  const showTabs = !!selectedProjectId

  const tabs = [
    { key: "todos", label: "Todos", icon: CheckSquareIcon },
    { key: "canvas", label: "Canvas", icon: LayoutIcon },
    { key: "notes", label: "Notes", icon: FileTextIcon },
  ]

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">

                {/* Header row */}
                <div className="flex items-center gap-3 mb-6">
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
                  <>
                    {activeTab === "todos" && (
                      <DataTable todos={todosToShow} selectedProjectId={selectedProjectId} />
                    )}
                    {activeTab === "canvas" && (
                      <div className="border rounded-lg overflow-hidden" style={{ height: '650px' }}>
                        <CanvasEditor projectId={selectedProjectId} />
                      </div>
                    )}
                    {activeTab === "notes" && (
                      <SimpleNotes projectId={selectedProjectId} />
                    )}
                  </>
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