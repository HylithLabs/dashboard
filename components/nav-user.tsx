"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

// Utility: Get initials safely
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login") // redirect after logout
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const displayName =
    user?.name || user?.email?.split("@")[0] || "User"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* Trigger */}
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-muted transition-all"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={user?.avatar || ""}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="rounded-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {displayName}
                </span>
                <span className="truncate text-xs text-foreground/70">
                  {user?.email || ""}
                </span>
              </div>

              <EllipsisVerticalIcon className="ml-auto size-4 opacity-70" />
          </DropdownMenuTrigger>

          {/* Dropdown */}
          <DropdownMenuContent
            className="min-w-56 rounded-xl shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* User Info */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="size-8">
                  <AvatarImage
                    src={user?.avatar || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-sm leading-tight">
                  <span className="truncate font-medium">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <CircleUserRoundIcon className="mr-2 size-4" />
                Account
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <CreditCardIcon className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <BellIcon className="mr-2 size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
