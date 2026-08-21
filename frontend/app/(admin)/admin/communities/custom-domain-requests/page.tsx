"use client"

import { useCallback, useEffect, useState } from "react"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Globe2, X } from "lucide-react"
import { toast } from "sonner"

type RequestItem = { _id: string; name: string; slug: string; createur?: { username?: string; email?: string }; settings?: { customDomainRequest?: { domain: string; businessName?: string; contactEmail?: string; purpose?: string; requestedAt?: string } } }

export default function CustomDomainRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const load = useCallback(async () => {
    setLoading(true)
    try { const response: any = await adminApi.communities.getCustomDomainRequests(); setItems(response?.data?.data || response?.data || []) }
    catch (error: any) { toast.error(error?.message || "Could not load domain requests") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const review = async (id: string, action: "approve" | "reject") => {
    try { await adminApi.communities.reviewCustomDomainRequest(id, { action, note: notes[id] || "" }); toast.success(`Domain request ${action}d`); await load() }
    catch (error: any) { toast.error(error?.message || "Review failed") }
  }
  return <main className="space-y-6 p-6"><div><h1 className="flex items-center gap-2 text-2xl font-semibold"><Globe2 className="h-6 w-6" /> Custom domain requests</h1><p className="mt-1 text-sm text-slate-500">Approve only after confirming the requested domain and DNS ownership. Approval activates the domain for the community.</p></div>
    {loading ? <p className="text-sm text-slate-500">Loading requests…</p> : items.length === 0 ? <p className="rounded-lg border bg-white p-6 text-sm text-slate-500">No pending custom-domain requests.</p> : <div className="space-y-4">{items.map((item) => { const request = item.settings?.customDomainRequest; return <section key={item._id} className="space-y-3 rounded-lg border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{request?.domain}</h2><p className="text-sm text-slate-500">{item.name} · /{item.slug}</p></div><p className="text-xs text-slate-500">Requested {request?.requestedAt ? new Date(request.requestedAt).toLocaleString() : "recently"}</p></div><dl className="grid gap-3 text-sm md:grid-cols-3"><div><dt className="text-slate-500">Organization</dt><dd>{request?.businessName || "—"}</dd></div><div><dt className="text-slate-500">Technical contact</dt><dd>{request?.contactEmail || item.createur?.email || "—"}</dd></div><div><dt className="text-slate-500">Creator</dt><dd>{item.createur?.username || "—"}</dd></div></dl><div><p className="text-sm font-medium">Request context</p><p className="text-sm text-slate-600">{request?.purpose || "—"}</p></div><Input value={notes[item._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} placeholder="Admin review note (required for rejection)" /><div className="flex gap-2"><Button onClick={() => void review(item._id, "approve")}><Check className="h-4 w-4" /> Approve & activate</Button><Button variant="destructive" onClick={() => void review(item._id, "reject")}><X className="h-4 w-4" /> Reject</Button></div></section> })}</div>}</main>
}
