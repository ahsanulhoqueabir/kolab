"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, selectIsAuthenticated } from "@/store/auth.store"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const isAuthenticated = useAuthStore((s) => selectIsAuthenticated(s))

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !isAuthenticated) {
    return null // or a nice spinner
  }

  return <>{children}</>
}
