'use client'

import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { NotificationsInbox } from '@/components/notifications/notifications-inbox'
import { NotificationPreferences } from '@/components/notifications/notification-preferences'
import { PushSettings } from '@/components/notifications/push-settings'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

export default function CreatorNotificationsPage() {
  const { lang } = useDashPrefs()
  const { selectedCommunityId } = useCreatorCommunity()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar
          title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          subtitle={lang === 'ar' ? 'صندوق الوارد وتفضيلات التنبيهات' : 'Inbox and alert preferences'}
        />
        <main id="main-content" className="p-7 flex-1 space-y-6 max-w-5xl">
          <NotificationsInbox fetchLimit={100} />
          <NotificationPreferences communityId={selectedCommunityId} />
          <PushSettings />
        </main>
      </div>
    </div>
  )
}
