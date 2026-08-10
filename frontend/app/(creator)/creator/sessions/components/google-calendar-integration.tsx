"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, ExternalLink, Unlink } from "lucide-react"
import { googleCalendarApi } from "@/lib/api/google-calendar.api"
import { sessionsApi } from "@/lib/api/sessions.api"

interface GoogleCalendarIntegrationProps {
  className?: string
  onConnectionUpdated?: () => void
}

export default function GoogleCalendarIntegration({ className, onConnectionUpdated }: GoogleCalendarIntegrationProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<{ connected: boolean; hasValidAccess: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const checkConnectionStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await googleCalendarApi.getConnectionStatus()
      setStatus(response.data)
    } catch {
      toast({
        title: "Connection check failed",
        description: "Unable to check Google Calendar connection status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void checkConnectionStatus()
  }, [checkConnectionStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const handleConnect = async () => {
    try {
      setConnecting(true)

      const response = await googleCalendarApi.getAuthUrl()
      const authUrl = response?.data?.authUrl
      if (!authUrl || typeof authUrl !== 'string') {
        throw new Error("Google OAuth URL was not returned by the server.")
      }

      // Store token in localStorage for the callback to use.
      // The access token is stored in localStorage by the auth provider
      // (the httpOnly accessToken cookie is not accessible via document.cookie).
      localStorage.setItem('google_calendar_oauth_pending', 'true')
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('access_token')
      if (token) {
        localStorage.setItem('google_calendar_oauth_token', token)
      }
      // Clear any stale result
      localStorage.removeItem('google_calendar_oauth_result')

      // Open popup
      const authWindow = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      if (!authWindow) {
        throw new Error("Popup was blocked by the browser. Please allow popups and try again.")
      }

      // --- Listen for result via localStorage (works despite COOP) ---
      const handleStorageEvent = (event: StorageEvent) => {
        if (event.key !== 'google_calendar_oauth_result' || !event.newValue) return
        handleOAuthResult(event.newValue)
      }

      // Poll localStorage more frequently as a fallback
      const pollInterval = setInterval(() => {
        const result = localStorage.getItem('google_calendar_oauth_result')
        if (result) {
          handleOAuthResult(result)
        }
      }, 500)

      // Also check API status directly after a delay (backup method)
      const apiCheckTimeout = setTimeout(async () => {
        try {
          const status = await googleCalendarApi.getConnectionStatus()
          if (status?.data?.connected) {
            cleanup()
            setConnecting(false)
            toast({
              title: "Google Calendar connected",
              description: "Your Google Calendar has been connected successfully.",
            })
            void checkConnectionStatus()
            onConnectionUpdated?.()
          }
        } catch {
          // Ignore errors, keep waiting for localStorage
        }
      }, 3000)

      const timeoutId = setTimeout(() => {
        cleanup()
        setConnecting(false)
        // Check status one final time
        void checkConnectionStatus()
      }, 5 * 60 * 1000)

      const cleanup = () => {
        window.removeEventListener('storage', handleStorageEvent)
        clearInterval(pollInterval)
        clearTimeout(timeoutId)
        clearTimeout(apiCheckTimeout)
        localStorage.removeItem('google_calendar_oauth_result')
        localStorage.removeItem('google_calendar_oauth_pending')
        localStorage.removeItem('google_calendar_oauth_token')
        cleanupRef.current = null
      }
      cleanupRef.current = cleanup

      const handleOAuthResult = (raw: string) => {
        cleanup()
        try {
          const data = JSON.parse(raw)
          if (data.type === 'GOOGLE_CALENDAR_SUCCESS') {
            setConnecting(false)
            void sessionsApi.retryMeetProvisioning().catch(() => {})
            toast({
              title: "Google Calendar connected",
              description: "Your Google Calendar has been connected successfully. Meet links will now be created automatically for your sessions.",
            })
            void checkConnectionStatus()
            onConnectionUpdated?.()
          } else {
            setConnecting(false)
            toast({
              title: "Connection failed",
              description: data.message || "Failed to connect Google Calendar. Please try again.",
              variant: "destructive",
            })
          }
        } catch {
          setConnecting(false)
          void checkConnectionStatus()
        }
      }

      window.addEventListener('storage', handleStorageEvent)

    } catch (error: any) {
      setConnecting(false)
      toast({
        title: "Connection failed",
        description: error.message || "Failed to initiate Google Calendar connection.",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      await googleCalendarApi.disconnect()
      toast({
        title: "Google Calendar disconnected",
        description: "Your Google Calendar has been disconnected. Meet links will no longer be created automatically.",
      })
      void checkConnectionStatus()
      onConnectionUpdated?.()
    } catch (error: any) {
      toast({
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect Google Calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <img src="/integrations/googlecalendar.svg" alt="Google Calendar" className="mr-2 h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/integrations/googlecalendar.svg" alt="Google Calendar" className="mr-2 h-5 w-5" />
            Google Calendar Integration
          </div>
          {status?.connected && (
            <Badge variant={status.hasValidAccess ? "default" : "destructive"} className="ml-2">
              {status.hasValidAccess ? "Connected" : "Expired"}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to automatically create Meet links for your sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Google Calendar to automatically create Google Meet links when participants book your sessions.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">Benefits of connecting:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Automatic Google Meet link creation</li>
                <li>• Calendar events added automatically</li>
                <li>• Email reminders for you and participants</li>
                <li>• Seamless scheduling experience</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert className={status.hasValidAccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {status.hasValidAccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={status.hasValidAccess ? "text-green-800" : "text-red-800"}>
                {status.hasValidAccess
                  ? "Google Calendar is connected and working properly. Meet links will be created automatically for new bookings."
                  : "Your Google Calendar connection has expired. Please reconnect to continue creating Meet links automatically."
                }
              </AlertDescription>
            </Alert>

            {status.hasValidAccess && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://calendar.google.com', '_blank')}
              >
                <img src="/integrations/googlecalendar.svg" alt="" className="mr-2 h-4 w-4" />
                Open Google Calendar
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}

            <div className="flex gap-2">
              {!status.hasValidAccess && (
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  variant="default"
                  className="flex-1"
                >
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reconnect
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleDisconnect}
                disabled={disconnecting}
                variant="outline"
                className={status.hasValidAccess ? "flex-1" : ""}
              >
                {disconnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
