'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Download, RefreshCw, Search, TrendingUp, Users, XCircle } from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import {
  subscriptionApi,
  SubscriptionStatus,
  type CreatorSubscription,
  type SubscriptionStats,
} from '@/lib/api/subscription.api'

const unwrapList = <T,>(response: any): T[] => {
  const source =
    response?.data?.data ||
    response?.data?.items ||
    response?.data?.subscriptions ||
    response?.data ||
    response?.items ||
    response?.subscriptions ||
    response
  return Array.isArray(source) ? source : []
}

const unwrapData = <T,>(response: any, fallback: T): T =>
  (response?.data?.data || response?.data || response || fallback) as T

const money = (value: unknown, currency = 'TND') => {
  const amount = Number(value || 0)
  return `${Number.isFinite(amount) ? amount.toLocaleString() : '0'} ${currency}`
}

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '-'
}

const statusClass: Record<string, string> = {
  [SubscriptionStatus.ACTIVE]: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
  [SubscriptionStatus.TRIALING]: 'bg-blue-500/10 text-blue-600 border-blue-500/25',
  [SubscriptionStatus.PAST_DUE]: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
  [SubscriptionStatus.CANCELED]: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
  [SubscriptionStatus.INCOMPLETE]: 'border-[var(--bd)]',
}

export default function CreatorSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | SubscriptionStatus>('all')

  const loadSubscriptions = async () => {
    setLoading(true)
    setError('')
    try {
      const [listResult, statsResult] = await Promise.allSettled([
        subscriptionApi.getAllSubscriptions({ page: 1, limit: 100, status: status === 'all' ? undefined : status }),
        subscriptionApi.getSubscriptionStats(),
      ])

      if (listResult.status === 'fulfilled') {
        setSubscriptions(unwrapList<CreatorSubscription>(listResult.value))
      } else {
        setSubscriptions([])
      }

      if (statsResult.status === 'fulfilled') {
        setStats(unwrapData<SubscriptionStats | null>(statsResult.value, null))
      } else {
        setStats(null)
      }

      const failures = [listResult, statsResult]
        .filter((result) => result.status === 'rejected')
        .map((result: any) => result.reason?.message || 'Unable to load revenue data')
      setError(failures.join(' · '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSubscriptions()
  }, [status])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return subscriptions
    return subscriptions.filter((subscription: any) =>
      [
        subscription.id,
        subscription.creatorId,
        subscription.plan,
        subscription.status,
        subscription.paymentBrand,
        subscription.provider,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [subscriptions, search])

  const fallbackStats = useMemo(() => {
    const active = subscriptions.filter((item) => item.status === SubscriptionStatus.ACTIVE)
    const canceled = subscriptions.filter((item) => item.status === SubscriptionStatus.CANCELED)
    const trial = subscriptions.filter((item) => item.status === SubscriptionStatus.TRIALING)
    const revenue = active.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return {
      totalSubscribers: subscriptions.length,
      activeSubscribers: active.length,
      monthlyRevenue: revenue,
      averageSubscriptionValue: active.length ? Math.round(revenue / active.length) : 0,
      trialSubscribers: trial.length,
      canceledSubscribers: canceled.length,
      pastDueSubscribers: subscriptions.filter((item) => item.status === SubscriptionStatus.PAST_DUE).length,
    }
  }, [subscriptions])

  const viewStats = stats || fallbackStats

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar title="Subscriptions" subtitle="Revenue subscriptions, trials, renewals, and billing status." />

        <main id="main-content" className="flex-1 p-6 lg:p-8 space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Monthly revenue', money(viewStats.monthlyRevenue), TrendingUp, 'text-emerald-600 bg-emerald-500/10'],
              ['Active subscribers', viewStats.activeSubscribers, Users, 'text-blue-600 bg-blue-500/10'],
              ['Trial subscribers', viewStats.trialSubscribers, CreditCard, 'text-indigo-600 bg-indigo-500/10'],
              ['Canceled', viewStats.canceledSubscribers, XCircle, 'text-rose-600 bg-rose-500/10'],
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subscriptions"
                className="h-11 w-full rounded-xl pl-10 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/15"
                style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as any)}
              className="h-11 rounded-xl px-3 text-[13px] font-bold outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
            >
              <option value="all">All statuses</option>
              {Object.values(SubscriptionStatus).map((value) => (
                <option key={value} value={value}>{value.replace('_', ' ')}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadSubscriptions}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-black transition-opacity hover:opacity-80"
              style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => subscriptionApi.exportSubscriptions({ status: status === 'all' ? undefined : status })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-black text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--p)' }}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-semibold text-amber-800">{error}</div>
          )}

          <div className="overflow-hidden rounded-2xl shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-[11px] font-black uppercase tracking-wide" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--bd)', color: 'var(--t3)' }}>
              <span>Plan</span>
              <span>Status</span>
              <span>Amount</span>
              <span>Period end</span>
              <span>Payment</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>No subscriptions found</p>
                <p className="mt-2 text-[13px]" style={{ color: 'var(--t3)' }}>Subscriptions from the API will appear here.</p>
              </div>
            ) : (
              filtered.map((subscription) => (
                <div key={subscription.id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 text-[13px] last:border-b-0" style={{ borderBottom: '1px solid var(--bd)' }}>
                  <div>
                    <p className="font-black capitalize" style={{ color: 'var(--t1)' }}>{subscription.plan}</p>
                    <p className="mt-1 text-[12px]" style={{ color: 'var(--t3)' }}>{subscription.billingInterval || 'month'} billing</p>
                  </div>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusClass[subscription.status] || statusClass.incomplete}`} style={subscription.status === SubscriptionStatus.INCOMPLETE ? { color: 'var(--t2)', background: 'var(--bg)' } : undefined}>
                    {subscription.status.replace('_', ' ')}
                  </span>
                  <p className="font-black tabular-nums" style={{ color: 'var(--t1)' }}>{money(subscription.amount, subscription.currency || 'TND')}</p>
                  <p className="font-semibold" style={{ color: 'var(--t2)' }}>{formatDate(subscription.currentPeriodEnd || subscription.nextBillingAt)}</p>
                  <p className="font-semibold" style={{ color: 'var(--t2)' }}>
                    {subscription.hasPaymentMethod ? `${subscription.paymentBrand || 'Card'} ${subscription.paymentLast4 ? `•••• ${subscription.paymentLast4}` : ''}` : 'No method'}
                  </p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
