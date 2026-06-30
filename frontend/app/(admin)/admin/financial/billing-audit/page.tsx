"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/api/admin-api"

interface BillingAuditRow {
  id: string
  orderId: string
  contentType: string
  contentId: string
  status: string
  provider: string
  paymentMethod?: string
  paymentId?: string
  providerCheckoutSessionId?: string
  providerSubscriptionId?: string
  amount: number
  currency: string
  proofUrl?: string
  buyer?: { username?: string; name?: string; email?: string }
  creator?: { username?: string; name?: string; email?: string }
  createdAt: string
}

const formatMoney = (amount: number, currency = "TND") =>
  `${Number(amount || 0).toLocaleString()} ${currency}`

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
    : "-"
}

export default function BillingAuditPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [rows, setRows] = useState<BillingAuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [provider, setProvider] = useState("all")
  const [status, setStatus] = useState("all")

  const loadAudit = async () => {
    setLoading(true)
    try {
      const response = await adminApi.financial.getBillingAudit({
        page: 1,
        limit: 100,
        ...(provider === "all" ? {} : { provider }),
        ...(status === "all" ? {} : { status }),
      })
      const data = (response as any)?.data?.data || (response as any)?.data || []
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[BillingAudit] Error:", error)
      toast.error("Failed to load billing audit")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    void loadAudit()
  }, [isAuthenticated, authLoading, provider, status])

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [
        row.orderId,
        row.contentType,
        row.provider,
        row.status,
        row.paymentId,
        row.providerCheckoutSessionId,
        row.providerSubscriptionId,
        row.buyer?.email,
        row.creator?.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [query, rows])

  const reviewManual = async (row: BillingAuditRow, action: "approve" | "reject") => {
    try {
      await adminApi.financial.reviewManualPlatformSubscription(row.orderId, action)
      toast.success(action === "approve" ? "Manual subscription approved" : "Manual subscription rejected")
      await loadAudit()
    } catch (error: any) {
      toast.error(error?.message || "Review failed")
    }
  }

  const columns: ColumnDef<BillingAuditRow>[] = [
    {
      id: "order",
      header: "Order",
      cell: (row) => (
        <div>
          <div className="font-mono text-xs font-medium">{row.orderId.slice(-10)}</div>
          <div className="text-xs text-muted-foreground">{row.contentType}</div>
        </div>
      ),
    },
    { id: "provider", header: "Provider", cell: (row) => <span className="font-medium capitalize">{row.provider}</span> },
    { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { id: "amount", header: "Amount", cell: (row) => <span className="font-medium">{formatMoney(row.amount, row.currency)}</span> },
    {
      id: "ids",
      header: "Provider IDs",
      cell: (row) => (
        <div className="max-w-[260px] space-y-1 text-xs">
          <div className="truncate">payment: {row.paymentId || "-"}</div>
          <div className="truncate">checkout: {row.providerCheckoutSessionId || "-"}</div>
          <div className="truncate">subscription: {row.providerSubscriptionId || "-"}</div>
        </div>
      ),
    },
    { id: "creator", header: "Creator", cell: (row) => row.creator?.email || row.creator?.username || "-" },
    { id: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => {
        const canReview = row.contentType === "subscription" && row.provider === "manual" && row.status === "pending_verification"
        return (
          <div className="flex items-center gap-2">
            {row.proofUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={row.proofUrl} target="_blank" rel="noreferrer">Proof</a>
              </Button>
            )}
            {canReview && (
              <>
                <Button size="sm" onClick={() => reviewManual(row, "approve")} className="gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => reviewManual(row, "reject")} className="gap-1">
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/financial")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Billing Audit</h1>
            <p className="mt-1 text-muted-foreground">Trace checkout state, webhooks, provider IDs, invoices, and manual proof reviews.</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadAudit} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search provider ID, order, creator, status"
            className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 rounded-lg border bg-background px-3 text-sm font-medium">
          <option value="all">All providers</option>
          <option value="stripe">Stripe</option>
          <option value="konnect">Konnect</option>
          <option value="flouci">Flouci</option>
          <option value="manual">Manual</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border bg-background px-3 text-sm font-medium">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="pending_verification">Pending verification</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        emptyMessage="No billing audit records found"
      />
    </div>
  )
}
