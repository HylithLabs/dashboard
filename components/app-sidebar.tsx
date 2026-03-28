"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"

import {
  LayoutDashboardIcon,
  SettingsIcon,
  ChevronRightIcon,
  UserPlusIcon,
} from "lucide-react"
import { NavProjects } from "./nav-projects"
import { useProjects } from "./projects-context"
import { useEffect } from "react"
import { useState } from "react"
import Link from "next/link"

const ADMIN_EMAIL = "jotirmoybhowmik1976@gmail.com"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { selectProject, setActiveTab, activeTab, selectedProjectId } = useProjects()

  const [storedEmail, setstoredEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState("")

  useEffect(() => {
    const email = localStorage.getItem("email")
    const userRole = localStorage.getItem("role")
    setstoredEmail(email || "")
    setRole(userRole || "")
    setIsAdmin(email === ADMIN_EMAIL || userRole === "admin")
  }, [])

  // Only show Users tab for admin
  const bottomItems = [
    ...(isAdmin ? [{ 
      title: "Users", 
      icon: UserPlusIcon, 
      onClick: () => {
        selectProject(null)
        setActiveTab("users")
      },
      isActive: activeTab === "users"
    }] : []),
    { title: "Settings", url: "#", icon: SettingsIcon, hasArrow: true },
  ]

  const data = {
    user: {
      name: storedEmail.split('@')[0],
      email: storedEmail,
      avatar: "/avatars/shadcn.jpg",
    },
  }
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-3">
        {/* Logo */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-0! hover:bg-transparent"
              onClick={() => {
                selectProject(null)
                setActiveTab("todos")
              }}
            >
              <div className="flex items-center gap-2 ">
                <div className="size-6 rounded-full border-2 border-foreground flex items-center justify-center">
                  <div className="size-2 rounded-full bg-foreground" />
                </div>
                <span className="text-base font-semibold">Hylith Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>


      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* All Todos - Dashboard */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                selectProject(null)
                setActiveTab("todos")
              }}
              className="w-full justify-start"
              isActive={!selectedProjectId && activeTab === "todos"}
            >
              <LayoutDashboardIcon className="size-4" />
              <span>All Todos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Projects Section */}
        <NavProjects />

        {/* Bottom Items */}
        <SidebarMenu className="mt-auto capitalize">
          {bottomItems.map((item: any) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={item.onClick}
                isActive={item.isActive}
                render={
                  item.url ? (
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.hasArrow && (
                        <ChevronRightIcon className="size-3 text-muted-foreground" />
                      )}
                    </Link>
                  ) : undefined
                }
              >
                {!item.url && (
                  <>
                    <item.icon className="size-4" />
                    <span className="flex-1">{item.title}</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
