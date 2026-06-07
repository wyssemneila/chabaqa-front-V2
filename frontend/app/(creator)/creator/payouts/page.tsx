'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Banknote, CheckCircle2, CreditCard, Pencil, RefreshCw, Save, Wallet, X } from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { creatorAnalyticsApi, type TunisianBankCredentials } from '@/lib/api/creator-analytics.api'
import { paymentsApi } from '@/lib/api/payments.api'

type PayoutStatus = 'paid' | 'processing' | 'pending' | 'cancelled' | string

interface PayoutRow {
  id: string
  amount: number
  status: PayoutStatus
  date: string
  method: string
  reference: string
}

const unwrapList = (response: any): any[] => {
  const source =
    response?.data?.data ||
    response?.data?.items ||
    response?.data?.payouts ||
    response?.data ||
    response?.items ||
    response?.payouts ||
    response
  return Array.isArray(source) ? source : []
}

const unwrapData = (response: any) => response?.data?.data || response?.data || response || {}
const money = (value: unknown) => `${Number(value || 0).toLocaleString()} TND`
const emptyBankForm: TunisianBankCredentials = { rib: '', bankName: '', ownerName: '' }

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '-'
}

const mapPayout = (item: any, index: number): PayoutRow => ({
  id: String(item?.id || item?._id || item?.payoutId || `payout-${index}`),
  amount: Number(item?.amount || item?.netAmount || item?.total || 0),
  status: String(item?.status || 'pending'),
  date: String(item?.createdAt || item?.paidAt || item?.processedAt || item?.date || ''),
  method: String(item?.method || item?.payoutMethod || item?.provider || 'Bank transfer'),
  reference: String(item?.reference || item?.ref || item?.providerPayoutId || item?.id || item?._id || '-'),
})

const statusClass = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === 'paid' || normalized === 'completed' || normalized === 'processed') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
  if (normalized === 'processing') return 'bg-blue-500/10 text-blue-600 border-blue-500/25'
  if (normalized === 'cancelled' || normalized === 'failed') return 'bg-rose-500/10 text-rose-600 border-rose-500/25'
  return 'bg-amber-500/10 text-amber-600 border-amber-500/25'
}

