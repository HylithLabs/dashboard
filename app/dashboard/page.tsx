'use client';
import React from 'react'
import dynamic from "next/dynamic"
import { ProjectsProvider, useProjects } from "@/components/projects-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckSquareIcon, FileTextIcon } from "lucide-react"

// Dynamically import CanvasEditor to disable SSR
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

// Inner component that uses the Projects context
function DashboardContent() {
  const router = useRouter()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos, activeTab, setActiveTab } = useProjects()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    console.log("Stored email:", storedEmail)
    if (storedEmail && storedEmail !== "undefined") {
      setEmail(storedEmail)
      toast.success("Login successful")
    } else {
      router.push('/')
    }
  }, [router])

  // Get page title based on selection
  const pageTitle = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)?.name || 'Project'
    : 'All Todos'

  // Get todos to display
  const todosToShow = selectedProjectId ? getCurrentProjectTodos() : getAllTodos()

  // Only show tabs when a specific project is selected
  const showTabs = !!selectedProjectId

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold mb-4">{pageTitle}</h1>
                
                {showTabs ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* <TabsList className="mb-4">
                      <TabsTrigger value="todos" className="gap-2">
                        <CheckSquareIcon className="size-4" />
                        Todos
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="gap-2">
                        <FileTextIcon className="size-4" />
                        Notes
                      </TabsTrigger>
                    </TabsList> */}
                    <TabsContent value="todos" className="mt-0">
                      <DataTable todos={todosToShow} selectedProjectId={selectedProjectId} />
                    </TabsContent>
                    <TabsContent value="notes" className="mt-0">
                      <div className="border rounded-lg overflow-hidden" style={{ height: '650px' }}>
                        <CanvasEditor projectId={selectedProjectId} />
                      </div>
                    </TabsContent>
                  </Tabs>
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
