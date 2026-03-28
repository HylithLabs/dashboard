"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import axios from "axios"
import { Badge } from "@/components/ui/badge"
import { ShieldCheckIcon, ShieldPlusIcon, InfoIcon, HammerIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Role {
  _id: string
  name: string
  description: string
  isDefault: boolean
}

export function RolesManagement({ onRolesChanged }: { onRolesChanged?: () => void }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRoles = async () => {
    try {
      const email = localStorage.getItem("email")
      const response = await axios.get(`/api/roles?email=${email}`)
      if (response.data.success) {
        setRoles(response.data.data)
      }
    } catch (error) {
      toast.error("Failed to fetch roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsSubmitting(true)
    try {
      const adminEmail = localStorage.getItem("email")
      const response = await axios.post("/api/roles", {
        name: newName.trim(),
        description: newDesc.trim(),
        adminEmail
      })

      if (response.data.success) {
        toast.success("Role created successfully")
        setNewName("")
        setNewDesc("")
        fetchRoles()
        onRolesChanged?.()
      } else {
        toast.error(response.data.message || "Failed to create role")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create role")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading role definitions...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <motion.div 
        initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {roles.map((role, index) => (
                  <motion.tr 
                    key={role._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      delay: index * 0.02 
                    }}
                  >
                    <TableCell className="font-medium capitalize">{role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{role.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={role.isDefault ? "secondary" : "outline"} className="text-[10px] font-bold uppercase tracking-tighter">
                        {role.isDefault ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Add Role</CardTitle>
            <CardDescription className="text-xs">Create a new access level.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName" className="text-xs">Name</Label>
                <Input 
                  id="roleName" 
                  placeholder="e.g. Manager" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc" className="text-xs">Description</Label>
                <Input 
                  id="roleDesc" 
                  placeholder="What this role does" 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="h-8"
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Save Role"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
