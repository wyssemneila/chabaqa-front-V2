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

  // Creator community pages are resolved by the feature-scoped routes.
  // Unknown root creator routes fall back to the main page.
  redirect("/")
}
