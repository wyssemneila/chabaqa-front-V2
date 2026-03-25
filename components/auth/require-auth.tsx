"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only check authentication for creator routes, not signin page
    if (pathname?.startsWith('/creator') && pathname !== '/signin') {
      const checkAuth = () => {
        if (typeof window !== 'undefined') {
          const hasToken = document.cookie.includes('accessToken=')
          if (!hasToken) {
            // Only redirect if we're not already on signin page
            if (pathname !== '/signin') {
              router.replace(`/signin`)
            }
          }
        }
      }

      // Check immediately
      checkAuth()
      
      // Also check after a short delay to ensure cookies are set
      const timer = setTimeout(checkAuth, 100)
      
      return () => clearTimeout(timer)
    }
  }, [router, pathname])

  return <>{children}</>
}
