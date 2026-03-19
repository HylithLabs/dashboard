"use client"

import { LoginForm } from "@/components/login-form"; 
import { Toaster } from "@/components/ui/sonner"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState("second")

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");

    console.log("Stored email:", storedEmail);

    if (storedEmail && storedEmail !== "undefined") {
      setEmail(storedEmail);
      router.push("/dashboard")
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
