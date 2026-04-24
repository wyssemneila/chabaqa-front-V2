"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

interface AdminLayoutContextType {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined)

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Handle responsive behavior - close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const value = useMemo<AdminLayoutContextType>(() => ({
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
  }), [sidebarOpen, toggleSidebar, closeSidebar])

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  )
}

export function useAdminLayout() {
  const context = useContext(AdminLayoutContext)
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayoutProvider')
  }
  return context
}
