"use client"

import { AddUserForm } from "@/components/add-user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AddUserPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem("email")
    if (!email || email !== "jotirmoybhowmik1976@gmail.com") {
      router.push("/dashboard")
    } else {
      setIsAdmin(true)
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Create new user accounts that can access the application
        </p>
      </div>
      
      <AddUserForm />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Admin Access Only</CardTitle>
          <CardDescription>
            Only the admin user (jotirmoybhowmik1976@gmail.com) can create new users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When you create a new user, they will be able to log in with their email and password.
            All user data is stored securely in MongoDB with encrypted passwords.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
