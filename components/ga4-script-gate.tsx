"use client"

import React, { useEffect, useState } from "react"
import Script from "next/script"
import { hasAnalyticsConsent } from "@/lib/cookie-consent"
import { COOKIE_CONSENT_UPDATED_EVENT } from "@/components/cookie-consent-provider"

declare global {
  interface Window {
    [key: string]: unknown
  }
}

export function Ga4ScriptGate() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    setAnalyticsEnabled(hasAnalyticsConsent())

    const onConsentUpdated = () => {
      setAnalyticsEnabled(hasAnalyticsConsent())
    }

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated)
    }
  }, [])

  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return
    window[`ga-disable-${measurementId}`] = !analyticsEnabled
  }, [analyticsEnabled, measurementId])

  if (!measurementId || !analyticsEnabled) return null

  return (
    <>
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window['ga-disable-${measurementId}'] = false;
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
