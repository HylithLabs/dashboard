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
import {
  LayoutDashboardIcon,
  SettingsIcon,
  PlusIcon,
  MailIcon,
  ChevronRightIcon,
} from "lucide-react"
import { NavProjects } from "./nav-projects"
import { useProjects } from "./projects-context"

const bottomItems = [
  { title: "Settings", url: "#", icon: SettingsIcon, hasArrow: true },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { selectProject } = useProjects()
  
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

        {/* Quick Create Button */}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 h-9">
            <PlusIcon className="size-4" />
            Quick Create
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <MailIcon className="size-4" />
          </Button>
        </div>
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
                render={<a href={item.url} className="flex items-center gap-3" />}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.title}</span>
                {item.hasArrow && (
                  <ChevronRightIcon className="size-3 text-muted-foreground" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Footer can be empty or have user info */}
      </SidebarFooter>
    </Sidebar>
  )
}
