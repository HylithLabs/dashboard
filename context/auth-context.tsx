"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

interface User {
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((res) => {
        if (res.data.success) setUser(res.data.data)
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout")
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