export default function CreatorPayoutsPage() {
  const { selectedCommunityId } = useCreatorCommunity()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [stats, setStats] = useState<any>({})
  const [balance, setBalance] = useState(0)
  const [bank, setBank] = useState<TunisianBankCredentials | null>(null)
  const [bankConfigured, setBankConfigured] = useState(false)
  const [bankForm, setBankForm] = useState<TunisianBankCredentials>(emptyBankForm)
  const [editingBank, setEditingBank] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bankError, setBankError] = useState('')
  const [amount, setAmount] = useState('')
  const [requesting, setRequesting] = useState(false)

  const loadPayouts = async () => {
    setLoading(true)
    setError('')
    try {
      const [listResult, statsResult, balanceResult, bankResult] = await Promise.allSettled([
        paymentsApi.getPayouts({ page: 1, limit: 100 }),
        paymentsApi.getPayoutStats(),
        paymentsApi.getAvailableBalance(),
        creatorAnalyticsApi.getBankCredentials(),
      ])

      if (listResult.status === 'fulfilled') setPayouts(unwrapList(listResult.value).map(mapPayout))
      else setPayouts([])

      if (statsResult.status === 'fulfilled') setStats(unwrapData(statsResult.value))
      else setStats({})

      if (balanceResult.status === 'fulfilled') {
        const data = unwrapData(balanceResult.value)
        setBalance(Number(data?.availableBalance ?? data?.balance ?? data?.amount ?? 0))
      } else {
        setBalance(0)
      }

      if (bankResult.status === 'fulfilled') {
        const data = unwrapData(bankResult.value)
        const details = data?.bankDetails || null
        setBank(details)
        setBankConfigured(Boolean(data?.isConfigured && details))
        setBankForm(details || emptyBankForm)
        setEditingBank(!data?.isConfigured)
      } else {
        setBank(null)
        setBankConfigured(false)
        setBankForm(emptyBankForm)
        setEditingBank(true)
      }

      const failures = [listResult, statsResult, balanceResult, bankResult]
        .filter((result) => result.status === 'rejected')
        .map((result: any) => result.reason?.message || 'Unable to load payout data')
      setError(failures.join(' · '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPayouts()
  }, [])

  const totals = useMemo(() => {
    const paid = payouts.filter((payout) => ['paid', 'completed', 'processed'].includes(payout.status.toLowerCase()))
    const pending = payouts.filter((payout) => !['paid', 'completed', 'processed', 'cancelled', 'failed'].includes(payout.status.toLowerCase()))
    return {
      totalPaid: Number(stats?.totalPaid ?? stats?.paidAmount ?? paid.reduce((sum, payout) => sum + payout.amount, 0)),
      pendingAmount: Number(stats?.pendingAmount ?? pending.reduce((sum, payout) => sum + payout.amount, 0)),
      payoutCount: Number(stats?.totalPayouts ?? stats?.count ?? payouts.length),
    }
  }, [payouts, stats])

  const requestPayout = async () => {
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return
    if (!selectedCommunityId) {
      setError('Select a community before requesting a payout.')
      return
    }
    if (!bankConfigured) {
      setError('Configure valid bank credentials before requesting a payout.')
      return
    }
    setRequesting(true)
    setError('')
    try {
      await paymentsApi.requestPayout({ amount: parsedAmount, method: 'bank_transfer', communityId: selectedCommunityId })
      setAmount('')
      await loadPayouts()
    } catch (err: any) {
      setError(err?.message || 'Failed to request payout.')
    } finally {
      setRequesting(false)
    }
  }

  const saveBankCredentials = async () => {
    const payload: TunisianBankCredentials = {
      rib: bankForm.rib.replace(/\D/g, ''),
      bankName: bankForm.bankName.trim(),
      ownerName: bankForm.ownerName.trim(),
    }

    if (!/^\d{20}$/.test(payload.rib)) {
      setBankError('RIB must contain exactly 20 digits.')
      return
    }
    if (!payload.bankName) {
      setBankError('Bank name is required.')
      return
    }
    if (!payload.ownerName) {
      setBankError('Account holder name is required.')
      return
    }

    setSavingBank(true)
    setBankError('')
    try {
      const response = await creatorAnalyticsApi.updateBankCredentials(payload)
      const data = unwrapData(response)
      const details = data?.bankDetails || payload
      setBank(details)
      setBankConfigured(Boolean(data?.isConfigured ?? true))
      setBankForm(details)
      setEditingBank(false)
    } catch (err: any) {
      setBankError(err?.message || 'Failed to save bank credentials.')
    } finally {
      setSavingBank(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar title="Payouts" subtitle="Available balance, payout requests, bank credentials, and payout history." />

        <main id="main-content" className="flex-1 p-6 lg:p-8 space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Available balance', money(balance), Wallet, 'text-emerald-600 bg-emerald-500/10'],
              ['Total paid out', money(totals.totalPaid), CheckCircle2, 'text-blue-600 bg-blue-500/10'],
              ['Pending payouts', money(totals.pendingAmount), AlertCircle, 'text-amber-600 bg-amber-500/10'],
              ['Payout count', totals.payoutCount, Banknote, 'text-indigo-600 bg-indigo-500/10'],
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

          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <section className="rounded-2xl shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-center justify-between gap-3 p-5" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div>
                  <h2 className="text-[16px] font-black" style={{ color: 'var(--t1)' }}>Payout history</h2>
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--t3)' }}>Fetched from the payout API.</p>
                </div>
                <button
                  type="button"
                  onClick={loadPayouts}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-black transition-opacity hover:opacity-80"
                  style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                </div>
              ) : payouts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[15px] font-black" style={{ color: 'var(--t1)' }}>No payouts yet</p>
                  <p className="mt-2 text-[13px]" style={{ color: 'var(--t3)' }}>Payout requests and processed payouts will appear here.</p>
                </div>
              ) : (
                <div>
                  {payouts.map((payout) => (
                    <div key={payout.id} className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-4 px-5 py-4 text-[13px]" style={{ borderBottom: '1px solid var(--bd)' }}>
                      <div>
                        <p className="font-black" style={{ color: 'var(--t1)' }}>{payout.reference}</p>
                        <p className="mt-1 text-[12px]" style={{ color: 'var(--t3)' }}>{payout.method}</p>
                      </div>
                      <p className="font-black tabular-nums" style={{ color: 'var(--t1)' }}>{money(payout.amount)}</p>
                      <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusClass(payout.status)}`}>
                        {payout.status}
                      </span>
                      <p className="font-semibold" style={{ color: 'var(--t2)' }}>{formatDate(payout.date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl p-5 shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--bg)', color: 'var(--t2)' }}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-black" style={{ color: 'var(--t1)' }}>Bank credentials</h2>
                    <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{bankConfigured ? 'Tunisian bank account configured' : 'Required before requesting payouts'}</p>
                  </div>
                  {bankConfigured && !editingBank && (
                    <button
                      type="button"
                      onClick={() => setEditingBank(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12px] font-black transition-opacity hover:opacity-80"
                      style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {editingBank ? (
                  <div className="mt-5 space-y-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-bold" style={{ color: 'var(--t2)' }}>RIB</span>
                      <input
                        value={bankForm.rib}
                        onChange={(event) => setBankForm((current) => ({ ...current, rib: event.target.value.replace(/\D/g, '').slice(0, 20) }))}
                        inputMode="numeric"
                        maxLength={20}
                        placeholder="12345678901234567890"
                        className="h-11 w-full rounded-xl px-3 text-[13px] font-semibold tracking-[0.08em] outline-none focus:ring-2 focus:ring-indigo-500/15"
                        style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                      />
                      <span className="mt-1 block text-[11px]" style={{ color: 'var(--t3)' }}>{bankForm.rib.length}/20 digits</span>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-bold" style={{ color: 'var(--t2)' }}>Bank name</span>
                      <input
                        value={bankForm.bankName}
                        onChange={(event) => setBankForm((current) => ({ ...current, bankName: event.target.value }))}
                        placeholder="Attijari Bank"
                        className="h-11 w-full rounded-xl px-3 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/15"
                        style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-bold" style={{ color: 'var(--t2)' }}>Account holder name</span>
                      <input
                        value={bankForm.ownerName}
                        onChange={(event) => setBankForm((current) => ({ ...current, ownerName: event.target.value }))}
                        placeholder="Mohamed Trabelsi"
                        className="h-11 w-full rounded-xl px-3 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/15"
                        style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                      />
                    </label>

                    {bankError && (
                      <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-[12px] font-bold text-rose-600">{bankError}</div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {bankConfigured && (
                        <button
                          type="button"
                          onClick={() => {
                            setBankForm(bank || emptyBankForm)
                            setBankError('')
                            setEditingBank(false)
                          }}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-black transition-opacity hover:opacity-80"
                          style={{ border: '1px solid var(--bd)', color: 'var(--t2)' }}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={saveBankCredentials}
                        disabled={savingBank}
                        className={`${bankConfigured ? '' : 'col-span-2'} inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
                        style={{ background: 'var(--p)' }}
                      >
                        <Save className="h-4 w-4" />
                        {savingBank ? 'Saving' : 'Save bank details'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl p-4 text-[13px] font-semibold" style={{ background: 'var(--bg)', color: 'var(--t2)' }}>
                    {bank ? (
                      <div className="space-y-2">
                        <p>Owner: {bank.ownerName}</p>
                        <p>Bank: {bank.bankName}</p>
                        <p>RIB: {bank.rib.replace(/^(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})$/, '$1 $2 $3 $4 $5')}</p>
                      </div>
                    ) : (
                      <p>Save a Tunisian RIB, bank name, and account holder name before requesting payouts.</p>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl p-5 shadow-sm" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <h2 className="text-[16px] font-black" style={{ color: 'var(--t1)' }}>Request payout</h2>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--t3)' }}>Request a payout from the available balance.</p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="Amount"
                    className="h-11 min-w-0 flex-1 rounded-xl px-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/15"
                    style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                  />
                  <button
                    type="button"
                    onClick={requestPayout}
                    disabled={requesting}
                    className="h-11 rounded-xl px-4 text-[13px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--p)' }}
                  >
                    {requesting ? 'Requesting' : 'Request'}
                  </button>
                </div>
              </section>
            </aside>
          </div>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-semibold text-amber-800">{error}</div>
          )}
        </main>
      </div>
    </div>
  )
}
