'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
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
import { UsageIndicator } from '@/components/plan/usage-indicator'
import { isPlanEnforcementEnabled } from '@/hooks/use-plan'

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
  const showUsageIndicators = isPlanEnforcementEnabled()

  return (
    <>
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

          <main id="main-content" className="flex-1 p-6 lg:p-8">
            {checkoutSuccess && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-semibold text-emerald-800">
                Checkout confirmed. Your billing status is syncing from the payment provider.
              </div>
            )}

            {(error || actionError || actionMessage) && (
              <div
                className={`mb-5 rounded-2xl border p-4 text-[13px] font-semibold ${
                  actionMessage && !error && !actionError
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {actionMessage || actionError || error}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Loading billing workspace</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600" />
                    <div className="p-5 lg:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={statusTone[status] || 'border-slate-200 bg-slate-50 text-slate-700'}>
                              {status === 'none' ? 'No subscription' : status.replace('_', ' ')}
                            </Badge>
                            {subscription?.cancelAtPeriodEnd && (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                Cancels at period end
                              </Badge>
                            )}
                          </div>
                          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                            {plan.name} plan
                          </h1>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Your account plan controls creator limits, premium features, and platform transaction fees.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Current price</p>
                          <p className="mt-1 text-2xl font-black text-slate-950">
                            {subscription?.amount != null ? money(subscription.amount, subscription.currency || plan.currency) : `${plan.monthlyPrice} TND/mo`}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {subscription?.billingInterval || 'month'} billing
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <Metric
                          icon={CalendarClock}
                          label={status === SubscriptionStatus.TRIALING ? 'Trial ends' : 'Period ends'}
                          value={formatDate(subscription?.trialEndsAt || subscription?.currentPeriodEnd || subscription?.nextBillingAt)}
                        />
                        <Metric
                          icon={CreditCard}
                          label="Payment method"
                          value={subscription?.hasPaymentMethod ? `${subscription.paymentBrand || 'Card'} ${subscription.paymentLast4 ? `**** ${subscription.paymentLast4}` : ''}` : 'Not added'}
                        />
                        <Metric
                          icon={ShieldCheck}
                          label="Transaction fee"
                          value={`${plan.transactionFee}% + ${plan.transactionFixedFee} TND`}
                        />
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {nextUpgradeTier !== tier ? (
                          <Button onClick={() => openCheckout(nextUpgradeTier)} className="gap-2">
                            Upgrade to {PLANS[nextUpgradeTier].name}
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => openCheckout('pro')} className="gap-2">
                            Refresh Pro checkout
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => openCheckout(tier)}>
                          Update billing cycle
                        </Button>
                        {showPortal && (
                          <Button variant="outline" onClick={openCustomerPortal} disabled={openingPortal} className="gap-2">
                            {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                            Stripe portal
                          </Button>
                        )}
                        {isActive && !subscription?.cancelAtPeriodEnd && (
                          <Button variant="outline" onClick={cancelSubscription} disabled={savingCancel} className="border-rose-200 text-rose-700 hover:bg-rose-50">
                            {savingCancel ? 'Scheduling...' : 'Cancel at period end'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-black text-slate-950">Checkout options</h2>
                    <p className="mt-1 text-sm text-slate-500">Choose billing interval before opening provider checkout.</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                      {(['monthly', 'yearly'] as Billing[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBilling(option)}
                          className={`h-11 rounded-lg text-sm font-black transition-colors ${
                            billing === option ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {option === 'yearly' ? 'Yearly' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {PLAN_TIERS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => openCheckout(item)}
                          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="text-sm font-black text-slate-800">{PLANS[item].name}</span>
                          <span className="text-xs font-bold text-slate-500">
                            {billing === 'yearly' ? `${PLANS[item].yearlyMonthlyPrice} TND/mo` : `${PLANS[item].monthlyPrice} TND/mo`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Manual transfer</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Submit proof for admin review when card checkout is not available.</p>
                      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 text-xs font-black text-slate-600 hover:bg-slate-50">
                        <Upload className="h-4 w-4" />
                        <span className="truncate">{manualProof ? manualProof.name : 'Choose proof'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="sr-only"
                          onChange={(event) => setManualProof(event.target.files?.[0] || null)}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 w-full gap-2"
                        disabled={submittingManual || !manualProof}
                        onClick={submitManualProof}
                      >
                        {submittingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Submit proof
                      </Button>
                    </div>
                  </aside>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-950">Trial and renewal</h2>
                        <p className="mt-1 text-sm text-slate-500">Current provider period and local trial state.</p>
                      </div>
                      <button
                        type="button"
                        onClick={loadBilling}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <InfoRow label="Trial active" value={trial?.isTrialing ? 'Yes' : 'No'} positive={Boolean(trial?.isTrialing)} />
                      <InfoRow label="Trial remaining" value={trial?.isTrialing ? `${trial.remaining.days}d ${trial.remaining.hours}h` : trial?.message || 'No active trial'} />
                      <InfoRow label="Next billing date" value={formatDate(subscription?.nextBillingAt || subscription?.currentPeriodEnd)} />
                      <InfoRow label="Cancel state" value={subscription?.cancelAtPeriodEnd ? 'Scheduled cancellation' : 'Renews normally'} positive={!subscription?.cancelAtPeriodEnd} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-black text-slate-950">Plan capacity</h2>
                    <p className="mt-1 text-sm text-slate-500">Usage comes from the subscription usage API when available.</p>
                    <div className="mt-5 space-y-4">
                      {usageRows.map((row) => {
                        const current = Number((usage as any)?.[row.usageKey] || 0)
                        const limit = Number(plan.limits[row.key] || 0)
                        return (
                          showUsageIndicators ? (
                            <UsageIndicator
                              key={row.key}
                              label={row.label}
                              current={current}
                              limitKey={row.key}
                              suffix={row.suffix}
                            />
                          ) : (
                            <CapacityRow
                              key={row.key}
                              label={row.label}
                              current={current}
                              limit={limit}
                              suffix={row.suffix}
                            />
                          )
                        )
                      })}
                      {!usage && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          Usage data is not available yet. Current plan limits: {formatLimit(plan.limits.membersMax)} members, {formatLimit(plan.limits.coursesActivationMax)} active courses, {plan.limits.storageGB} GB storage.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <h2 className="text-base font-black text-slate-950">Add-ons</h2>
                    <p className="mt-1 text-sm text-slate-500">Extra storage and admin seats update the active plan limits immediately.</p>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {availableAddons.map((addon) => (
                      <div key={addon.type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">{addon.label}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{money(addon.unitAmount, addon.currency)} / {addon.billingInterval}</p>
                          </div>
                          <Button size="sm" onClick={() => activateAddon(addon.type)} disabled={addonBusy === addon.type} className="gap-2">
                            {addonBusy === addon.type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {addons.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                      {addons.map((addon) => {
                        const addonId = addon.id || addon._id || addon.type
                        return (
                          <div key={addonId} className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-black text-slate-900">{addon.label}</p>
                              <p className="text-xs text-slate-500">Qty {addon.quantity} · {money(Number(addon.unitAmount) * Number(addon.quantity || 1), addon.currency)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => cancelAddon(addon)} disabled={addonBusy === addonId} className="gap-2">
                              {addonBusy === addonId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Cancel
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-950">Invoices</h2>
                      <p className="mt-1 text-sm text-slate-500">Provider invoices will appear here when available.</p>
                    </div>
                    <WalletCards className="h-5 w-5 text-slate-400" />
                  </div>

                  {invoices.length > 0 ? (
                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="grid gap-3 border-b border-slate-200 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_120px_120px]">
                          <div>
                            <p className="font-black text-slate-900">{invoice.invoiceNumber || invoice.id}</p>
                            <p className="text-xs text-slate-500">{formatDate(invoice.invoiceDate)}</p>
                          </div>
                          <p className="font-bold text-slate-700">{money(invoice.total, invoice.currency)}</p>
                          <Badge variant="outline" className="w-fit capitalize">{invoice.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <p className="text-sm leading-6 text-slate-600">
                        No invoices yet. Paid provider checkouts and approved manual proofs will appear here after reconciliation.
                      </p>
                    </div>
                  )}
                </section>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 min-h-6 text-sm font-black text-slate-900">{value || '-'}</p>
    </div>
  )
}

function CapacityRow({ label, current, limit, suffix = '' }: { label: string; current: number; limit: number; suffix?: string }) {
  const isUnlimited = limit >= 999999
  const percent = isUnlimited || limit <= 0 ? 0 : Math.min(100, (current / limit) * 100)
  const value = isUnlimited
    ? `${current.toLocaleString()}${suffix} / Unlimited`
    : `${current.toLocaleString()}${suffix} / ${formatLimit(limit)}${suffix}`

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{value}</span>
      </div>
      {!isUnlimited && <Progress value={percent} />}
    </div>
  )
}

function InfoRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
        {positive === true && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        {positive === false && <XCircle className="h-4 w-4 text-slate-400" />}
        {value}
      </span>
    </div>
  )
}
