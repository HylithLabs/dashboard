'use client';
import React from 'react'
import { ProjectsProvider, useProjects } from "@/components/projects-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// Inner component that uses the Projects context
function DashboardContent() {
  const router = useRouter()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos } = useProjects()
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
                <DataTable todos={todosToShow} selectedProjectId={selectedProjectId || undefined} />
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
