'use client'

import { useEffect, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import Link from 'next/link'
import {
  UserPlus, Settings, Palette, DollarSign, Layout, Shield, Bell,
  Copy, Check, Upload, Trash2, Plus, X, Edit3, ExternalLink, Mail,
  FileUp, Zap, Globe, Lock, Unlock, ArrowRight,
} from 'lucide-react'

type TabId = 'invitation' | 'general' | 'branding' | 'pricing' | 'tabs' | 'rules' | 'notifications'
type PricingModel = 'free' | 'subscription' | 'freemium' | 'one-time'
type BillingCycle = 'monthly' | 'yearly' | 'both'

const TABS: { id: TabId; label: { en: string; ar: string }; icon: any }[] = [
  { id: 'invitation',    label: { en: 'Invitation',    ar: 'الدعوة'      }, icon: UserPlus  },
  { id: 'general',       label: { en: 'General',       ar: 'عام'         }, icon: Settings  },
  { id: 'branding',      label: { en: 'Branding',      ar: 'الهوية'      }, icon: Palette   },
  { id: 'pricing',       label: { en: 'Pricing',       ar: 'التسعير'     }, icon: DollarSign },
  { id: 'tabs',          label: { en: 'Tabs & Layout', ar: 'التبويبات'   }, icon: Layout    },
  { id: 'rules',         label: { en: 'Rules',         ar: 'القواعد'     }, icon: Shield    },
  { id: 'notifications', label: { en: 'Notifications', ar: 'الإشعارات'   }, icon: Bell      },
]

// Community slug for persistence key
const COMMUNITY_KEY = 'motion-masters'
const TAB_VIS_KEY = `community-tabs:${COMMUNITY_KEY}`

export default function CommunitySettingsPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [tab, setTab] = useState<TabId>('invitation')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto pb-24">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              {t('Community Settings', 'إعدادات المجتمع')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {t('Configure how your community looks, feels and works.', 'اضبط شكل مجتمعك وطريقة عمله.')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b overflow-x-auto"
               style={{ borderColor: 'var(--bd)' }}>
            {TABS.map((T) => {
              const active = tab === T.id
              const Icon = T.icon
              return (
                <button key={T.id} onClick={() => setTab(T.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap relative"
                  style={{ color: active ? 'var(--p)' : 'var(--t2)' }}>
                  <Icon size={15} />
                  {T.label[lang]}
                  {active && (
                    <span className="absolute left-2 right-2 bottom-[-1px] h-[2px] rounded-full"
                          style={{ background: 'var(--p)' }} />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            {tab === 'invitation'    && <InvitationSection t={t} />}
            {tab === 'general'       && <GeneralSection t={t} />}
            {tab === 'branding'      && <BrandingSection t={t} />}
            {tab === 'pricing'       && <PricingSection t={t} />}
            {tab === 'tabs'          && <TabsLayoutSection t={t} />}
            {tab === 'rules'         && <RulesSection t={t} />}
            {tab === 'notifications' && <NotificationsSection t={t} />}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── INVITATION ────────────────────────────────────────────── */

function InvitationSection({ t }: { t: (en: string, ar: string) => string }) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const shareLink = `https://chabaqa.io/${COMMUNITY_KEY}/about`

  const copy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <div>
        <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
          {t('Share your community link', 'شارك رابط مجتمعك')}
        </h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--t3)' }}>
          {t('People land on your About page where they can join or purchase access.', 'يصل الأشخاص إلى صفحة عن المجتمع حيث يمكنهم الانضمام أو الشراء.')}
        </p>
        <div className="flex gap-2">
          <input readOnly value={shareLink}
            className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-medium border"
            style={{ background: 'var(--bg)', color: 'var(--p)', borderColor: 'var(--bd)' }} />
          <button onClick={copy}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--p)' }}>
            {copied ? t('COPIED', 'تم النسخ') : t('COPY', 'نسخ')}
          </button>
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-[13px] mb-4" style={{ color: 'var(--t3)' }}>
          {t('These invitation methods grant instant access without purchase or approval.', 'هذه الطرق تمنح وصولاً فورياً دون شراء أو موافقة.')}
        </p>

        <div className="flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t('Email address', 'البريد الإلكتروني')}
            className="flex-1 px-3 py-2.5 rounded-xl text-[13px] border"
            style={{ background: 'var(--bg)', color: 'var(--t1)', borderColor: 'var(--bd)' }} />
          <button
            disabled={!email}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--p)' }}>
            {t('SEND', 'إرسال')}
          </button>
        </div>
      </div>

      <IconRow icon={FileUp}
        title={t('Import a .CSV file', 'استيراد ملف CSV')}
        hint={t('Invite members in bulk by importing an email list.', 'ادعُ الأعضاء دفعة واحدة عبر ملف البريد.')}
        cta={t('IMPORT', 'استيراد')} />

      <IconRow icon={Zap}
        title={t('Zapier Integration', 'تكامل Zapier')}
        hint={t('Invite members by connecting Chabaqa to 500+ tools via Zapier.', 'ادعُ الأعضاء عبر ربط Chabaqa بأكثر من 500 أداة.')}
        cta={t('INTEGRATE', 'ربط')} />
    </Card>
  )
}

function IconRow({ icon: Icon, title, hint, cta }: { icon: any; title: string; hint: string; cta: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: 'var(--p2)', color: 'var(--p)' }}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</p>
        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{hint}</p>
      </div>
      <button className="px-4 py-2 rounded-xl text-[12px] font-semibold border"
              style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>
        {cta}
      </button>
    </div>
  )
}

/* ─── GENERAL ────────────────────────────────────────────── */

function GeneralSection({ t }: { t: (en: string, ar: string) => string }) {
  const [name, setName] = useState('Motion Masters')
  const [description, setDescription] = useState('A creative community for motion designers.')
  const [slug, setSlug] = useState('motion-masters')
  const [editingSlug, setEditingSlug] = useState(false)
  const [customDomain, setCustomDomain] = useState('')
  const [showDomain, setShowDomain] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <Card>
      <Field label={t('Community Name', 'اسم المجتمع')}>
        <Input value={name} onChange={setName} />
      </Field>

      <Field label={t('Description', 'الوصف')}>
        <Textarea value={description} onChange={setDescription} rows={3} />
      </Field>

      <Field label={t('URL Slug', 'الرابط المخصص')}>
        {editingSlug ? (
          <div className="flex gap-2">
            <div className="flex items-center rounded-xl border overflow-hidden flex-1"
                 style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>chabaqa.io/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                className="flex-1 px-2 py-2.5 text-[13px] bg-transparent outline-none"
                style={{ color: 'var(--t1)' }} autoFocus />
            </div>
            <button onClick={() => setEditingSlug(false)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'var(--p)' }}>
              {t('Done', 'تم')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl text-[13px] border"
                 style={{ background: 'var(--bg)', color: 'var(--t2)', borderColor: 'var(--bd)' }}>
              chabaqa.io/<span className="font-semibold" style={{ color: 'var(--t1)' }}>{slug}</span>
            </div>
            <button onClick={() => setEditingSlug(true)}
              className="px-3 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5"
              style={{ background: 'var(--p2)', color: 'var(--p)' }}>
              <Edit3 size={13} /> {t('Edit', 'تعديل')}
            </button>
          </div>
        )}
      </Field>

      {!showDomain ? (
        <button onClick={() => setShowDomain(true)}
          className="flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: 'var(--p)' }}>
          <Plus size={13} /> {t('Add custom domain', 'إضافة نطاق مخصص')}
        </button>
      ) : (
        <Field label={t('Custom Domain', 'نطاق مخصص')}
               hint={t('Point your domain via CNAME to cname.chabaqa.io', 'وجّه نطاقك عبر CNAME إلى cname.chabaqa.io')}>
          <div className="flex gap-2">
            <div className="flex items-center rounded-xl border overflow-hidden flex-1"
                 style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <Globe size={14} className="ml-3" style={{ color: 'var(--t3)' }} />
              <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="community.yourdomain.com"
                className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none"
                style={{ color: 'var(--t1)' }} />
            </div>
            <button onClick={() => { setShowDomain(false); setCustomDomain('') }}
              className="px-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X size={14} />
            </button>
          </div>
        </Field>
      )}

      <Divider />

      <div>
        <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--t1)' }}>
          {t('Community Visibility', 'ظهور المجتمع')}
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <VisibilityCard icon={Unlock}
            title={t('Public', 'عام')}
            hint={t('Anyone can discover and join.', 'يستطيع أي شخص العثور والانضمام.')}
            active={visibility === 'public'}
            onClick={() => setVisibility('public')} />
          <VisibilityCard icon={Lock}
            title={t('Private', 'خاص')}
            hint={t('People need approval to join.', 'يحتاج الأشخاص إلى موافقة للانضمام.')}
            active={visibility === 'private'}
            onClick={() => setVisibility('private')} />
        </div>
      </div>

      <SaveBar onSave={save} saved={saved} t={t} />
    </Card>
  )
}

