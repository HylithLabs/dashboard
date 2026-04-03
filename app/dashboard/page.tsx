'use client';
import React from 'react'
import dynamic from "next/dynamic"
import { ProjectsProvider, useProjects } from "@/components/projects-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  UserPlusIcon,
  Home,
  Eye,
  MapPin,
  Pin,
  Copy,
  Link2,
  Palette,
  X
} from "lucide-react"
import { SimpleNotes } from "@/components/simple-notes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTable } from "@/components/users-table"
import { RolesManagement } from "@/components/roles-management"
import { AddUserForm } from "@/components/add-user-form"
import { motion, AnimatePresence } from "framer-motion"

import { useAuth } from "@/context/auth-context"

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
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const { selectedProjectId, projects, getAllTodos, getCurrentProjectTodos, activeTab } = useProjects()
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = React.useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn")
    if (justLoggedIn) {
      toast.success("Login successful")
      sessionStorage.removeItem("justLoggedIn")
    }
  }, [])

  if (authLoading || !user) return null

  const project = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
  const pageTitle = project?.name || (activeTab === "tasks-from-others" ? "Tasks from others" : "All Todos")

  const todosToShow = selectedProjectId ? getCurrentProjectTodos() : getAllTodos()
  const showTabs = !!selectedProjectId || activeTab === "users"

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
                  {showTabs && !isUsersTab && activeTab === "notes" && selectedNoteId && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-1 bg-background border rounded-lg p-1 shadow-sm"
                    >
                      {(() => {
                        const noteActions = [
                          { label: "Home", action: "home", Icon: Home },
                          { label: "View", action: "view", Icon: Eye },
                          { label: "Go", action: "goto", Icon: MapPin },
                          { label: "Pin", action: "pin", Icon: Pin },
                          { label: "Copy", action: "duplicate", Icon: Copy },
                          { label: "Link", action: "connect", Icon: Link2 },
                        ]
                        const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#06b6d4", "#f97316"]
                        return (
                          <>
                            <span className="text-xs text-muted-foreground px-2 font-medium">Note:</span>
                            {noteActions.map(({ label, action, Icon }) => (
                              <button
                                key={action}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('canvas-note-action', { detail: { action, noteId: selectedNoteId } }))
                                  setSelectedNoteId(null)
                                }}
                                className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors flex items-center gap-1.5"
                                title={label}
                              >
                                <Icon className="size-3.5 opacity-70" />
                                {label}
                              </button>
                            ))}
                            <div className="relative">
                              <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors flex items-center gap-1.5"
                              >
                                <Palette className="size-3.5 opacity-70" />
                                Color
                              </button>
                              {showColorPicker && (
                                <div className="absolute top-full right-0 mt-1 p-2 bg-background border rounded-lg shadow-lg z-50 flex gap-1">
                                  {colors.map((color) => (
                                    <button
                                      key={color}
                                      className="w-5 h-5 rounded-full border-2 border-white/30 hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      onClick={() => {
                                        window.dispatchEvent(new CustomEvent('canvas-note-action', { detail: { action: 'color', noteId: selectedNoteId, color } }))
                                        setShowColorPicker(false)
                                        setSelectedNoteId(null)
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedNoteId(null)}
                              className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                            >
                              <X className="size-3.5" />
                            </button>
                          </>
                        )
                      })()}
                    </motion.div>
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
                      {activeTab === "tasks-from-others" && (
                        <DataTable
                          todos={getAllTodos()}
                          selectedProjectId={null}
                          mode="assignments"
                        />
                      )}
                      {activeTab === "notes" && showTabs && (
                        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden relative bg-muted/20">
                          <CanvasEditor projectId={selectedProjectId} onNoteSelect={setSelectedNoteId} />
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
