import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { SessionEditForm } from "./components/session-edit-form"
import { SessionBookings } from "./components/session-bookings"
import { SessionAvailabilityWrapper } from "./components/session-availability-wrapper"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  try {
    const { sessionId } = await params

    const sessionResponse = await api.sessions.getById(sessionId)
    const sessionWrapper: any = sessionResponse as any
    
    // Check for error response shape: { success: false, error: {...} }
    if (sessionWrapper?.success === false) {
      console.error('Session API error:', sessionWrapper.error)
      notFound()
    }
    
    const apiSession: any = (sessionWrapper?.data ?? sessionWrapper)

    if (!apiSession || !apiSession.id) {
      notFound()
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/creator/sessions">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{apiSession.title}</h1>
              <p className="text-sm text-gray-600 mt-1">Session ID: {sessionId}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" asChild>
            <Link href={`/creator/sessions/${sessionId}/delete`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Link>
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Edit Form */}
          <div className="lg:col-span-2">
            <SessionEditForm session={apiSession} sessionId={sessionId} />
          </div>

          {/* Right Column - Info & Bookings */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Session Info</h2>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <p className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${apiSession.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {apiSession.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{apiSession.duration} minutes</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Price</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{apiSession.price} {apiSession.currency}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{apiSession.category || 'Uncategorized'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Max Bookings/Week</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{apiSession.maxBookingsPerWeek || 'Unlimited'}</p>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="font-semibold">{apiSession.bookingsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold">{apiSession.bookingsThisWeek || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Can Book More</span>
                  <span className="font-semibold">{apiSession.canBookMore ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Created/Updated Info */}
            <div className="bg-gray-50 border rounded-lg p-6 text-sm space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                <p className="text-gray-900">
                  {apiSession.createdAt ? new Date(apiSession.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Last Updated</p>
                <p className="text-gray-900">
                  {apiSession.updatedAt ? new Date(apiSession.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Configuration */}
        <SessionAvailabilityWrapper sessionId={sessionId} duration={apiSession.duration || 60} />

        {/* Bookings Section */}
        {apiSession?.bookings && Array.isArray(apiSession.bookings) && apiSession.bookings.length > 0 && (
          <SessionBookings bookings={apiSession.bookings} />
        )}
      </div>
    )
  } catch (error) {
    console.error('Failed to fetch session:', error)
    notFound()
  }
}
