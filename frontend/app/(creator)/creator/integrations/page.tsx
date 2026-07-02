'use client'

import Link from 'next/link'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import GoogleCalendarIntegration from '@/app/(creator)/creator/sessions/components/google-calendar-integration'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ExternalLink } from 'lucide-react'

export default function IntegrationsPage() {
  const { lang } = useDashPrefs()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar
          title={lang === 'ar' ? 'التكاملات' : 'Integrations'}
          subtitle={lang === 'ar' ? 'اربط الأدوات التي يعتمد عليها سير عملك' : 'Connect the tools your creator workflow depends on'}
        />
        <main id="main-content" className="p-7 flex-1 space-y-6 max-w-4xl">
          <GoogleCalendarIntegration />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sessions & bookings
              </CardTitle>
              <CardDescription>
                Google Calendar is used when creators manage 1:1 sessions and bookings. Open sessions to review connected calendars and booking settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/creator/sessions">
                  Open sessions
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>More integrations</CardTitle>
              <CardDescription>
                Additional providers such as payment gateways and marketing automation are configured through their dedicated creator pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/creator/email">Email campaigns</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/creator/whatsapp">WhatsApp campaigns</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/creator/billing">Billing</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