function VisibilityCard({ icon: Icon, title, hint, active, onClick }:
  { icon: any; title: string; hint: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-left p-4 rounded-2xl border transition-all"
      style={{
        background: active ? 'var(--p2)' : 'var(--bg)',
        borderColor: active ? 'var(--p)' : 'var(--bd)',
      }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
             style={{ borderColor: active ? 'var(--p)' : 'var(--bd2, var(--bd))' }}>
          {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--p)' }} />}
        </div>
        <Icon size={15} style={{ color: active ? 'var(--p)' : 'var(--t2)' }} />
        <p className="text-[14px] font-semibold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{title}</p>
      </div>
      <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{hint}</p>
    </button>
  )
}

/* ─── BRANDING ────────────────────────────────────────────── */

function BrandingSection({ t }: { t: (en: string, ar: string) => string }) {
  const [logo, setLogo] = useState('')
  const [cover, setCover] = useState('')
  const [primary, setPrimary] = useState('#8e78fb')
  const [accent, setAccent] = useState('#47c7ea')
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <ImageUpload label={t('Community Logo', 'شعار المجتمع')} value={logo} onChange={setLogo} aspect="1/1" />
          <ImageUpload label={t('Cover Image', 'صورة الغلاف')} value={cover} onChange={setCover} aspect="16/9" />
        </div>

        <Divider />

        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('Primary Color', 'اللون الرئيسي')}>
            <ColorPicker value={primary} onChange={setPrimary} />
          </Field>
          <Field label={t('Accent Color', 'لون التمييز')}>
            <ColorPicker value={accent} onChange={setAccent} />
          </Field>
        </div>

        <SaveBar onSave={save} saved={saved} t={t} />
      </Card>

      {/* Landing page builder card */}
      <div className="rounded-2xl p-6 border relative overflow-hidden"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl opacity-40"
             style={{ background: 'var(--p)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-md">
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
              {t('Community Page Builder', 'منشئ صفحة المجتمع')}
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
              {t('Design your landing page with hero, courses, testimonials, pricing and more.', 'صمم صفحتك الرئيسية بالبطل والدورات والشهادات والتسعير والمزيد.')}
            </p>
          </div>
          <Link href="/creator/branding"
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 whitespace-nowrap"
            style={{ background: 'var(--p)' }}>
            {t('Open Page Builder', 'افتح المنشئ')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── PRICING ────────────────────────────────────────────── */

function PricingSection({ t }: { t: (en: string, ar: string) => string }) {
  const [model, setModel] = useState<PricingModel>('free')
  const [price, setPrice] = useState('')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [trial, setTrial] = useState(false)

  // Freemium tiers
  const [premiumPrice, setPremiumPrice] = useState('')
  const [vipEnabled, setVipEnabled] = useState(false)
  const [vipPrice, setVipPrice] = useState('')
  const [showTierModal, setShowTierModal] = useState<'premium' | 'vip' | null>(null)

  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  const MODELS = [
    { id: 'free',         label: t('Free',         'مجاني'),        hint: t('Free to join',           'مجاني للانضمام') },
    { id: 'subscription', label: t('Subscription', 'اشتراك'),       hint: t('Monthly, yearly or both','شهري، سنوي، أو الاثنين') },
    { id: 'freemium',     label: t('Freemium',     'مجاني+مدفوع'),  hint: t('Free + 1–2 paid tiers',  'مجاني + 1-2 مستوى مدفوع') },
    { id: 'one-time',     label: t('One-Time',     'دفعة واحدة'),   hint: t('Single payment',         'دفعة واحدة') },
  ] as const

  return (
    <Card>
      {/* Model selector */}
      <div className="grid md:grid-cols-4 gap-3">
        {MODELS.map((p) => {
          const active = model === p.id
          return (
            <button key={p.id} onClick={() => setModel(p.id as PricingModel)}
              className="text-left p-4 rounded-2xl border transition-all"
              style={{
                background: active ? 'var(--p2)' : 'var(--bg)',
                borderColor: active ? 'var(--p)' : 'var(--bd)',
              }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                     style={{ borderColor: active ? 'var(--p)' : 'var(--bd)' }}>
                  {active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--p)' }} />}
                </div>
                <p className="text-[13px] font-semibold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>
                  {p.label}
                </p>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{p.hint}</p>
            </button>
          )
        })}
      </div>

      {/* Subscription — Skool style */}
      {model === 'subscription' && (
        <>
          <button onClick={() => setShowPriceModal(true)}
            className="w-full flex items-center gap-2 p-4 rounded-xl border text-left"
            style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <DollarSign size={16} style={{ color: 'var(--t2)' }} />
            <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--t1)' }}>
              {price ? `${price} TND / ${cycle === 'monthly' ? t('month', 'شهر') : cycle === 'yearly' ? t('year', 'سنة') : t('month + year', 'شهر + سنة')}` : t('Set price', 'تحديد السعر')}
            </span>
            <Edit3 size={13} style={{ color: 'var(--t3)' }} />
          </button>

          <ToggleRow icon={Zap}
            title={t('7-day free trial', 'تجربة مجانية 7 أيام')}
            hint={t('Members get 7 days free before being charged.', 'يحصل الأعضاء على 7 أيام مجاناً قبل الدفع.')}
            checked={trial} onChange={setTrial} />
        </>
      )}

      {/* Freemium — Skool style */}
      {model === 'freemium' && (
        <div className="grid md:grid-cols-3 gap-3">
          <TierCard title={t('Standard', 'قياسي')} priceLabel={t('Free', 'مجاني')} onSetPrice={() => {}} enabled disabled />
          <TierCard title={t('Premium', 'مميز')}
            priceLabel={premiumPrice ? `${premiumPrice} TND` : t('Set price', 'تحديد السعر')}
            onSetPrice={() => setShowTierModal('premium')} enabled disabled={false} />
          <TierCard title={t('VIP', 'كبار')}
            priceLabel={vipPrice ? `${vipPrice} TND` : t('Set price', 'تحديد السعر')}
            onSetPrice={() => vipEnabled && setShowTierModal('vip')}
            enabled={vipEnabled}
            toggle={{ value: vipEnabled, onChange: setVipEnabled }} disabled={!vipEnabled} />
        </div>
      )}

      {/* One-time */}
      {model === 'one-time' && (
        <button onClick={() => { setCycle('monthly'); setShowPriceModal(true) }}
          className="w-full flex items-center gap-2 p-4 rounded-xl border text-left"
          style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
          <DollarSign size={16} style={{ color: 'var(--t2)' }} />
          <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--t1)' }}>
            {price ? `${price} TND ${t('(one-time)', '(دفعة واحدة)')}` : t('Set price', 'تحديد السعر')}
          </span>
          <Edit3 size={13} style={{ color: 'var(--t3)' }} />
        </button>
      )}

      <SaveBar onSave={save} saved={saved} t={t} />

      {/* Set price modal */}
      {showPriceModal && (
        <Modal onClose={() => setShowPriceModal(false)} title={t('Set price', 'تحديد السعر')}>
          <div className="flex items-center rounded-xl border overflow-hidden mb-3"
               style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <span className="px-3 text-[15px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="flex-1 px-2 py-3 text-[15px] font-semibold text-right bg-transparent outline-none"
              style={{ color: 'var(--t1)' }} autoFocus />
            {model === 'subscription' && (
              <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>
                /{cycle === 'monthly' ? t('month', 'شهر') : t('year', 'سنة')}
              </span>
            )}
          </div>
          <p className="text-[11px] mb-4" style={{ color: 'var(--t3)' }}>
            {t('Prices are in TND. Payouts happen in your local currency.', 'الأسعار بالدينار. المدفوعات تتم بعملتك المحلية.')}
          </p>

          {model === 'subscription' && (
            <div className="space-y-1">
              <RadioRow label={t('Monthly only', 'شهري فقط')}       active={cycle === 'monthly'} onClick={() => setCycle('monthly')} />
              <RadioRow label={t('Monthly and yearly', 'شهري وسنوي')} active={cycle === 'both'}    onClick={() => setCycle('both')} />
              <RadioRow label={t('Yearly only', 'سنوي فقط')}         active={cycle === 'yearly'}  onClick={() => setCycle('yearly')} />
            </div>
          )}

          <div className="flex gap-2 justify-end mt-5">
            <button onClick={() => setShowPriceModal(false)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={{ color: 'var(--t2)' }}>
              {t('CANCEL', 'إلغاء')}
            </button>
            <button onClick={() => setShowPriceModal(false)}
              disabled={!price}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--p)' }}>
              {t('SET', 'تحديد')}
            </button>
          </div>
        </Modal>
      )}

      {/* Tier price modal (freemium) */}
      {showTierModal && (
        <Modal onClose={() => setShowTierModal(null)} title={t('Set tier price', 'تحديد سعر المستوى')}>
          <div className="flex items-center rounded-xl border overflow-hidden mb-4"
               style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <span className="px-3 text-[15px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
            <input type="number"
              value={showTierModal === 'premium' ? premiumPrice : vipPrice}
              onChange={(e) => showTierModal === 'premium' ? setPremiumPrice(e.target.value) : setVipPrice(e.target.value)}
              className="flex-1 px-2 py-3 text-[15px] font-semibold bg-transparent outline-none"
              style={{ color: 'var(--t1)' }} autoFocus />
            <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>/{t('month', 'شهر')}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTierModal(null)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={{ color: 'var(--t2)' }}>
              {t('CANCEL', 'إلغاء')}
            </button>
            <button onClick={() => setShowTierModal(null)}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'var(--p)' }}>
              {t('SET', 'تحديد')}
            </button>
          </div>
        </Modal>
      )}
    </Card>
  )
}

function TierCard({ title, priceLabel, onSetPrice, enabled, disabled, toggle }:
  { title: string; priceLabel: string; onSetPrice: () => void; enabled: boolean;
    disabled: boolean; toggle?: { value: boolean; onChange: (v: boolean) => void } }) {
  return (
    <div className="p-4 rounded-2xl border relative"
         style={{ background: 'var(--bg)', borderColor: 'var(--bd)', opacity: disabled ? 0.5 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</p>
        {toggle && (
          <button onClick={() => toggle.onChange(!toggle.value)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: toggle.value ? 'var(--p)' : 'var(--bd)' }}>
            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: toggle.value ? 'translateX(16px)' : 'translateX(0)' }} />
          </button>
        )}
      </div>
      <button disabled={disabled} onClick={onSetPrice}
        className="flex items-center gap-1.5 text-[13px] font-medium"
        style={{ color: 'var(--p)' }}>
        <DollarSign size={13} /> {priceLabel}
      </button>
      <button disabled={disabled} className="mt-3 text-[12px] font-medium block" style={{ color: 'var(--p)' }}>
        + Add benefit
      </button>
    </div>
  )
}

function RadioRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 py-2 text-left">
      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
           style={{ borderColor: active ? 'var(--p)' : 'var(--bd)' }}>
        {active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--p)' }} />}
      </div>
      <span className="text-[13px]" style={{ color: 'var(--t1)' }}>{label}</span>
    </button>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6"
           style={{ background: 'var(--white)' }}
           onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--t1)' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

/* ─── TABS & LAYOUT ────────────────────────────────────────── */

const TAB_ITEMS = [
  { key: 'courses',    label: { en: 'Courses',    ar: 'الدورات' } },
  { key: 'challenges', label: { en: 'Challenges', ar: 'التحديات' } },
  { key: 'sessions',   label: { en: 'Sessions',   ar: 'الجلسات' } },
  { key: 'events',     label: { en: 'Events',     ar: 'الأحداث' } },
  { key: 'products',   label: { en: 'Products',   ar: 'المنتجات' } },
] as const

function TabsLayoutSection({ t }: { t: (en: string, ar: string) => string }) {
  const [vis, setVis] = useState<Record<string, boolean>>({
    courses: true, challenges: true, sessions: true, events: true, products: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TAB_VIS_KEY)
      if (raw) setVis(JSON.parse(raw))
    } catch {}
  }, [])

  const save = () => {
    localStorage.setItem(TAB_VIS_KEY, JSON.stringify(vis))
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Card>
      <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {t('Choose which sections show up inside your community. Home is always visible.', 'اختر الأقسام التي تظهر داخل مجتمعك. الرئيسية دائماً ظاهرة.')}
      </p>

      {TAB_ITEMS.map((item) => (
        <ToggleRow key={item.key} icon={Layout}
          title={item.label.en === 'Courses' ? t('Courses', 'الدورات')
               : item.label.en === 'Challenges' ? t('Challenges', 'التحديات')
               : item.label.en === 'Sessions' ? t('Sessions', 'الجلسات')
               : item.label.en === 'Events' ? t('Events', 'الأحداث')
               : t('Products', 'المنتجات')}
          checked={vis[item.key]}
          onChange={(v) => setVis({ ...vis, [item.key]: v })} />
      ))}

      <SaveBar onSave={save} saved={saved} t={t} />
    </Card>
  )
}

