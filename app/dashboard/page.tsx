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
import { CheckSquareIcon, FileTextIcon, LayoutIcon, UsersIcon, ShieldCheckIcon, UserPlusIcon } from "lucide-react"
import { SimpleNotes } from "@/components/simple-notes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTable } from "@/components/users-table"
import { RolesManagement } from "@/components/roles-management"
import { AddUserForm } from "@/components/add-user-form"
import { motion, AnimatePresence } from "framer-motion"

const CanvasEditor = dynamic(
  () => import("@/app/notes/CanvasEditor").then((mod) => mod.CanvasEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="text-muted-foreground animate-pulse">Loading canvas...</div>
      </div>
    ),
  }
)

function DashboardContent() {
  const router = useRouter()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos, activeTab, setActiveTab } = useProjects()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    const storedRole = localStorage.getItem("role")
    
    if (storedEmail && storedEmail !== "undefined") {
      setIsAdmin(storedEmail === "jotirmoybhowmik1976@gmail.com" || storedRole === "admin")
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
  const showTabs = !!selectedProjectId || activeTab === "users"

  const tabs = [
    { key: "todos", label: "Todos", icon: CheckSquareIcon },
    { key: "notes", label: "Canvas", icon: LayoutIcon },
    { key: "simple-notes", label: "Notes", icon: FileTextIcon },
  ]

  const isUsersTab = activeTab === "users" && isAdmin
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
                  <h1 className="text-2xl font-semibold capitalize tracking-tight">
                    {isUsersTab ? "Management Console" : pageTitle}
                  </h1>
                  {showTabs && !isUsersTab && (
                    <div className="flex items-center gap-1 bg-muted/50 border rounded-lg p-1 shadow-sm">
                      {tabs.map(({ key, label, icon: Icon }) => (
                        <motion.button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                            activeTab === key
                              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content with Premium Framer Motion transitions */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab + (selectedProjectId || "")}
                      initial={{ opacity: 0, scale: 0.99, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 1.01, filter: "blur(2px)" }}
                      transition={{ 
                        duration: 0.2, 
                        ease: [0.22, 1, 0.36, 1] // Custom quintic easing
                      }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      {activeTab === "todos" && (
                        <DataTable todos={todosToShow} selectedProjectId={selectedProjectId} />
                      )}
                      {activeTab === "notes" && showTabs && (
                        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden relative bg-muted/20">
                          <CanvasEditor projectId={selectedProjectId} />
                        </div>
                      )}
                      {activeTab === "simple-notes" && showTabs && (
                        <SimpleNotes projectId={selectedProjectId} />
                      )}
                      {isUsersTab && (
                        <div className="flex-1 flex flex-col gap-6">
                          <Tabs defaultValue="list" className="space-y-6">
                            <TabsList className="bg-muted/50 border shadow-sm p-1 h-10">
                              <TabsTrigger 
                                value="list" 
                                className="gap-2 px-4 h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <UsersIcon className="size-3.5" />
                                Directory
                              </TabsTrigger>
                              <TabsTrigger 
                                value="roles" 
                                className="gap-2 px-4 h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <ShieldCheckIcon className="size-3.5" />
                                Roles
                              </TabsTrigger>
                              <TabsTrigger 
                                value="add" 
                                className="gap-2 px-4 h-8 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <UserPlusIcon className="size-3.5" />
                                Provisioning
                              </TabsTrigger>
                            </TabsList>
                            
                            <div className="mt-0">
                              <TabsContent value="list" className="mt-0 focus-visible:outline-none">
                                <UsersTable />
                              </TabsContent>
                              <TabsContent value="roles" className="mt-0 focus-visible:outline-none">
                                <RolesManagement />
                              </TabsContent>
                              <TabsContent value="add" className="mt-0 focus-visible:outline-none">
                                <div className="max-w-2xl">
                                  <AddUserForm />
                                </div>
                              </TabsContent>
                            </div>
                          </Tabs>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

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
