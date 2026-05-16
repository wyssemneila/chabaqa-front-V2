import type { Metadata } from "next"
import { AdminAuthProvider } from "./providers/admin-auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Admin | Chabaqa",
  robots: noIndexRobots,
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-theme">
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
      <Toaster />
    </div>
  )
}