/* ─── RULES ────────────────────────────────────────────── */

function RulesSection({ t }: { t: (en: string, ar: string) => string }) {
  const [rules, setRules] = useState<string[]>([
    'Be respectful and kind to other members.',
    'No spam, self-promotion, or off-topic posts.',
    'Share your work and support others.',
  ])
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <Card>
      <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {t('Community guidelines shown to members.', 'قواعد المجتمع الظاهرة للأعضاء.')}
      </p>
      {rules.map((r, i) => (
        <div key={i} className="flex gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold flex-shrink-0 mt-1"
               style={{ background: 'var(--p2)', color: 'var(--p)' }}>{i + 1}</div>
          <textarea value={r} rows={2}
            onChange={(e) => { const n = [...rules]; n[i] = e.target.value; setRules(n) }}
            className="flex-1 px-3 py-2 rounded-xl text-[13px] border resize-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
          <button onClick={() => setRules(rules.filter((_, j) => j !== i))}
            className="px-2 rounded-xl self-start mt-1" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={() => setRules([...rules, ''])}
        className="px-3 py-2 rounded-xl text-[13px] font-medium flex items-center gap-1.5 self-start"
        style={{ background: 'var(--p2)', color: 'var(--p)' }}>
        <Plus size={13} /> {t('Add rule', 'إضافة قاعدة')}
      </button>
      <SaveBar onSave={save} saved={saved} t={t} />
    </Card>
  )
}

/* ─── NOTIFICATIONS ────────────────────────────────────────── */

function NotificationsSection({ t }: { t: (en: string, ar: string) => string }) {
  const [n, setN] = useState({
    newMember: true, newPost: true, newComment: true, newPurchase: true,
    weeklyDigest: false, monthlyReport: true, dmNotifs: true, mentions: true,
  })
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500) }

  const rows: [keyof typeof n, string][] = [
    ['newMember',     t('New member joins',   'انضمام عضو جديد')],
    ['newPost',       t('New post created',   'منشور جديد')],
    ['newComment',    t('New comment',        'تعليق جديد')],
    ['newPurchase',   t('New purchase',       'عملية شراء جديدة')],
    ['weeklyDigest',  t('Weekly digest',      'ملخص أسبوعي')],
    ['monthlyReport', t('Monthly report',     'تقرير شهري')],
    ['dmNotifs',      t('Direct messages',    'الرسائل المباشرة')],
    ['mentions',      t('Mentions',           'الإشارات')],
  ]

  return (
    <Card>
      <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {t('Choose which events send you an email.', 'اختر الأحداث التي ترسل لك بريداً.')}
      </p>
      {rows.map(([k, label]) => (
        <ToggleRow key={k} icon={Bell} title={label}
          checked={n[k]} onChange={(v) => setN({ ...n, [k]: v })} />
      ))}
      <SaveBar onSave={save} saved={saved} t={t} />
    </Card>
  )
}

