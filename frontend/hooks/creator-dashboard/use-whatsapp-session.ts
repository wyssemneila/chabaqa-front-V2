"use client"

import { useCallback, useEffect, useState } from "react"
import { whatsappApi, type WhatsappSession } from "@/lib/api/whatsapp.api"

export function useWhatsappSession(communityId: string | null) {
  const [session, setSession] = useState<WhatsappSession | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!communityId) {
      setSession(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await whatsappApi.getSession(communityId)
      setSession(next)
    } catch (e: any) {
      setSession(null)
      setError(e?.message || "Failed to load WhatsApp session")
    } finally {
      setLoading(false)
    }
  }, [communityId])

  const start = useCallback(async () => {
    if (!communityId) return
    setLoading(true)
    setError(null)
    try {
      let next = session
      if (!next) {
        next = await whatsappApi.createSession(communityId)
      }
      next = await whatsappApi.startSession(communityId)
      setSession(next)
      const qr = await whatsappApi.getQr(communityId).catch(() => null)
      if (qr) {
        setSession(qr.session)
        setQrCodeData(qr.qrCodeData)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to start WhatsApp session")
    } finally {
      setLoading(false)
    }
  }, [communityId, session])

  const disconnect = useCallback(async () => {
    if (!communityId) return
    setLoading(true)
    setError(null)
    try {
      setSession(await whatsappApi.disconnect(communityId))
      setQrCodeData(undefined)
    } catch (e: any) {
      setError(e?.message || "Failed to disconnect WhatsApp")
    } finally {
      setLoading(false)
    }
  }, [communityId])

  const refreshQr = useCallback(async () => {
    if (!communityId) return
    try {
      const qr = await whatsappApi.getQr(communityId)
      setSession(qr.session)
      setQrCodeData(qr.qrCodeData)
    } catch {
      // QR may not be ready yet; polling should stay quiet.
    }
  }, [communityId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!communityId || !session || !["starting", "qr_pending", "pairing_pending"].includes(session.status)) return
    const timer = window.setInterval(() => {
      load()
      refreshQr()
    }, 4000)
    return () => window.clearInterval(timer)
  }, [communityId, load, refreshQr, session])

  return { session, qrCodeData, loading, error, load, start, disconnect, refreshQr }
}
