'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Search, XCircle } from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { manualPaymentsApi } from '@/lib/api/manual-payments'

type ManualTab = 'pending' | 'history'

interface ManualOrder {
  id: string
  buyerName: string
  buyerEmail: string
  contentTitle: string
  contentType: string
  amount: number
  creatorNet: number
  status: string
  proofUrl: string
  submittedAt: string
  fulfillmentStatus: string
}

const unwrapRows = (response: any): any[] => {
  const source =
    response?.data?.data ||
    response?.data?.items ||
    response?.data ||
    response?.items ||
    response
  return Array.isArray(source) ? source : []
}

const getId = (value: any) => String(value?.id || value?._id || value?.orderId || '')

const mapOrder = (item: any): ManualOrder => {
  const buyer = item?.buyer || item?.buyerId || {}
  return {
    id: getId(item),
    buyerName: String(buyer?.name || item?.buyerName || 'Unknown buyer'),
    buyerEmail: String(buyer?.email || item?.buyerEmail || ''),
    contentTitle: String(item?.contentTitle || item?.content?.title || item?.content?.name || item?.contentId || 'Manual payment'),
    contentType: String(item?.contentType || 'content'),
    amount: Number(item?.amountDT ?? item?.amount ?? 0),
    creatorNet: Number(item?.creatorNetDT ?? item?.creatorNet ?? 0),
    status: String(item?.status || 'pending_verification'),
    proofUrl: String(item?.paymentProof || item?.proofUrl || item?.proof || ''),
    submittedAt: String(item?.createdAt || item?.submittedAt || ''),
    fulfillmentStatus: String(item?.metadata?.fulfillmentStatus || item?.fulfillmentStatus || 'pending'),
  }
}

const money = (value: unknown) => `${Number(value || 0).toLocaleString()} TND`

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '-'
}

const statusClass = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === 'paid') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
  if (normalized === 'cancelled' || normalized === 'rejected') return 'border-rose-500/25 bg-rose-500/10 text-rose-700'
  return 'border-amber-500/25 bg-amber-500/10 text-amber-700'
}

