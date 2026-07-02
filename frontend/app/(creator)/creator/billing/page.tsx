'use client'

import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  WalletCards,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PaymentProviderModal } from '@/components/payment-provider-modal'
import { usePaymentProviderModal } from '@/lib/hooks/use-payment-provider-modal'
import {
  subscriptionApi,
  PlanTier as ApiPlanTier,
  SubscriptionStatus,
  type CreatorSubscription,
  type Invoice,
  type SubscriptionAddon,
  type TrialRemaining,
  type UsageSummary,
  SubscriptionAddonType,
} from '@/lib/api/subscription.api'
import {
  PLANS,
  PLAN_TIERS,
  formatLimit,
  type PlanTier,
  type PlanLimits,
} from '@/lib/plans/plan-config'

type Billing = 'monthly' | 'yearly'

const unwrapData = <T,>(response: any, fallback: T): T => {
  return (response?.data?.data ?? response?.data ?? response ?? fallback) as T
}

const unwrapInvoices = (response: any): Invoice[] => {
  const source =
    response?.data?.data?.invoices ||
    response?.data?.invoices ||
    response?.invoices ||
    response?.data?.data ||
    response?.data ||
    response
  return Array.isArray(source) ? source : []
}

const unwrapArray = <T,>(response: any): T[] => {
  const source = response?.data?.data || response?.data || response
  return Array.isArray(source) ? source : []
}

const money = (value: unknown, currency = 'TND') => {
  const amount = Number(value || 0)
  return `${Number.isFinite(amount) ? amount.toLocaleString() : '0'} ${currency}`
}

const formatDate = (value?: string | Date | null) => {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '-'
}

const statusTone: Record<string, string> = {
  [SubscriptionStatus.ACTIVE]: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  [SubscriptionStatus.TRIALING]: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  [SubscriptionStatus.PAST_DUE]: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
  [SubscriptionStatus.CANCELED]: 'bg-rose-500/10 text-rose-700 border-rose-500/25',
  [SubscriptionStatus.INCOMPLETE]: 'bg-slate-500/10 text-slate-700 border-slate-500/25',
}

const tierToApi: Record<PlanTier, ApiPlanTier> = {
  starter: ApiPlanTier.STARTER,
  growth: ApiPlanTier.GROWTH,
  pro: ApiPlanTier.PRO,
}

const usageRows: Array<{ label: string; key: keyof PlanLimits; usageKey: keyof UsageSummary; suffix?: string }> = [
  { label: 'Communities', key: 'communitiesMax', usageKey: 'communitiesCreated' },
  { label: 'Members', key: 'membersMax', usageKey: 'membersAdded' },
  { label: 'Active courses', key: 'coursesActivationMax', usageKey: 'coursesActivated' },
  { label: 'Storage', key: 'storageGB', usageKey: 'storageUsedGB', suffix: ' GB' },
  { label: 'Admin seats', key: 'adminsMax', usageKey: 'adminsAdded' },
]

const firstFiniteNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return 0
}

const formatUsageAmount = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  })
}

