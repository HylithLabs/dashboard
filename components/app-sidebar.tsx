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
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { NavUser } from "./nav-user"

import {
  LayoutDashboardIcon,
  SettingsIcon,
  PlusIcon,
  MailIcon,
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
  const { selectProject } = useProjects()

  const [storedEmail, setstoredEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const email = localStorage.getItem("email")
    setstoredEmail(email || "")
    setIsAdmin(email === ADMIN_EMAIL)
  }, [])

  // Only show Add User tab for admin
  const bottomItems = [
    ...(isAdmin ? [{ title: "Add User", url: "/admin/add-user", icon: UserPlusIcon, hasArrow: false }] : []),
    { title: "Settings", url: "#", icon: SettingsIcon, hasArrow: true },
  ]

  const data = {
    user: {
      name: "shadcn",
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
              render={<a href="#" />}
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
              onClick={() => selectProject(null)}
              className="w-full justify-start"
            >
              <LayoutDashboardIcon className="size-4" />
              <span>All Todos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Projects Section */}
        <NavProjects />

        {/* Bottom Items */}
        <SidebarMenu className="mt-auto">
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="size-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.hasArrow && (
                      <ChevronRightIcon className="size-3 text-muted-foreground" />
                    )}
                  </Link>
                }
              />
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
