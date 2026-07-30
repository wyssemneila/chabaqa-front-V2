import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import CreatorClientLayout from "@/app/(creator)/creator/creator-client-layout"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Manage your creator content, analytics, and community",
  robots: noIndexRobots,
}

import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { CreatorCommunityProvider } from "@/app/(creator)/creator/context/creator-community-context"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('chabaqa_dash_theme');document.documentElement.classList.toggle('dark',t==='dark');var l=localStorage.getItem('chabaqa_dash_lang')==='ar'?'ar':'en';document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'}catch(e){}})()`,
        }}
      />
      <AuthProvider>
        <CommunityProvider>
          <CreatorCommunityProvider>
            <CreatorClientLayout>
              {children}
            </CreatorClientLayout>
            <LiveSupportWidget />
          </CreatorCommunityProvider>
        </CommunityProvider>
      </AuthProvider>
    </>
  )
}