/* ─── SHARED ATOMS ────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 border flex flex-col gap-5"
         style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--t1)' }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, prefix, type = 'text', placeholder }:
  { value: string; onChange: (v: string) => void; prefix?: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex items-center rounded-xl border overflow-hidden"
         style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
      {prefix && <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>{prefix}</span>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none"
        style={{ color: 'var(--t1)' }} />
    </div>
  )
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea value={value} rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-[13px] rounded-xl border outline-none resize-none"
      style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
  )
}

function Divider() {
  return <div className="h-px" style={{ background: 'var(--bd)' }} />
}

function ToggleRow({ icon: Icon, title, hint, checked, onChange }:
  { icon: any; title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: checked ? 'var(--p2)' : 'var(--bg)', color: checked ? 'var(--p)' : 'var(--t3)' }}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{title}</p>
        {hint && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{hint}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? 'var(--p)' : 'var(--bd)' }}>
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-1.5"
         style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
             className="w-10 h-9 rounded-lg cursor-pointer border-0 bg-transparent" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
             className="flex-1 px-2 py-1 text-[13px] font-mono bg-transparent outline-none"
             style={{ color: 'var(--t1)' }} />
    </div>
  )
}

function ImageUpload({ label, value, onChange, aspect }:
  { label: string; value: string; onChange: (v: string) => void; aspect: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--t2)' }}>{label}</p>
      <div className="rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden"
           style={{ borderColor: 'var(--bd)', background: 'var(--bg)', aspectRatio: aspect }}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,.6)', color: '#fff' }}>
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center px-3">
            <Upload size={20} className="mx-auto mb-1" style={{ color: 'var(--t3)' }} />
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Click to upload</p>
          </div>
        )}
        <input type="file" accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              const reader = new FileReader()
              reader.onload = () => onChange(String(reader.result))
              reader.readAsDataURL(f)
            }
          }} />
      </div>
    </div>
  )
}

function SaveBar({ onSave, saved, t }:
  { onSave: () => void; saved: boolean; t: (en: string, ar: string) => string }) {
  return (
    <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--bd)' }}>
      <button onClick={onSave}
        className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 transition-opacity hover:opacity-90"
        style={{ background: saved ? '#22c55e' : 'var(--p)' }}>
        {saved ? <><Check size={14} /> {t('Saved', 'تم الحفظ')}</> : t('Save changes', 'حفظ التغييرات')}
      </button>
    </div>
  )
}
