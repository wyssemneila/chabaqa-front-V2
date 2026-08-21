'use client'

import { useEffect, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  CreditCard, ArrowRight, X, Download, CheckCircle2, Sparkles,
} from 'lucide-react'

type Plan = 'starter' | 'pro' | 'business'
type Cycle = 'monthly' | 'yearly'

const PLANS: { id: Plan; label: string; price: number; yearly: number; features: string[] }[] = [
  { id: 'starter',  label: 'Starter',  price: 29,  yearly: 290,  features: ['1 community', 'Up to 100 members', 'Basic analytics'] },
  { id: 'pro',      label: 'Pro',      price: 79,  yearly: 790,  features: ['3 communities', 'Unlimited members', 'Advanced analytics', 'Custom domain'] },
  { id: 'business', label: 'Business', price: 199, yearly: 1990, features: ['Unlimited communities', 'White-label', 'Team seats', 'API access'] },
]

const INVOICES = [
  { id: 'INV-2026-0812', date: 'Aug 12, 2026', amount: 79, plan: 'Pro' },
  { id: 'INV-2026-0712', date: 'Jul 12, 2026', amount: 79, plan: 'Pro' },
  { id: 'INV-2026-0612', date: 'Jun 12, 2026', amount: 79, plan: 'Pro' },
]

