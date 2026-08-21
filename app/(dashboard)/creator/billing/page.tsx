'use client'

import { useEffect, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  CreditCard, Sparkles, Calendar, CheckCircle2, ArrowRight, X,
  Download, Zap, AlertCircle, Gift, RefreshCw,
} from 'lucide-react'

type Plan = 'starter' | 'pro' | 'business'
type Cycle = 'monthly' | 'yearly'

const PLANS: { id: Plan; label: string; price: number; yearly: number; features: string[] }[] = [
  {
    id: 'starter', label: 'Starter', price: 29, yearly: 290,
    features: ['1 community', 'Up to 100 members', 'Basic analytics', 'Email support'],
  },
  {
    id: 'pro', label: 'Pro', price: 79, yearly: 790,
    features: ['3 communities', 'Unlimited members', 'Advanced analytics', 'Priority support', 'Custom domain'],
  },
  {
    id: 'business', label: 'Business', price: 199, yearly: 1990,
    features: ['Unlimited communities', 'White-label', 'Team seats', 'Dedicated success manager', 'API access'],
  },
]

const INVOICES = [
  { id: 'INV-2026-0812', date: 'Aug 12, 2026', amount: 79, status: 'paid'    as const, plan: 'Pro (Monthly)' },
  { id: 'INV-2026-0712', date: 'Jul 12, 2026', amount: 79, status: 'paid'    as const, plan: 'Pro (Monthly)' },
  { id: 'INV-2026-0612', date: 'Jun 12, 2026', amount: 79, status: 'paid'    as const, plan: 'Pro (Monthly)' },
]

