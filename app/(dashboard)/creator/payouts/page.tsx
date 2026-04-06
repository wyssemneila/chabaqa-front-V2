'use client'

import { useEffect, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  DollarSign, TrendingUp, Clock, CheckCircle2,
  Building2, CreditCard, Zap, Shield, Check,
  ChevronRight, AlertCircle, Pencil, X, Lock,
  ExternalLink, ArrowDownToLine,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayoutRecord {
  id: string; amount: number; status: 'paid' | 'processing' | 'pending'
  date: string; method: string; ref: string
}

type PayoutMethod = 'stripe' | 'bank' | null

interface BankInfo {
  method: PayoutMethod
  // stripe
  stripeEmail?: string
  stripeConnected?: boolean
  // bank
  bankName?: string
  accountHolder?: string
  iban?: string
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const PAYOUT_HISTORY: PayoutRecord[] = [
  { id: 'p1', amount: 1240, status: 'paid',       date: '2026-03-28', method: 'Stripe',       ref: 'po_3OxQ2Rk12' },
  { id: 'p2', amount: 870,  status: 'paid',       date: '2026-03-14', method: 'Stripe',       ref: 'po_3OxQ1Ab45' },
  { id: 'p3', amount: 540,  status: 'paid',       date: '2026-02-28', method: 'Bank Transfer', ref: 'TXN-28FEB-009' },
  { id: 'p4', amount: 620,  status: 'paid',       date: '2026-02-14', method: 'Bank Transfer', ref: 'TXN-14FEB-007' },
  { id: 'p5', amount: 390,  status: 'paid',       date: '2026-01-31', method: 'Stripe',       ref: 'po_3OxP9Zc77' },
  { id: 'p6', amount: 480,  status: 'paid',       date: '2026-01-15', method: 'Bank Transfer', ref: 'TXN-15JAN-004' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<PayoutRecord['status'], { label: string; labelAr: string; bg: string; color: string; border: string }> = {
  paid:       { label: 'Paid',       labelAr: 'مدفوع',      bg: 'rgba(74,222,128,.12)',  color: '#16a34a',       border: 'rgba(74,222,128,.3)'  },
  processing: { label: 'Processing', labelAr: 'قيد المعالجة', bg: 'rgba(251,146,60,.12)', color: 'var(--orange)', border: 'rgba(251,146,60,.3)'  },
  pending:    { label: 'Pending',    labelAr: 'معلّق',       bg: 'var(--p2)',              color: 'var(--p)',      border: 'var(--bd)'            },
}

const mask = (s: string, keep = 4) =>
  s.length <= keep ? s : '•'.repeat(Math.min(8, s.length - keep)) + s.slice(-keep)

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '1a' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[24px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Connect Form ─────────────────────────────────────────────────────────────

function ConnectForm({ current, onSave, onCancel, lang }: {
  current: BankInfo
  onSave: (info: BankInfo) => void
  onCancel: () => void
  lang: string
}) {
  const [method,         setMethod]         = useState<'stripe' | 'bank'>(current.method === 'bank' ? 'bank' : 'stripe')
  const [stripeEmail,    setStripeEmail]    = useState(current.stripeEmail    ?? '')
  const [bankName,       setBankName]       = useState(current.bankName       ?? '')
  const [accountHolder,  setAccountHolder]  = useState(current.accountHolder  ?? '')
  const [iban,           setIban]           = useState(current.iban            ?? '')
  const [saving,         setSaving]         = useState(false)

  const canSave = method === 'stripe'
    ? stripeEmail.trim().includes('@')
    : bankName.trim() && accountHolder.trim() && iban.trim().length >= 15

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    onSave(method === 'stripe'
      ? { method: 'stripe', stripeEmail, stripeConnected: true }
      : { method: 'bank',   bankName, accountHolder, iban }
    )
    setSaving(false)
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
  const fs  = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }
  const fo  = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--p)'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--bd)'),
  }
  const LBL = ({ text, req }: { text: string; req?: boolean }) => (
    <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
      {text}{req && <span style={{ color: 'var(--p)' }}> *</span>}
    </p>
  )

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div>
          <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'ربط طريقة الدفع' : 'Connect Payout Method'}</p>
          <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'اختر كيف تريد استلام أرباحك' : 'Choose how you want to receive your earnings'}</p>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Method selector */}
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              id: 'stripe' as const,
              title: 'Stripe',
              desc: lang === 'ar' ? 'دفعات فورية إلى بنكك عبر Stripe Connect' : 'Instant payouts to your bank via Stripe Connect',
              icon: <Zap className="w-5 h-5" strokeWidth={1.7} />,
              color: '#635bff',
              badge: lang === 'ar' ? 'موصى به' : 'Recommended',
            },
            {
              id: 'bank' as const,
              title: lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
              desc: lang === 'ar' ? 'تحويل مباشر — 2-5 أيام عمل' : 'Direct wire transfer — 2-5 business days',
              icon: <Building2 className="w-5 h-5" strokeWidth={1.7} />,
              color: 'var(--cyan)',
              badge: null,
            },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => setMethod(opt.id)}
              className="flex flex-col gap-2 p-4 rounded-2xl cursor-pointer transition-all text-left"
              style={method === opt.id
                ? { background: opt.color + '12', border: `2px solid ${opt.color}` }
                : { background: 'var(--bg)', border: '2px solid var(--bd)' }}>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: method === opt.id ? opt.color + '20' : 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div style={{ color: method === opt.id ? opt.color : 'var(--t3)' }}>{opt.icon}</div>
                </div>
                {opt.badge && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: opt.color + '20', color: opt.color }}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[13px] font-bold" style={{ color: method === opt.id ? 'var(--t1)' : 'var(--t2)' }}>{opt.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{opt.desc}</p>
              </div>
              {method === opt.id && (
                <Check className="w-4 h-4 self-end" style={{ color: opt.color }} strokeWidth={1.7} />
              )}
            </button>
          ))}
        </div>

        {/* Fields */}
        {method === 'stripe' ? (
          <div>
            <LBL text={lang === 'ar' ? 'بريد حساب Stripe' : 'Stripe Account Email'} req />
            <input type="email" value={stripeEmail} onChange={e => setStripeEmail(e.target.value)}
              placeholder="your@stripe.com" className={inp} style={fs} {...fo} />
            <div className="flex items-center gap-2 mt-2.5 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(99,91,255,.06)', border: '1px solid rgba(99,91,255,.2)' }}>
              <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#635bff' }} strokeWidth={1.7} />
              <p className="text-[11px]" style={{ color: '#635bff' }}>
                {lang === 'ar' ? 'سيتم توجيهك إلى Stripe لإتمام الربط بشكل آمن.' : 'You will be redirected to Stripe to authorize the connection securely.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <LBL text={lang === 'ar' ? 'اسم البنك' : 'Bank Name'} req />
              <input value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثل: بنك تونس' : 'e.g. Banque de Tunisie'}
                className={inp} style={fs} {...fo} />
            </div>
            <div>
              <LBL text={lang === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name'} req />
              <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                placeholder={lang === 'ar' ? 'الاسم القانوني الكامل' : 'Full legal name'}
                className={inp} style={fs} {...fo} />
            </div>
            <div>
              <LBL text="IBAN" req />
              <input value={iban} onChange={e => setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="TN59 1234 5678 9012 3456 7891 23" className={inp}
                style={{ ...fs, fontFamily: 'monospace', letterSpacing: '0.05em' }} {...fo} />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>
              <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
              <p className="text-[11px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'تفاصيل البنك مشفرة ومحمية.' : 'Bank details are encrypted and stored securely.'}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80"
            style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={!canSave || saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: method === 'stripe' ? '#635bff' : 'var(--p)' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : method === 'stripe'
                ? <><Zap className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'ربط مع Stripe' : 'Connect with Stripe'}</>
                : <><Check className="w-4 h-4" strokeWidth={1.7} /> {lang === 'ar' ? 'حفظ بيانات البنك' : 'Save Bank Details'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Connected Display ────────────────────────────────────────────────────────

function ConnectedCard({ info, onEdit, lang }: { info: BankInfo; onEdit: () => void; lang: string }) {
  const isStripe = info.method === 'stripe'
  const color    = isStripe ? '#635bff' : 'var(--cyan)'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
        <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'طريقة الدفع' : 'Payout Method'}</p>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-80"
          style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
          <Pencil className="w-3 h-3" strokeWidth={1.7} /> {lang === 'ar' ? 'تعديل' : 'Edit'}
        </button>
      </div>

      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: color + '15', border: `1.5px solid ${color}40` }}>
          {isStripe
            ? <Zap      className="w-6 h-6" style={{ color }} strokeWidth={1.7} />
            : <Building2 className="w-6 h-6" style={{ color }} strokeWidth={1.7} />
          }
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>
              {isStripe ? 'Stripe Connect' : info.bankName}
            </p>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,.12)', color: '#16a34a' }}>
              <Check className="w-2.5 h-2.5" strokeWidth={3} /> {lang === 'ar' ? 'مرتبط' : 'Connected'}
            </span>
          </div>
          {isStripe
            ? <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{info.stripeEmail}</p>
            : <div>
                <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{info.accountHolder}</p>
                <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--t3)' }}>
                  {mask(info.iban ?? '', 6)}
                </p>
              </div>
          }
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'جدول الدفع' : 'Payout schedule'}</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--t1)' }}>
            {isStripe
              ? (lang === 'ar' ? 'كل 7 أيام' : 'Every 7 days')
              : (lang === 'ar' ? 'كل 15 يومًا' : 'Every 15 days')}
          </p>
        </div>
      </div>

      {/* features row */}
      <div className="px-5 pb-5 grid grid-cols-3 gap-3">
        {(isStripe
          ? [
              { icon: <Zap className="w-3.5 h-3.5" />,        label: lang === 'ar' ? 'تحويل فوري'       : 'Instant Transfer',    sub: lang === 'ar' ? 'في دقائق'        : 'in minutes'      },
              { icon: <Shield className="w-3.5 h-3.5" />,     label: lang === 'ar' ? 'حماية Stripe'     : 'Stripe Protected',    sub: lang === 'ar' ? 'مشفر بالكامل'   : 'fully encrypted' },
              { icon: <CreditCard className="w-3.5 h-3.5" />, label: lang === 'ar' ? 'جميع العملات'     : 'All currencies',      sub: lang === 'ar' ? 'تحويل تلقائي'   : 'auto-converted'  },
            ]
          : [
              { icon: <Building2 className="w-3.5 h-3.5" />, label: lang === 'ar' ? 'تحويل بنكي'       : 'Wire Transfer',       sub: lang === 'ar' ? '2–5 أيام عمل'   : '2–5 business days' },
              { icon: <Shield className="w-3.5 h-3.5" />,    label: lang === 'ar' ? 'أمان بنكي'        : 'Bank-grade Security', sub: lang === 'ar' ? 'IBAN مشفر'       : 'encrypted IBAN'    },
              { icon: <Clock className="w-3.5 h-3.5" />,     label: lang === 'ar' ? 'دفع تلقائي'       : 'Auto Payouts',        sub: lang === 'ar' ? 'نصف شهري'       : 'bi-monthly'        },
            ]
        ).map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <div style={{ color }}>{f.icon}</div>
            <div>
              <p className="text-[11px] font-semibold" style={{ color: 'var(--t1)' }}>{f.label}</p>
              <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const { lang } = useDashPrefs()
  const [bankInfo,  setBankInfo]  = useState<BankInfo>({ method: null })
  const [editing,   setEditing]   = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chabaqa_payout_method')
      if (saved) setBankInfo(JSON.parse(saved))
      else setEditing(true) // open form on first visit
    } catch {}
  }, [])

  const save = (info: BankInfo) => {
    setBankInfo(info)
    localStorage.setItem('chabaqa_payout_method', JSON.stringify(info))
    setEditing(false)
  }

  const totalAllTime  = PAYOUT_HISTORY.reduce((a, p) => a + p.amount, 0)
  const totalPaid     = PAYOUT_HISTORY.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0)
  const available     = 734   // mock available balance
  const pending       = 0

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar
            title={lang === 'ar' ? 'المدفوعات' : 'Payouts'}
            subtitle={lang === 'ar' ? 'نظرة عامة على الإيرادات وإدارة المدفوعات' : 'Revenue overview and payout management'}
          />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<TrendingUp      className="w-5 h-5" />} label={lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}  value={`${(totalAllTime + available + 26836).toLocaleString()} TND`} sub={lang === 'ar' ? 'منذ البداية'          : 'all time'}                                                                               color="var(--p)"      />
              <KpiCard icon={<ArrowDownToLine className="w-5 h-5" />} label={lang === 'ar' ? 'متاح للسحب'      : 'Available'}       value={`${available} TND`}                                           sub={lang === 'ar' ? 'جاهز للسحب'           : 'ready to withdraw'}                                                                        color="#16a34a"       />
              <KpiCard icon={<Clock          className="w-5 h-5" />}  label={lang === 'ar' ? 'قيد المعالجة'    : 'Pending'}         value={`${pending} TND`}                                             sub={lang === 'ar' ? 'قيد المعالجة'          : 'being processed'}                                                                          color="var(--orange)" />
              <KpiCard icon={<CheckCircle2   className="w-5 h-5" />}  label={lang === 'ar' ? 'إجمالي المدفوع'  : 'Total Paid Out'}  value={`${totalPaid.toLocaleString()} TND`}                          sub={`${PAYOUT_HISTORY.filter(p=>p.status==='paid').length} ${lang === 'ar' ? 'دفعة' : 'payouts'}`}                                            color="var(--cyan)"   />
            </div>

            {/* Available balance banner */}
            {available > 0 && bankInfo.method && !editing && (
              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-6"
                style={{ background: 'rgba(74,222,128,.08)', border: '1.5px solid rgba(74,222,128,.25)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(74,222,128,.15)' }}>
                  <DollarSign className="w-5 h-5" style={{ color: '#16a34a' }} strokeWidth={1.7} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold" style={{ color: '#16a34a' }}>
                    {available} TND {lang === 'ar' ? 'متاح للسحب' : 'available for withdrawal'}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>
                    {lang === 'ar' ? 'الدفعة التلقائية القادمة في 14 أبريل 2026 ·' : 'Next automatic payout on April 14, 2026 ·'} {bankInfo.method === 'stripe' ? 'Stripe' : bankInfo.bankName}
                  </p>
                </div>
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white cursor-pointer hover:opacity-90"
                  style={{ background: '#16a34a' }}>
                  <ArrowDownToLine className="w-3.5 h-3.5" strokeWidth={1.7} /> {lang === 'ar' ? 'طلب الآن' : 'Request Now'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-5">
              {/* left: payout method */}
              <div className="col-span-2 space-y-5">
                {editing || !bankInfo.method ? (
                  <ConnectForm current={bankInfo} onSave={save} onCancel={() => { if (bankInfo.method) setEditing(false) }} lang={lang} />
                ) : (
                  <ConnectedCard info={bankInfo} onEdit={() => setEditing(true)} lang={lang} />
                )}

                {/* no method notice */}
                {!bankInfo.method && !editing && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(251,146,60,.08)', border: '1px solid rgba(251,146,60,.25)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} strokeWidth={1.7} />
                    <p className="text-[12px]" style={{ color: 'var(--orange)' }}>
                      {lang === 'ar' ? 'قم بربط طريقة دفع لبدء استلام أرباحك.' : 'Connect a payout method to start receiving your earnings.'}
                    </p>
                  </div>
                )}
              </div>

              {/* right: payout history */}
              <div className="col-span-3">
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'سجل المدفوعات' : 'Payout History'}</p>
                      <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{PAYOUT_HISTORY.length} {lang === 'ar' ? 'دفعة' : 'payouts'}</p>
                    </div>
                    <p className="text-[13px] font-bold" style={{ color: '#16a34a' }}>
                      {totalPaid.toLocaleString()} TND {lang === 'ar' ? 'مدفوع' : 'paid'}
                    </p>
                  </div>

                  {/* table header */}
                  <div className="grid px-5 py-2.5"
                    style={{ gridTemplateColumns: '1fr 90px 80px 90px 120px', borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
                    {([
                      lang === 'ar' ? 'المرجع'  : 'Reference',
                      lang === 'ar' ? 'المبلغ'  : 'Amount',
                      lang === 'ar' ? 'الحالة'  : 'Status',
                      lang === 'ar' ? 'الوسيلة' : 'Method',
                      lang === 'ar' ? 'التاريخ' : 'Date',
                    ] as string[]).map(h => (
                      <p key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{h}</p>
                    ))}
                  </div>

                  {PAYOUT_HISTORY.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p2)' }}>
                        <DollarSign className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                      </div>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'لا توجد مدفوعات بعد' : 'No payouts yet'}</p>
                      <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'ستظهر سجلات المدفوعات هنا' : 'Your payout history will appear here'}</p>
                    </div>
                  ) : PAYOUT_HISTORY.map((p, i) => {
                    const st = STATUS_META[p.status]
                    return (
                      <div key={p.id}
                        className="grid items-center px-5 py-3.5 transition-colors cursor-pointer"
                        style={{ gridTemplateColumns: '1fr 90px 80px 90px 120px', borderBottom: i < PAYOUT_HISTORY.length - 1 ? '1px solid var(--bd)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <p className="text-[12px] font-mono" style={{ color: 'var(--t3)' }}>{p.ref}</p>
                        <p className="text-[13px] font-bold" style={{ color: '#16a34a' }}>{p.amount.toLocaleString()} TND</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit"
                          style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                          {lang === 'ar' ? st.labelAr : st.label}
                        </span>
                        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{p.method}</p>
                        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{p.date}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="h-6" />
          </main>
        </div>
      </div>
    </>
  )
}
