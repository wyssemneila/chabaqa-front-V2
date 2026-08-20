"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  type CookieConsentPreferences,
  type CookieConsentV1,
  getStoredConsent,
  isConsentRequired,
  saveConsent,
} from "@/lib/cookie-consent"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { CookiePreferencesModal } from "@/components/cookie-preferences-modal"

export const COOKIE_CONSENT_UPDATED_EVENT = "chabaqa:cookie-consent-updated"
export const COOKIE_OPEN_PREFERENCES_EVENT = "chabaqa:open-cookie-preferences"

type CookieConsentContextValue = {
  consent: CookieConsentV1 | null
  isBannerVisible: boolean
  openPreferences: () => void
  acceptAll: () => void
  rejectNonEssential: () => void
  savePreferences: (preferences: CookieConsentPreferences) => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

function dispatchConsentUpdated(consent: CookieConsentV1 | null) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent }))
}

export function CookieConsentProvider() {
  const [consent, setConsent] = useState<CookieConsentV1 | null>(null)
  const [isBannerVisible, setIsBannerVisible] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    setConsent(stored)
    setIsBannerVisible(isConsentRequired())
  }, [])

  useEffect(() => {
    const openPreferencesListener = () => setIsPreferencesOpen(true)
    window.addEventListener(COOKIE_OPEN_PREFERENCES_EVENT, openPreferencesListener)
    return () => {
      window.removeEventListener(COOKIE_OPEN_PREFERENCES_EVENT, openPreferencesListener)
    }
  }, [])

  const persistAndBroadcast = useCallback((preferences: CookieConsentPreferences) => {
    const nextConsent = saveConsent(preferences)
    setConsent(nextConsent)
    setIsBannerVisible(false)
    setIsPreferencesOpen(false)
    dispatchConsentUpdated(nextConsent)
  }, [])

  const acceptAll = useCallback(() => {
    persistAndBroadcast({ analytics: true })
  }, [persistAndBroadcast])

  const rejectNonEssential = useCallback(() => {
    persistAndBroadcast({ analytics: false })
  }, [persistAndBroadcast])

  const savePreferencesFromModal = useCallback(
    (preferences: CookieConsentPreferences) => {
      persistAndBroadcast(preferences)
    },
    [persistAndBroadcast],
  )

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true)
  }, [])

  const contextValue = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isBannerVisible,
      openPreferences,
      acceptAll,
      rejectNonEssential,
      savePreferences: savePreferencesFromModal,
    }),
    [acceptAll, consent, isBannerVisible, openPreferences, rejectNonEssential, savePreferencesFromModal],
  )

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {isBannerVisible ? (
        <CookieConsentBanner
          onAcceptAll={acceptAll}
          onRejectNonEssential={rejectNonEssential}
          onOpenSettings={openPreferences}
        />
      ) : null}

      <CookiePreferencesModal
        open={isPreferencesOpen}
        analyticsEnabled={Boolean(consent?.analytics)}
        onOpenChange={setIsPreferencesOpen}
        onSavePreferences={savePreferencesFromModal}
        onAcceptAll={acceptAll}
        onRejectNonEssential={rejectNonEssential}
      />
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider")
  }
  return context
}
