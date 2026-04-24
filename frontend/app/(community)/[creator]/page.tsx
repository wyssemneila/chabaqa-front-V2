import { redirect } from "next/navigation"
import { api } from "@/lib/api"

interface CreatorPageProps {
  params: Promise<{
    creator: string
  }>
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  // Check if this is a request for the authenticated creator dashboard
  const { creator } = await params;
  if (creator === "creator") {
    try {
      // Try to get the current user to check if they're authenticated
      const meResponse = await api.auth.me().catch(() => null)

      if (meResponse?.data) {
        // User is authenticated, redirect to creator dashboard
        redirect("/creator/dashboard")
      }
    } catch (error) {
      // User is not authenticated, redirect to signin
      redirect("/signin")
    }
  }

  // For now, redirect all creator routes to the main page
  // This prevents 404 errors while we have the mock data structure
  redirect("/")
}
