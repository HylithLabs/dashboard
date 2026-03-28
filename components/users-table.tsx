"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import axios from "axios"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SearchIcon, UserCogIcon, MailIcon, CalendarIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  _id: string
  email: string
  role: string
  createdAt: string
}

interface Role {
  _id: string
  name: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      const email = localStorage.getItem("email")
      const [usersRes, rolesRes] = await Promise.all([
        axios.get(`/api/users?email=${email}`),
        axios.get(`/api/roles?email=${email}`)
      ])
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.data)
      }
      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch user data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoleChange = async (userEmail: string, newRole: string) => {
    // Optimistic update
    const previousUsers = [...users]
    setUsers(users.map(u => u.email === userEmail ? { ...u, role: newRole } : u))
    
    const loadingToast = toast.loading(`Updating role...`)
    
    try {
      const adminEmail = localStorage.getItem("email")
      const response = await axios.put("/api/users", {
        email: userEmail,
        role: newRole,
        adminEmail,
      })

      if (response.data.success) {
        toast.success(`Role updated`, { id: loadingToast })
      } else {
        // Revert on error
        setUsers(previousUsers)
        toast.error(response.data.message || "Failed to update role", { id: loadingToast })
      }
    } catch (error) {
      // Revert on error
      setUsers(previousUsers)
      toast.error("Network error updating role", { id: loadingToast })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Fetching users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-[250px]">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user._id} 
                    initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
                    whileTap={{ scale: 0.998, backgroundColor: "var(--muted)" }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                      delay: Math.min(index * 0.015, 0.15)
                    }}
                    className="group border-b last:border-0 hover:bg-muted/20 transition-colors cursor-default"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">
                            {user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">
                            {user.email.split('@')[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || "user"}
                        onValueChange={(value) => handleRoleChange(user.email, value)}
                        disabled={user.email === "jotirmoybhowmik1976@gmail.com"}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role._id} value={role.name} className="capitalize">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