export default function CreatorBillingPage() {
  const [subscription, setSubscription] = useState<CreatorSubscription | null>(null)
  const [trial, setTrial] = useState<TrialRemaining | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [addons, setAddons] = useState<SubscriptionAddon[]>([])
  const [availableAddons, setAvailableAddons] = useState<SubscriptionAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [billing, setBilling] = useState<Billing>('yearly')
  const [checkoutTier, setCheckoutTier] = useState<PlanTier>('growth')
  const [savingCancel, setSavingCancel] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [manualProof, setManualProof] = useState<File | null>(null)
  const [submittingManual, setSubmittingManual] = useState(false)
  const [addonBusy, setAddonBusy] = useState<string | null>(null)

  const tier = ((subscription?.plan as PlanTier | undefined) || 'starter') as PlanTier
  const plan = PLANS[tier] || PLANS.starter
  const nextUpgradeTier = useMemo(() => {
    const currentIndex = PLAN_TIERS.indexOf(tier)
    return PLAN_TIERS[Math.min(currentIndex + 1, PLAN_TIERS.length - 1)] || tier
  }, [tier])

  const paymentModal = usePaymentProviderModal({
    initStripe: () => subscriptionApi.initStripePayment(tierToApi[checkoutTier], billing === 'yearly' ? 'year' : 'month'),
    initKonnect: () => subscriptionApi.initKonnectPayment(tierToApi[checkoutTier], billing === 'yearly' ? 'year' : 'month'),
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Unable to start checkout.')
    },
  })

  const loadBilling = async () => {
    setLoading(true)
    setError('')
    try {
      const [subscriptionResult, trialResult, usageResult, invoiceResult] = await Promise.allSettled([
        subscriptionApi.getMySubscription(),
        subscriptionApi.getTrialRemaining(),
        subscriptionApi.getUsageSummary(),
        subscriptionApi.getInvoices({ page: 1, limit: 10 }),
      ])

      if (subscriptionResult.status === 'fulfilled') {
        setSubscription(unwrapData<CreatorSubscription | null>(subscriptionResult.value, null))
      } else {
        setSubscription(null)
      }

      if (trialResult.status === 'fulfilled') {
        setTrial(unwrapData<TrialRemaining | null>(trialResult.value, null))
      } else {
        setTrial(null)
      }

      if (usageResult.status === 'fulfilled' && usageResult.value) {
        setUsage(unwrapData<UsageSummary | null>(usageResult.value, null))
      } else {
        setUsage(null)
      }

      if (invoiceResult.status === 'fulfilled') {
        setInvoices(unwrapInvoices(invoiceResult.value))
      } else {
        setInvoices([])
      }

      const [addonsResult, availableAddonsResult] = await Promise.allSettled([
        subscriptionApi.getMyAddons(),
        subscriptionApi.getAvailableAddons(),
      ])
      setAddons(addonsResult.status === 'fulfilled' ? unwrapArray<SubscriptionAddon>(addonsResult.value) : [])
      setAvailableAddons(availableAddonsResult.status === 'fulfilled' ? unwrapArray<SubscriptionAddon>(availableAddonsResult.value) : [])

      const failures = [subscriptionResult, trialResult]
        .filter((result) => result.status === 'rejected')
        .map((result: any) => result.reason?.message || 'Unable to load billing data')
      setError(failures.join(' '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBilling()
    setCheckoutSuccess(new URLSearchParams(window.location.search).get('checkout') === 'success')
  }, [])

  useEffect(() => {
    if (nextUpgradeTier !== tier) {
      setCheckoutTier(nextUpgradeTier)
    } else {
      setCheckoutTier(tier)
    }
  }, [nextUpgradeTier, tier])

  const openCheckout = (targetTier: PlanTier) => {
    setCheckoutTier(targetTier)
    setActionError('')
    setActionMessage('')
    paymentModal.open()
  }

  const cancelSubscription = async () => {
    setSavingCancel(true)
    setActionError('')
    setActionMessage('')
    try {
      await subscriptionApi.cancelSubscription()
      setActionMessage('Cancellation is scheduled for the end of the current billing period.')
      await loadBilling()
    } catch (err: any) {
      setActionError(err?.message || 'Unable to cancel subscription.')
    } finally {
      setSavingCancel(false)
    }
  }

  const openCustomerPortal = async () => {
    setOpeningPortal(true)
    setActionError('')
    try {
      const response = await subscriptionApi.createStripeCustomerPortal()
      const portalUrl = (response as any)?.data?.portalUrl || (response as any)?.portalUrl
      if (!portalUrl) throw new Error('No billing portal URL returned.')
      window.location.href = portalUrl
    } catch (err: any) {
      setActionError(err?.message || 'Unable to open billing portal.')
    } finally {
      setOpeningPortal(false)
    }
  }

  const submitManualProof = async () => {
    if (!manualProof) {
      setActionError('Choose a JPG, PNG, WebP, or PDF proof file first.')
      return
    }
    setSubmittingManual(true)
    setActionError('')
    setActionMessage('')
    try {
      await subscriptionApi.initManualPayment({
        tier: tierToApi[checkoutTier],
        interval: billing === 'yearly' ? 'year' : 'month',
        proof: manualProof,
      })
      setManualProof(null)
      setActionMessage('Manual transfer proof submitted. An admin will review and activate the plan after approval.')
    } catch (err: any) {
      setActionError(err?.message || 'Unable to submit manual proof.')
    } finally {
      setSubmittingManual(false)
    }
  }

  const activateAddon = async (type: SubscriptionAddonType) => {
    setAddonBusy(type)
    setActionError('')
    setActionMessage('')
    try {
      await subscriptionApi.purchaseAddon({ type, quantity: 1, billingInterval: 'month' })
      setActionMessage('Add-on activated and plan capacity updated.')
      await loadBilling()
    } catch (err: any) {
      setActionError(err?.message || 'Unable to activate add-on.')
    } finally {
      setAddonBusy(null)
    }
  }

  const cancelAddon = async (addon: SubscriptionAddon) => {
    const addonId = addon.id || addon._id
    if (!addonId) return
    setAddonBusy(addonId)
    setActionError('')
    setActionMessage('')
    try {
      await subscriptionApi.cancelAddon(addonId)
      setActionMessage('Add-on canceled and plan capacity recalculated.')
      await loadBilling()
    } catch (err: any) {
      setActionError(err?.message || 'Unable to cancel add-on.')
    } finally {
      setAddonBusy(null)
    }
  }

  const status = subscription?.status || 'none'
  const isActive = status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING
  const showPortal = Boolean(subscription?.providerCustomerId && subscription?.provider?.includes('stripe'))
  const billingInterval = subscription?.billingInterval || 'month'
  const capacityLimits = {
    communitiesMax: firstFiniteNumber(usage?.planLimits?.communitiesMax, subscription?.communitiesMax, plan.limits.communitiesMax),
    membersMax: firstFiniteNumber(usage?.planLimits?.membersMax, subscription?.membersMax, plan.limits.membersMax),
    coursesActivationMax: firstFiniteNumber(usage?.planLimits?.coursesActivationMax, subscription?.coursesActivationMax, plan.limits.coursesActivationMax),
    storageGB: firstFiniteNumber(usage?.planLimits?.storageGB, subscription?.storageGB, plan.limits.storageGB),
    adminsMax: firstFiniteNumber(usage?.planLimits?.adminsMax, subscription?.adminsMax, plan.limits.adminsMax),
  } satisfies Pick<PlanLimits, 'communitiesMax' | 'membersMax' | 'coursesActivationMax' | 'storageGB' | 'adminsMax'>
  const currentPrice = subscription?.amount != null
    ? money(subscription.amount, subscription.currency || plan.currency)
    : `${plan.monthlyPrice} TND/mo`
  const paymentMethod = subscription?.hasPaymentMethod
    ? `${subscription.paymentBrand || 'Card'}${subscription.paymentLast4 ? ` **** ${subscription.paymentLast4}` : ''}`
    : 'Not added'
  const trialRemaining = trial?.isTrialing
    ? `${trial.remaining.days}d ${trial.remaining.hours}h`
    : trial?.message || 'No active trial'
  const notice = checkoutSuccess
    ? 'Checkout confirmed. Your billing status is syncing from the payment provider.'
    : actionMessage || actionError || error

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
        title={`Start ${PLANS[checkoutTier].name}`}
        description={`Use secure checkout to start the ${PLANS[checkoutTier].name} ${billing === 'yearly' ? 'yearly' : 'monthly'} plan with the 7-day trial included.`}
      />

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex min-h-screen flex-1 flex-col">
          <DashTopbar title="Account Billing" subtitle="Manage your creator plan, checkout, trial, payment method, and invoices." />

          <main id="main-content" className="flex-1 p-6 lg:p-8" style={{ animation: 'dashFadeUp .4s ease both' }}>
            {notice && (
              <DashboardNotice
                tone={checkoutSuccess || (Boolean(actionMessage) && !error && !actionError) ? 'success' : 'warning'}
                message={notice}
              />
            )}

            {loading ? (
              <div
                className="flex min-h-[420px] items-center justify-center rounded-[14px]"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
              >
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: 'var(--p)' }} />
                  <p className="mt-3 text-[13px] font-bold" style={{ color: 'var(--t2)' }}>Loading billing workspace</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <Panel className="overflow-hidden">
                    <div className="flex flex-col gap-5 p-5 lg:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`border ${statusTone[status] || 'border-slate-500/20 bg-slate-500/10 text-slate-700'}`}>
                              {status === 'none' ? 'No subscription' : status.replace('_', ' ')}
                            </Badge>
                            {subscription?.cancelAtPeriodEnd && (
                              <Badge variant="outline" className="border-amber-500/25 bg-amber-500/10 text-amber-700">
                                Cancels at period end
                              </Badge>
                            )}
                          </div>
                          <h2 className="mt-4 text-[24px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--t1)' }}>
                            {plan.name} plan
                          </h2>
                          <p className="mt-2 max-w-2xl text-[13px] leading-6" style={{ color: 'var(--t2)' }}>
                            Creator platform billing for plan limits, premium tools, transaction fees, checkout providers, and invoice history.
                          </p>
                        </div>

                        <div className="min-w-[180px] rounded-xl px-4 py-3 text-left lg:text-right" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                          <p className="text-[11px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--t3)' }}>Current price</p>
                          <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums" style={{ color: 'var(--t1)' }}>{currentPrice}</p>
                          <p className="mt-2 text-[12px] font-semibold capitalize" style={{ color: 'var(--t3)' }}>{billingInterval} billing</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Metric icon={CalendarClock} label={status === SubscriptionStatus.TRIALING ? 'Trial ends' : 'Period ends'} value={formatDate(subscription?.trialEndsAt || subscription?.currentPeriodEnd || subscription?.nextBillingAt)} />
                        <Metric icon={CreditCard} label="Payment method" value={paymentMethod} />
                        <Metric icon={ShieldCheck} label="Transaction fee" value={`${plan.transactionFee}% + ${plan.transactionFixedFee} TND`} />
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => openCheckout(nextUpgradeTier !== tier ? nextUpgradeTier : 'pro')}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
                          style={{ background: 'var(--p)', color: '#fff' }}
                        >
                          {nextUpgradeTier !== tier ? `Upgrade to ${PLANS[nextUpgradeTier].name}` : 'Refresh Pro checkout'}
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <DashboardButton onClick={() => openCheckout(tier)}>Update billing cycle</DashboardButton>
                        {showPortal && (
                          <DashboardButton onClick={openCustomerPortal} disabled={openingPortal}>
                            {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                            Stripe portal
                          </DashboardButton>
                        )}
                        {isActive && !subscription?.cancelAtPeriodEnd && (
                          <DashboardButton onClick={cancelSubscription} disabled={savingCancel} danger>
                            {savingCancel ? 'Scheduling...' : 'Cancel at period end'}
                          </DashboardButton>
                        )}
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Checkout" subtitle="Choose interval and provider checkout.">
                    <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                      {(['monthly', 'yearly'] as Billing[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBilling(option)}
                          className="h-9 rounded-lg text-[12px] font-bold capitalize transition-all"
                          style={billing === option ? { background: 'var(--white)', color: 'var(--t1)', boxShadow: '0 8px 18px rgba(142,120,251,.10)' } : { color: 'var(--t3)' }}
                        >
                          {option === 'yearly' ? 'Yearly' : 'Monthly'}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {PLAN_TIERS.map((item) => {
                        const selected = checkoutTier === item
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => openCheckout(item)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-all hover:-translate-y-px"
                            style={{
                              background: selected ? 'var(--p2)' : 'var(--white)',
                              border: `1px solid ${selected ? 'var(--p)' : 'var(--bd)'}`,
                              color: selected ? 'var(--p)' : 'var(--t1)',
                            }}
                          >
                            <span className="text-[13px] font-bold">{PLANS[item].name}</span>
                            <span className="text-[12px] font-semibold" style={{ color: selected ? 'var(--p)' : 'var(--t3)' }}>
                              {billing === 'yearly' ? `${PLANS[item].yearlyMonthlyPrice} TND/mo` : `${PLANS[item].monthlyPrice} TND/mo`}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-5 rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--t3)' }}>Manual transfer</p>
                      <p className="mt-1 text-[12px] leading-5" style={{ color: 'var(--t2)' }}>Submit proof for admin review when provider checkout is not available.</p>
                      <label
                        className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 text-[12px] font-bold transition-colors hover:opacity-80"
                        style={{ borderColor: 'var(--bd2)', color: 'var(--t2)', background: 'var(--white)' }}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="truncate">{manualProof ? manualProof.name : 'Choose proof'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="sr-only"
                          onChange={(event) => setManualProof(event.target.files?.[0] || null)}
                        />
                      </label>
                      <button
                        type="button"
                        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
                        style={{ background: manualProof ? 'var(--p)' : 'var(--white)', border: '1px solid var(--bd)', color: manualProof ? '#fff' : 'var(--t3)' }}
                        disabled={submittingManual || !manualProof}
                        onClick={submitManualProof}
                      >
                        {submittingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Submit proof
                      </button>
                    </div>
                  </Panel>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <Panel title="Trial and renewal" subtitle="Current provider period and local trial state.">
                    <div className="mb-5 flex justify-end">
                      <button
                        type="button"
                        onClick={loadBilling}
                        className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-bold transition-opacity hover:opacity-80"
                        style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>

                    <div className="grid gap-3">
                      <InfoRow label="Trial active" value={trial?.isTrialing ? 'Yes' : 'No'} positive={Boolean(trial?.isTrialing)} />
                      <InfoRow label="Trial remaining" value={trialRemaining} />
                      <InfoRow label="Next billing date" value={formatDate(subscription?.nextBillingAt || subscription?.currentPeriodEnd)} />
                      <InfoRow label="Cancel state" value={subscription?.cancelAtPeriodEnd ? 'Scheduled cancellation' : 'Renews normally'} positive={!subscription?.cancelAtPeriodEnd} />
                    </div>
                  </Panel>

                  <Panel title="Plan capacity" subtitle="Usage comes from the subscription usage API when available.">
                    <div className="mt-5 space-y-4">
                      {usageRows.map((row) => {
                        const current = firstFiniteNumber((usage as any)?.[row.usageKey])
                        const limit = firstFiniteNumber((capacityLimits as any)[row.key], plan.limits[row.key])
                        return <CapacityRow key={row.key} label={row.label} current={current} limit={limit} suffix={row.suffix} />
                      })}
                      {!usage && (
                        <div className="rounded-xl p-4 text-[13px] leading-6" style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t2)' }}>
                          Usage data is not available yet. Current plan limits: {formatLimit(capacityLimits.membersMax)} members, {formatLimit(capacityLimits.coursesActivationMax)} active courses, {formatLimit(capacityLimits.storageGB)} GB storage.
                        </div>
                      )}
                    </div>
                  </Panel>
                </section>

                <Panel title="Add-ons" subtitle="Only backend-configured add-ons appear here.">
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {availableAddons.map((addon) => (
                      <div key={addon.type} className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{addon.label}</p>
                            <p className="mt-1 text-[12px] font-semibold" style={{ color: 'var(--t3)' }}>{money(addon.unitAmount, addon.currency)} / {addon.billingInterval}</p>
                          </div>
                          <Button size="sm" onClick={() => activateAddon(addon.type)} disabled={addonBusy === addon.type} className="gap-2 rounded-xl" style={{ background: 'var(--p)', color: '#fff' }}>
                            {addonBusy === addon.type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {addons.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-xl" style={{ border: '1px solid var(--bd)' }}>
                      {addons.map((addon) => {
                        const addonId = addon.id || addon._id || addon.type
                        return (
                          <div key={addonId} className="flex flex-col gap-3 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
                            <div>
                              <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{addon.label}</p>
                              <p className="text-[12px]" style={{ color: 'var(--t3)' }}>Qty {addon.quantity} · {money(Number(addon.unitAmount) * Number(addon.quantity || 1), addon.currency)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => cancelAddon(addon)} disabled={addonBusy === addonId} className="gap-2 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50">
                              {addonBusy === addonId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Cancel
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {availableAddons.length === 0 && addons.length === 0 && (
                    <EmptyState icon={Plus} title="No add-ons configured" text="This account has no active or purchasable add-ons from the backend right now." />
                  )}
                </Panel>

                <Panel title="Invoices" subtitle="Provider invoices and reconciled manual plan payments." icon={WalletCards}>
                  {invoices.length > 0 ? (
                    <div className="mt-5 overflow-hidden rounded-xl" style={{ border: '1px solid var(--bd)' }}>
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="grid gap-3 px-4 py-3 text-[13px] last:border-b-0 sm:grid-cols-[1fr_120px_120px]" style={{ borderBottom: '1px solid var(--bd)' }}>
                          <div>
                            <p className="font-bold" style={{ color: 'var(--t1)' }}>{invoice.invoiceNumber || invoice.id}</p>
                            <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{formatDate(invoice.invoiceDate)}</p>
                          </div>
                          <p className="font-bold" style={{ color: 'var(--t2)' }}>{money(invoice.total, invoice.currency)}</p>
                          <div className="flex flex-col gap-2">
                            <Badge variant="outline" className="w-fit capitalize">{invoice.status}</Badge>
                            {invoice.invoicePdfUrl && (
                              <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                                <a href={invoice.invoicePdfUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={AlertCircle} title="No invoices yet" text="Paid provider checkouts and approved manual proofs will appear here after reconciliation." />
                  )}
                </Panel>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--t3)' }}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 min-h-6 text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{value || '-'}</p>
    </div>
  )
}

function CapacityRow({ label, current, limit, suffix = '' }: { label: string; current: number; limit: number; suffix?: string }) {
  const isUnlimited = limit >= 999999
  const percent = isUnlimited || limit <= 0 ? 0 : Math.min(100, (current / limit) * 100)
  const currentValue = `${formatUsageAmount(current)}${suffix}`
  const value = isUnlimited
    ? `${currentValue} / Unlimited`
    : `${currentValue} / ${formatLimit(limit)}${suffix}`

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-[13px]">
        <span style={{ color: 'var(--t2)' }}>{label}</span>
        <span className="font-bold" style={{ color: 'var(--t1)' }}>{value}</span>
      </div>
      {!isUnlimited && (
        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bd)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: percent >= 90 ? '#ef4444' : percent >= 75 ? 'var(--orange)' : 'var(--p)' }} />
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
      <span className="text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>{label}</span>
      <span className="inline-flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--t1)' }}>
        {positive === true && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        {positive === false && <XCircle className="h-4 w-4" style={{ color: 'var(--t3)' }} />}
        {value}
      </span>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  className = '',
  children,
}: {
  title?: string
  subtitle?: string
  icon?: LucideIcon
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-[14px] ${className}`} style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      {(title || subtitle || Icon) && (
        <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{title}</h2>}
            {subtitle && <p className="mt-1 text-[12px] leading-5" style={{ color: 'var(--t3)' }}>{subtitle}</p>}
          </div>
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
      <div className={title || subtitle || Icon ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

function DashboardButton({
  children,
  danger,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{
        border: `1px solid ${danger ? 'rgba(239,68,68,.25)' : 'var(--bd)'}`,
        background: danger ? 'rgba(239,68,68,.08)' : 'var(--white)',
        color: danger ? '#b83232' : 'var(--t2)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function DashboardNotice({ tone, message }: { tone: 'success' | 'warning'; message: string }) {
  const success = tone === 'success'
  return (
    <div
      className="mb-5 rounded-[14px] border px-4 py-3 text-[13px] font-semibold"
      style={success
        ? { background: 'rgba(34,197,94,.1)', borderColor: 'rgba(34,197,94,.22)', color: '#15803d' }
        : { background: 'rgba(251,146,60,.1)', borderColor: 'rgba(251,146,60,.24)', color: '#b45309' }}
    >
      {message}
    </div>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed p-4" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--t3)' }} />
      <div>
        <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{title}</p>
        <p className="mt-1 text-[12px] leading-5" style={{ color: 'var(--t2)' }}>{text}</p>
      </div>
    </div>
  )
}
