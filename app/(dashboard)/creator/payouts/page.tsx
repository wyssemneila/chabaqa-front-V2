'use client'

import { useEffect, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Wallet, HelpCircle, Plus, Settings, ChevronDown,
  ArrowRight, X, CalendarClock, Sparkles, Landmark,
} from 'lucide-react'

// Simple country list (add more as needed)
const COUNTRIES = [
  { code: 'TN', name: 'Tunisia',        flag: '🇹🇳' },
  { code: 'FR', name: 'France',         flag: '🇫🇷' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { code: 'ES', name: 'Spain',          flag: '🇪🇸' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',   flag: '🇸🇦' },
  { code: 'MA', name: 'Morocco',        flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria',        flag: '🇩🇿' },
  { code: 'EG', name: 'Egypt',          flag: '🇪🇬' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
]

const OWNER = {
  name: 'Wyssem Neila',
  email: 'clashwissem49@gmail.com',
  avatar: '', // fallback to initials
}

export default function PayoutsPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [showInfo, setShowInfo] = useState(false)
  const [showAdd,  setShowAdd]  = useState(false)
  const [country,  setCountry]  = useState<string>('')
  const [openCountry, setOpenCountry] = useState(false)

  // Placeholder values — will be wired to Stripe later
  const balanceAvailable = 0
  const balancePending = 200
  const currency = 'TND'
  const nextPayoutInDays = 5
  const nextPayoutDate = new Date(Date.now() + nextPayoutInDays * 86400 * 1000)
    .toLocaleDateString(isAr ? 'ar' : 'en-GB', { day: 'numeric', month: 'long' })

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto pb-24">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              {t('Payouts', 'المدفوعات')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {t('Track your balance and get paid.', 'تابع رصيدك واستلم مدفوعاتك.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Balance card — main */}
            <div className="md:col-span-2 rounded-2xl p-6 border relative overflow-hidden"
                 style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full blur-3xl opacity-30"
                   style={{ background: 'var(--p)' }} />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    <Wallet size={16} />
                  </div>
                  <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
                    {t('Current balance', 'الرصيد الحالي')}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mt-4 mb-3">
                  <span className="text-[36px] font-bold leading-none" style={{ color: 'var(--t1)' }}>
                    {balanceAvailable.toFixed(2)}
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--t3)' }}>
                    {currency}
                  </span>
                </div>

                {/* Pending row */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
                    {balancePending.toFixed(2)} {currency} {t('pending', 'قيد الانتظار')}
                  </span>
                  <button onClick={() => setShowInfo(true)}
                          className="w-4 h-4 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                    <HelpCircle size={11} />
                  </button>
                </div>

                {/* Next payout badge */}
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                     style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  <CalendarClock size={13} />
                  <span className="text-[12px] font-semibold">
                    {t(`Next payout in ${nextPayoutInDays} days`, `المدفوعة القادمة خلال ${nextPayoutInDays} أيام`)} · {nextPayoutDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank / payout method card */}
            <div className="rounded-2xl p-5 border flex flex-col"
                 style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: 'var(--c2)', color: 'var(--cyan)' }}>
                    <Landmark size={15} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                    {t('Payout account', 'حساب الاستلام')}
                  </p>
                </div>
                <button title={t('Manage', 'إدارة')}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                        style={{ background: 'var(--bg)', color: 'var(--t2)' }}>
                  <Settings size={13} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                <p className="text-[12px] mb-3" style={{ color: 'var(--t3)' }}>
                  {t('No bank account yet.', 'لا يوجد حساب بنكي بعد.')}
                </p>
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: 'var(--p)' }}>
                  <Plus size={13} /> {t('Add bank account', 'إضافة حساب بنكي')}
                </button>
              </div>
            </div>
          </div>

          {/* Empty state for history */}
          <div className="mt-6 rounded-2xl p-8 border text-center"
               style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                 style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <Sparkles size={20} />
            </div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('No payouts yet', 'لا توجد مدفوعات بعد')}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
              {t('Once you start earning, your payout history will appear here.', 'بمجرد أن تبدأ في الكسب، سيظهر سجل مدفوعاتك هنا.')}
            </p>
          </div>
        </main>
      </div>

      {/* Info popup — friendly pending explainer */}
      {showInfo && (
        <Modal onClose={() => setShowInfo(false)}>
          <div className="text-center flex flex-col items-center" style={{ width: 380, minHeight: 280 }}>
            <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
                 style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <CalendarClock size={22} />
            </div>
            <h3 className="text-[17px] font-semibold mb-2" style={{ color: 'var(--t1)' }}>
              {t('How payouts work', 'كيف تعمل المدفوعات')}
            </h3>
            <p className="text-[13px] mb-4 leading-relaxed flex-1 flex items-center" style={{ color: 'var(--t2)' }}>
              {t(
                'We send your available balance every Wednesday. Pending amounts settle in 7–14 days — that\'s just how bank transfers work. Nothing to worry about!',
                'نرسل رصيدك المتاح كل يوم أربعاء. المبالغ المعلقة تتم تسويتها في 7-14 يوماً. لا تقلق!'
              )}
            </p>
            <button onClick={() => setShowInfo(false)}
              className="px-6 py-2 rounded-xl text-[13px] font-semibold text-white flex-shrink-0"
              style={{ background: 'var(--p)' }}>
              {t('Got it', 'فهمت')}
            </button>
          </div>
        </Modal>
      )}

      {/* Add bank account modal */}
      {showAdd && (
        <Modal onClose={() => { setShowAdd(false); setCountry(''); setOpenCountry(false) }}>
          <div style={{ width: 420 }}>
            <h3 className="text-[17px] font-semibold mb-4" style={{ color: 'var(--t1)' }}>
              {t('Add payout method', 'إضافة طريقة الاستلام')}
            </h3>

            <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--t2)' }}>
              {t('Payouts will go to the owner of the group', 'المدفوعات ستذهب إلى مالك المجموعة')}
            </p>
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5"
                 style={{ background: 'var(--bg)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold overflow-hidden flex-shrink-0"
                   style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                {OWNER.avatar
                  ? <img src={OWNER.avatar} alt="" className="w-full h-full object-cover" />
                  : OWNER.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{OWNER.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{OWNER.email}</p>
              </div>
            </div>

            <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--t2)' }}>
              {t('In which country is your bank account?', 'في أي بلد يوجد حسابك البنكي؟')}
            </p>

            <div className="relative mb-5">
              <button onClick={() => setOpenCountry(!openCountry)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[13px]"
                style={{
                  background: 'var(--white)',
                  borderColor: openCountry ? 'var(--p)' : 'var(--bd)',
                  color: country ? 'var(--t1)' : 'var(--t3)',
                }}>
                {country ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[16px]">{COUNTRIES.find(c => c.code === country)?.flag}</span>
                    {COUNTRIES.find(c => c.code === country)?.name}
                  </span>
                ) : t('Select country', 'اختر البلد')}
                <ChevronDown size={14} style={{ color: 'var(--t3)' }} />
              </button>

              {openCountry && (
                <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border max-h-64 overflow-y-auto shadow-lg"
                     style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
                  {COUNTRIES.map((c) => (
                    <button key={c.code}
                      onClick={() => { setCountry(c.code); setOpenCountry(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-left hover:bg-[var(--p2)]"
                      style={{ color: country === c.code ? 'var(--p)' : 'var(--t1)' }}>
                      <span className="text-[16px]">{c.flag}</span> {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowAdd(false); setCountry(''); setOpenCountry(false) }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ color: 'var(--t2)' }}>
                {t('CANCEL', 'إلغاء')}
              </button>
              <button disabled={!country}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-40"
                style={{ background: 'var(--p)' }}>
                {t('Continue', 'متابعة')} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </Modal>
      )}
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
      <div className="rounded-2xl p-6 relative"
           style={{ background: 'var(--white)', animation: 'popIn .25s ease' }}
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
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
