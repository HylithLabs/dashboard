"use client"

import { LoginForm } from "@/components/login-form"; 
import { Toaster } from "@/components/ui/sonner"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