export default function BillingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  // Simulated state (wire to Stripe later)
  const [currentPlan]  = useState<Plan>('pro')
  const [cycle,   setCycle]   = useState<Cycle>('monthly')
  const [trialEnd] = useState<string>('September 4, 2026')
  const [card]     = useState({ brand: 'VISA', last4: '8240', exp: '08/28' })

  const [showUpdateCard, setShowUpdateCard] = useState(false)
  const [showManage,     setShowManage]     = useState(false)
  const [newPlan,        setNewPlan]        = useState<Plan>(currentPlan)

  const plan = PLANS.find(p => p.id === currentPlan)!

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto pb-24">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              {t('Billing', 'الفوترة')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {t('Manage your subscription and payment method.', 'أدر اشتراكك وطريقة الدفع.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Current plan card */}
            <div className="md:col-span-2 rounded-2xl p-6 border relative overflow-hidden"
                 style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full blur-3xl opacity-30"
                   style={{ background: 'var(--p)' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    {t('Current plan', 'الخطة الحالية')}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-3 mb-2">
                  <span className="text-[28px] font-bold leading-none" style={{ color: 'var(--t1)' }}>
                    {plan.label}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--t3)' }}>
                    · ${plan.price}/{t('mo', 'شهر')}
                  </span>
                </div>

                {/* Trial indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                     style={{ background: 'var(--o2)', color: 'var(--orange)' }}>
                  <Gift size={13} />
                  <span className="text-[12px] font-semibold">
                    {t(`14-day free trial ends on ${trialEnd}`, `تجربة 14 يومًا تنتهي في ${trialEnd}`)}
                  </span>
                </div>

                <div className="mt-5 flex gap-2 flex-wrap">
                  <button onClick={() => setShowManage(true)}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5"
                    style={{ background: 'var(--p)' }}>
                    {t('Manage subscription', 'إدارة الاشتراك')} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Payment method card */}
            <div className="rounded-2xl p-5 border flex flex-col"
                 style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'var(--c2)', color: 'var(--cyan)' }}>
                  <CreditCard size={15} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                  {t('Payment method', 'طريقة الدفع')}
                </p>
              </div>

              {/* Fake card visual */}
              <div className="rounded-xl p-4 mb-3 relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #1a1730 0%, #3d3570 100%)' }}>
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20"
                     style={{ background: '#fff' }} />
                <p className="text-white text-[11px] uppercase tracking-wider opacity-70">{card.brand}</p>
                <p className="text-white text-[15px] font-mono mt-3 tracking-wider">
                  •••• •••• •••• {card.last4}
                </p>
                <p className="text-white text-[10px] mt-2 opacity-80">
                  {t('Exp', 'انتهاء')} {card.exp}
                </p>
              </div>

              <button onClick={() => setShowUpdateCard(true)}
                className="w-full px-3 py-2 rounded-xl text-[12px] font-semibold border flex items-center justify-center gap-1.5"
                style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>
                <RefreshCw size={12} /> {t('Update payment method', 'تحديث طريقة الدفع')}
              </button>
            </div>
          </div>

          {/* Promo card — save with annual */}
          <button onClick={() => { setCycle('yearly'); setShowManage(true) }}
            className="mt-4 w-full rounded-2xl p-4 border flex items-center gap-3 text-left transition-colors hover:border-[var(--orange)]"
            style={{ background: 'var(--o2)', borderColor: 'var(--o2)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--orange)', color: '#fff' }}>
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>
                {t('Get 2 months free with yearly billing', 'احصل على شهرين مجانًا مع الفوترة السنوية')}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--t2)' }}>
                {t(`Switch to yearly and save $${plan.price * 2}/year on your ${plan.label} plan.`, `بدّل إلى السنوي ووفّر $${plan.price * 2}/سنة.`)}
              </p>
            </div>
            <span className="text-[12px] font-semibold flex items-center gap-1"
                  style={{ color: 'var(--orange)' }}>
              {t('Switch', 'بدّل')} <ArrowRight size={12} />
            </span>
          </button>

          {/* Invoice history */}
          <div className="mt-6 rounded-2xl border overflow-hidden"
               style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b"
                 style={{ borderColor: 'var(--bd)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                {t('Invoice history', 'سجل الفواتير')}
              </p>
              <button className="text-[12px] font-medium" style={{ color: 'var(--p)' }}>
                {t('View all', 'عرض الكل')}
              </button>
            </div>
            {INVOICES.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[13px]" style={{ color: 'var(--t3)' }}>{t('No invoices yet.', 'لا توجد فواتير بعد.')}</p>
              </div>
            ) : (
              <div>
                {INVOICES.map((inv, i) => (
                  <div key={inv.id}
                       className="px-5 py-3 flex items-center gap-4"
                       style={{ borderTop: i > 0 ? '1px solid var(--bd)' : 'none' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                        {inv.plan}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
                        {inv.date} · {inv.id}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                      ${inv.amount.toFixed(2)}
                    </p>
                    <button title={t('Download invoice', 'تنزيل الفاتورة')}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg)', color: 'var(--t2)' }}>
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Update payment method modal */}
      {showUpdateCard && (
        <Modal onClose={() => setShowUpdateCard(false)}>
          <div style={{ width: 420 }}>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('Update payment method', 'تحديث طريقة الدفع')}
            </h3>
            <p className="text-[12px] mb-5" style={{ color: 'var(--t3)' }}>
              {t('Your card will be replaced. All future charges use the new method.', 'ستُستبدل بطاقتك. جميع الرسوم المستقبلية ستستخدم الطريقة الجديدة.')}
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

            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg"
                 style={{ background: 'var(--bg)' }}>
              <Zap size={12} style={{ color: 'var(--p)' }} />
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
                {t('Payments secured by Stripe. We never store your card details.', 'المدفوعات آمنة عبر Stripe. لا نخزّن تفاصيل بطاقتك.')}
              </p>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowUpdateCard(false)}
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

      {/* Manage subscription modal */}
      {showManage && (
        <Modal onClose={() => setShowManage(false)}>
          <div style={{ width: 620 }}>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('Manage your subscription', 'أدر اشتراكك')}
            </h3>
            <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
              {t('Change your plan or billing cycle. Prorated automatically.', 'غيّر خطتك أو دورة الفوترة. يتم التقسيم تلقائيًا.')}
            </p>

            {/* Cycle switch */}
            <div className="flex gap-1 p-1 rounded-xl mb-4"
                 style={{ background: 'var(--bg)' }}>
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

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-3 mb-5">
              {PLANS.map((p) => {
                const active   = newPlan === p.id
                const current  = currentPlan === p.id
                const price    = cycle === 'monthly' ? p.price : Math.round(p.yearly / 12)
                return (
                  <button key={p.id} onClick={() => setNewPlan(p.id)}
                    className="text-left p-4 rounded-2xl border transition-all"
                    style={{
                      background: active ? 'var(--p2)' : 'var(--bg)',
                      borderColor: active ? 'var(--p)' : 'var(--bd)',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-bold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>
                        {p.label}
                      </p>
                      {current && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                              style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                          {t('Current', 'الحالية')}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-[20px] font-bold" style={{ color: 'var(--t1)' }}>${price}</span>
                      <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
                        /{t('mo', 'شهر')}{cycle === 'yearly' && `, ${t('billed yearly', 'فوترة سنوية')}`}
                      </span>
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

            <div className="flex items-center justify-between p-3 rounded-xl mb-4"
                 style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={13} style={{ color: 'var(--orange)' }} />
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
                  {t('Cancel anytime. No hidden fees.', 'ألغِ في أي وقت. لا رسوم خفية.')}
                </p>
              </div>
              <button className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                {t('Cancel subscription', 'إلغاء الاشتراك')}
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowManage(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
                {t('CANCEL', 'إلغاء')}
              </button>
              <button disabled={newPlan === currentPlan && cycle === 'monthly'}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: 'var(--p)' }}>
                {t('Confirm change', 'تأكيد التغيير')} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </Modal>
      )}
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
