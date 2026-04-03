"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import axios from "axios"
import { api } from "@/lib/api"
import { motion } from "framer-motion"

export function AddUserForm({ onUserAdded }: { onUserAdded?: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<string>("user")
  const [roles, setRoles] = useState<{_id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`/api/roles`)
        if (response.data.success) {
          setRoles(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error)
      }
    }
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    const loadingToast = toast.loading("Provisioning new account...")

    try {
      const response = await api.users.create({
        email,
        password,
        role,
      })

      if (response.success) {
        toast.success("Account created and ready for use", { id: loadingToast })
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setRole("user")
        onUserAdded?.()
      } else {
        toast.error(response.message || "Failed to create user", { id: loadingToast })
      }
    } catch (error: unknown) {
      console.error("User creation error:", error)
      const message = error instanceof Error ? error.message : "Failed to create user"
      toast.error(message, { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 py-2"
    >
      <div>
        <h3 className="text-lg font-medium">User Provisioning</h3>
        <p className="text-sm text-muted-foreground">
          Configure credentials and access levels for new team members.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Assigned Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value || "user")}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r._id} value={r.name} className="capitalize">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Provisioning..." : "Create User"}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