export default function ManualPaymentsPage() {
  const { selectedCommunityId } = useCreatorCommunity()
  const [tab, setTab] = useState<ManualTab>('pending')
  const [pending, setPending] = useState<ManualOrder[]>([])
  const [history, setHistory] = useState<ManualOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const loadManualPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const scoped = selectedCommunityId ? { communityId: selectedCommunityId } : {}
      const [pendingResult, historyResult] = await Promise.allSettled([
        manualPaymentsApi.getPendingPayments(scoped),
        manualPaymentsApi.getHistory({ ...scoped, status, page: 1, limit: 50 }),
      ])

      if (pendingResult.status === 'fulfilled') {
        setPending(unwrapRows(pendingResult.value).map(mapOrder))
      } else {
        setPending([])
      }

      if (historyResult.status === 'fulfilled') {
        setHistory(unwrapRows(historyResult.value).map(mapOrder))
      } else {
        setHistory([])
      }

      const failures = [pendingResult, historyResult]
        .filter((result) => result.status === 'rejected')
        .map((result: any) => result.reason?.message || 'Unable to load manual payments')
      setError(failures.join(' '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadManualPayments()
  }, [selectedCommunityId, status])

  const visibleRows = useMemo(() => {
    const source = tab === 'pending' ? pending : history
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((item) =>
      [item.buyerName, item.buyerEmail, item.contentTitle, item.contentType, item.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    )
  }, [history, pending, search, tab])

  const approveReject = async (order: ManualOrder, action: 'approve' | 'reject') => {
    if (!order.id || actionId) return
    const confirmed = window.confirm(action === 'approve' ? 'Approve this manual payment?' : 'Reject this manual payment?')
    if (!confirmed) return

    setActionId(order.id)
    setError('')
    setMessage('')
    try {
      await manualPaymentsApi.verifyPayment(order.id, action)
      setMessage(action === 'approve' ? 'Manual payment approved and fulfillment started.' : 'Manual payment rejected.')
      await loadManualPayments()
    } catch (err: any) {
      setError(err?.message || `Unable to ${action} this payment.`)
    } finally {
      setActionId('')
    }
  }

  const totals = useMemo(() => {
    const paid = history.filter((item) => item.status === 'paid')
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      pendingAmount: pending.reduce((sum, item) => sum + item.amount, 0),
      netPaid: paid.reduce((sum, item) => sum + item.creatorNet, 0),
    }
  }, [history, pending])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex min-h-screen flex-1 flex-col">
        <DashTopbar title="Manual Payments" subtitle="Review proof uploads and approve supported content purchases." />

        <main id="main-content" className="flex-1 space-y-5 p-6 lg:p-8">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-[13px] font-semibold text-indigo-900">
            {selectedCommunityId
              ? 'Showing manual payment proofs for the selected community.'
              : 'Select a community to filter proofs. Without a selection, all manual proofs you can review are shown.'}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Pending proofs', totals.pendingCount, AlertCircle, 'text-amber-600 bg-amber-500/10'],
              ['Pending amount', money(totals.pendingAmount), RefreshCw, 'text-blue-600 bg-blue-500/10'],
              ['Approved proofs', totals.paidCount, CheckCircle2, 'text-emerald-600 bg-emerald-500/10'],
              ['Approved net', money(totals.netPaid), ExternalLink, 'text-indigo-600 bg-indigo-500/10'],
            ].map(([label, value, Icon, tone]: any) => (
              <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--t3)' }}>{label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black tabular-nums" style={{ color: 'var(--t1)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl p-4 shadow-sm lg:flex-row lg:items-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--bg)' }}>
              {(['pending', 'history'] as ManualTab[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className="h-10 rounded-lg px-4 text-[13px] font-black capitalize transition-colors"
                  style={tab === item ? { background: 'var(--white)', color: 'var(--t1)' } : { color: 'var(--t3)' }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search proof queue"
                className="h-11 w-full rounded-xl pl-10 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/15"
                style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl px-3 text-[13px] font-bold outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
              disabled={tab === 'pending'}
            >
              <option value="all">All statuses</option>
              <option value="pending_verification">Pending verification</option>
              <option value="paid">Approved</option>
              <option value="cancelled">Rejected</option>
            </select>
            <button
              type="button"
              onClick={loadManualPayments}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-black transition-opacity hover:opacity-80"
              style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {(error || message) && (
            <div className={`rounded-2xl border p-4 text-[13px] font-semibold ${
              message ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              {message || error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="grid grid-cols-[1.2fr_1fr_110px_120px_150px] gap-4 px-5 py-3 text-[11px] font-black uppercase tracking-wide" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--bd)', color: 'var(--t3)' }}>
              <span>Buyer</span>
              <span>Content</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Review</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>No manual payments found</p>
                <p className="mt-2 text-[13px]" style={{ color: 'var(--t3)' }}>Proof uploads appear here after buyers submit manual transfers.</p>
              </div>
            ) : (
              visibleRows.map((order) => (
                <div key={order.id} className="grid grid-cols-[1.2fr_1fr_110px_120px_150px] items-center gap-4 px-5 py-4 text-[13px]" style={{ borderBottom: '1px solid var(--bd)' }}>
                  <div className="min-w-0">
                    <p className="truncate font-black" style={{ color: 'var(--t1)' }}>{order.buyerName}</p>
                    <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--t3)' }}>{order.buyerEmail || 'No email'}</p>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--t3)' }}>{formatDate(order.submittedAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black" style={{ color: 'var(--t1)' }}>{order.contentTitle}</p>
                    <p className="mt-1 text-[12px] capitalize" style={{ color: 'var(--t3)' }}>{order.contentType.replace('_', ' ')}</p>
                  </div>
                  <p className="font-black tabular-nums" style={{ color: 'var(--t1)' }}>{money(order.amount)}</p>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusClass(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.proofUrl && (
                      <a
                        href={order.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[12px] font-black transition-opacity hover:opacity-80"
                        style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Proof
                      </a>
                    )}
                    {order.status === 'pending_verification' && (
                      <>
                        <button
                          type="button"
                          onClick={() => approveReject(order, 'approve')}
                          disabled={Boolean(actionId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                          aria-label="Approve manual payment"
                        >
                          {actionId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => approveReject(order, 'reject')}
                          disabled={Boolean(actionId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          aria-label="Reject manual payment"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
