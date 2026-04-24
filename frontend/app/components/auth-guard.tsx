"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/app/providers/auth-provider"

interface AuthGuardProps {
    children: React.ReactNode
    allowedRoles?: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { user, isAuthenticated, loading } = useAuthContext()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push("/signin")
            } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                router.push("/explore") // or unauthorized page
            }
        }
    }, [isAuthenticated, loading, user, allowedRoles, router])

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!isAuthenticated) {
        return null
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null
    }

    return <>{children}</>
}