export default function BillingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [currentPlan] = useState<Plan>('pro')
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [newPlan, setNewPlan] = useState<Plan>(currentPlan)
  const [trialEnd] = useState('September 4, 2026')
  const [card] = useState({ brand: 'VISA', last4: '8240' })
  const [showUpdate, setShowUpdate] = useState(false)
  const [showManage, setShowManage] = useState(false)

  const plan = PLANS.find(p => p.id === currentPlan)!

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto pb-24">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              {t('Billing', 'الفوترة')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {t('Manage your subscription and payment method.', 'أدر اشتراكك وطريقة الدفع.')}
            </p>
          </div>

          {/* Main billing card — Skool style */}
          <div className="rounded-2xl border p-6 mb-4"
               style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>
                  {t('Current plan', 'الخطة الحالية')}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-bold" style={{ color: 'var(--t1)' }}>{plan.label}</span>
                  <span className="text-[13px]" style={{ color: 'var(--t3)' }}>· ${plan.price}/{t('mo', 'شهر')}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold self-start"
                    style={{ background: 'var(--o2)', color: 'var(--orange)' }}>
                {t('Trial', 'تجريبي')}
              </span>
            </div>

            {/* Line items */}
            <div className="space-y-1 mb-5">
              <LineItem label={t('Payment method', 'طريقة الدفع')}
                        value={`${card.brand} •••• ${card.last4}`} />
              <LineItem label={t('Trial ends', 'انتهاء التجربة')} value={trialEnd} />
              <LineItem label={t('Next billing amount', 'المبلغ التالي')} value={`$${plan.price}.00`} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap pt-4 border-t" style={{ borderColor: 'var(--bd)' }}>
              <button onClick={() => setShowUpdate(true)}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
                style={{ background: 'var(--bg)', color: 'var(--t1)' }}>
                <CreditCard size={13} /> {t('Update payment method', 'تحديث طريقة الدفع')}
              </button>
              <button onClick={() => setShowManage(true)}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold"
                style={{ background: 'var(--p)', color: '#fff' }}>
                {t('Manage subscription', 'إدارة الاشتراك')}
              </button>
            </div>
          </div>

          {/* Tip */}
          <button onClick={() => { setCycle('yearly'); setShowManage(true) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-90 mb-6"
            style={{ background: 'var(--o2)' }}>
            <span className="text-[18px]">🎁</span>
            <p className="text-[12px] flex-1" style={{ color: 'var(--t1)' }}>
              <span className="font-semibold">{t('Get 2 months free', 'احصل على شهرين مجانًا')}</span>
              <span style={{ color: 'var(--t2)' }}> — {t('switch to yearly billing.', 'بدّل إلى الفوترة السنوية.')}</span>
            </p>
            <ArrowRight size={13} style={{ color: 'var(--orange)' }} />
          </button>

          {/* Invoices */}
          <div className="rounded-2xl border overflow-hidden"
               style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--bd)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                {t('Billing history', 'سجل الفوترة')}
              </p>
            </div>
            {INVOICES.map((inv, i) => (
              <div key={inv.id}
                   className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--bg)] transition-colors"
                   style={{ borderTop: i > 0 ? '1px solid var(--bd)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>
                    {inv.date}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{inv.plan} · {inv.id}</p>
                </div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>${inv.amount.toFixed(2)}</p>
                <button title={t('Download', 'تنزيل')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: 'var(--t3)' }}>
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showUpdate && (
        <Modal onClose={() => setShowUpdate(false)}>
          <div style={{ width: 420 }}>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('Update payment method', 'تحديث طريقة الدفع')}
            </h3>
            <p className="text-[12px] mb-5" style={{ color: 'var(--t3)' }}>
              {t('Your card will be replaced for all future charges.', 'سيتم استبدال البطاقة لكل المدفوعات المستقبلية.')}
            </p>

            <div className="space-y-3">
              <FormField label={t('Card number', 'رقم البطاقة')}>
                <input placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
                  style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('Expiry', 'الانتهاء')}>
                  <input placeholder="MM / YY"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
                    style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
                </FormField>
                <FormField label="CVC">
                  <input placeholder="123"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
                    style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
                </FormField>
              </div>
              <FormField label={t('Name on card', 'الاسم على البطاقة')}>
                <input placeholder={t('Full name', 'الاسم الكامل')}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
                  style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
              </FormField>
            </div>

            <p className="text-[11px] mt-3" style={{ color: 'var(--t3)' }}>
              {t('Payments secured by Stripe.', 'المدفوعات آمنة عبر Stripe.')}
            </p>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowUpdate(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
                {t('CANCEL', 'إلغاء')}
              </button>
              <button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: 'var(--p)' }}>
                {t('Save card', 'حفظ البطاقة')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showManage && (
        <Modal onClose={() => setShowManage(false)}>
          <div style={{ width: 620 }}>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('Manage your subscription', 'أدر اشتراكك')}
            </h3>
            <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
              {t('Change your plan or billing cycle.', 'غيّر خطتك أو دورة الفوترة.')}
            </p>

            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg)' }}>
              <button onClick={() => setCycle('monthly')}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold"
                style={{
                  background: cycle === 'monthly' ? 'var(--white)' : 'transparent',
                  color: cycle === 'monthly' ? 'var(--t1)' : 'var(--t3)',
                  boxShadow: cycle === 'monthly' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                }}>
                {t('Monthly', 'شهري')}
              </button>
              <button onClick={() => setCycle('yearly')}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5"
                style={{
                  background: cycle === 'yearly' ? 'var(--white)' : 'transparent',
                  color: cycle === 'yearly' ? 'var(--t1)' : 'var(--t3)',
                  boxShadow: cycle === 'yearly' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                }}>
                {t('Yearly', 'سنوي')}
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: 'var(--o2)', color: 'var(--orange)' }}>
                  −2 {t('mo', 'شهر')}
                </span>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-5">
              {PLANS.map((p) => {
                const active = newPlan === p.id
                const current = currentPlan === p.id
                const price = cycle === 'monthly' ? p.price : Math.round(p.yearly / 12)
                return (
                  <button key={p.id} onClick={() => setNewPlan(p.id)}
                    className="text-left p-4 rounded-2xl border transition-all"
                    style={{
                      background: active ? 'var(--p2)' : 'var(--bg)',
                      borderColor: active ? 'var(--p)' : 'var(--bd)',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-bold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{p.label}</p>
                      {current && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                              style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                          {t('Current', 'الحالية')}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-[20px] font-bold" style={{ color: 'var(--t1)' }}>${price}</span>
                      <span className="text-[11px]" style={{ color: 'var(--t3)' }}>/{t('mo', 'شهر')}</span>
                    </div>
                    <ul className="space-y-1">
                      {p.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--t2)' }}>
                          <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--p)' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between">
              <button className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                {t('Cancel subscription', 'إلغاء الاشتراك')}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowManage(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
                  {t('CANCEL', 'إلغاء')}
                </button>
                <button disabled={newPlan === currentPlan && cycle === 'monthly'}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background: 'var(--p)' }}>
                  {t('Confirm', 'تأكيد')} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px]" style={{ color: 'var(--t3)' }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{value}</span>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--t2)' }}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 relative max-h-[92vh] overflow-y-auto"
           style={{ background: 'var(--white)', animation: 'popIn .25s ease' }}
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center z-10"
          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
          <X size={14} />
        </button>
        {children}
      </div>
      <style jsx>{`
        @keyframes popIn {
          0%   { transform: scale(.9); opacity: 0 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
