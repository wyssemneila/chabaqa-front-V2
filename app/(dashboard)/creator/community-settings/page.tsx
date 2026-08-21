'use client'

import { useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Settings, Palette, DollarSign, Layout, Shield, Bell, Globe,
  Copy, Check, Upload, Trash2, Plus, X, Eye, EyeOff, Lock, Unlock,
} from 'lucide-react'

type TabId = 'general' | 'branding' | 'pricing' | 'tabs' | 'rules' | 'notifications' | 'domain'
type PricingModel = 'free' | 'subscription' | 'freemium' | 'one-time'

const TABS: { id: TabId; label: { en: string; ar: string }; icon: any }[] = [
  { id: 'general',       label: { en: 'General',        ar: 'عام'          }, icon: Settings },
  { id: 'branding',      label: { en: 'Branding',       ar: 'الهوية'       }, icon: Palette  },
  { id: 'pricing',       label: { en: 'Pricing',        ar: 'التسعير'      }, icon: DollarSign },
  { id: 'tabs',          label: { en: 'Tabs & Layout',  ar: 'التبويبات'    }, icon: Layout   },
  { id: 'rules',         label: { en: 'Rules',          ar: 'القواعد'      }, icon: Shield   },
  { id: 'notifications', label: { en: 'Notifications',  ar: 'الإشعارات'    }, icon: Bell     },
  { id: 'domain',        label: { en: 'Domain',         ar: 'النطاق'       }, icon: Globe    },
]

export default function CommunitySettingsPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [tab, setTab] = useState<TabId>('general')

  // General
  const [name, setName] = useState('Motion Masters')
  const [description, setDescription] = useState('A creative community for motion designers.')
  const [slug, setSlug] = useState('motion-masters')
  const [isPublic, setIsPublic] = useState(true)
  const [requireApproval, setRequireApproval] = useState(false)
  const [questions, setQuestions] = useState<string[]>(['Why do you want to join?'])
  const [copied, setCopied] = useState(false)

  // Branding
  const [primary, setPrimary] = useState('#8e78fb')
  const [accent, setAccent] = useState('#47c7ea')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [iconUrl, setIconUrl] = useState('')

  // Pricing
  const [model, setModel] = useState<PricingModel>('free')
  const [monthly, setMonthly] = useState('9.99')
  const [yearly, setYearly] = useState('99.00')
  const [oneTime, setOneTime] = useState('49.00')

  // Tabs & Layout
  const [tabVis, setTabVis] = useState({
    home: true, courses: true, challenges: true, events: true, community: true, products: true, sessions: true,
  })

  // Rules
  const [rules, setRules] = useState<string[]>([
    'Be respectful and kind to other members.',
    'No spam, self-promotion, or off-topic posts.',
    'Share your work and support others.',
  ])

  // Notifications
  const [notif, setNotif] = useState({
    newMember: true, newPost: true, newComment: true, newPurchase: true,
    weeklyDigest: false, monthlyReport: true, dmNotifs: true, mentions: true,
  })

  // Domain
  const [domain, setDomain] = useState('')

  const shareLink = `https://chabaqa.io/${slug || 'your-community'}`
  const copy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const save = () => {
    // TODO: wire to communitiesApi.updateSettings
    console.log('[settings save]', { name, description, slug, isPublic, model, primary, accent, rules, notif, domain, tabVis })
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto pb-24">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
                {t('Community Settings', 'إعدادات المجتمع')}
              </h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
                {t('Configure how your community looks, feels and works.', 'اضبط شكل مجتمعك وطريقة عمله.')}
              </p>
            </div>
            <button onClick={save}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--p)' }}>
              {t('Save Changes', 'حفظ التغييرات')}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b overflow-x-auto scrollbar-thin"
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

          {/* Panel */}
          <div className="mt-6">
            {tab === 'general' && (
              <Card>
                <Field label={t('Community Name', 'اسم المجتمع')}>
                  <Input value={name} onChange={setName} />
                </Field>
                <Field label={t('Description', 'الوصف')} hint={t('A short summary shown on your community page.', 'ملخص قصير يظهر في صفحة المجتمع.')}>
                  <Textarea value={description} onChange={setDescription} rows={3} />
                </Field>
                <Field label={t('URL Slug', 'الرابط المخصص')} hint={t('chabaqa.io/your-slug', '')}>
                  <Input value={slug} onChange={setSlug} prefix="chabaqa.io/" />
                </Field>

                <Field label={t('Share Link', 'رابط المشاركة')}>
                  <div className="flex gap-2">
                    <input readOnly value={shareLink}
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] border"
                      style={{ background: 'var(--bg)', color: 'var(--t2)', borderColor: 'var(--bd)' }} />
                    <button onClick={copy}
                      className="px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-1.5"
                      style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? t('Copied', 'تم النسخ') : t('Copy', 'نسخ')}
                    </button>
                  </div>
                </Field>

                <Divider />

                <ToggleRow
                  icon={isPublic ? Unlock : Lock}
                  title={isPublic ? t('Public Community', 'مجتمع عام') : t('Private Community', 'مجتمع خاص')}
                  hint={isPublic ? t('Anyone can find and join.', 'يستطيع أي شخص العثور والانضمام.') : t('People need to request access.', 'يحتاج الأشخاص إلى طلب الوصول.')}
                  checked={isPublic} onChange={setIsPublic} />

                {!isPublic && (
                  <>
                    <ToggleRow
                      icon={Shield}
                      title={t('Require approval for joining', 'اشتراط الموافقة على الانضمام')}
                      hint={t('You review each request before granting access.', 'تراجع كل طلب قبل منح الوصول.')}
                      checked={requireApproval} onChange={setRequireApproval} />

                    {requireApproval && (
                      <div className="mt-4 p-4 rounded-xl border"
                           style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
                        <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--t1)' }}>
                          {t('Questions for applicants', 'أسئلة للمتقدمين')}
                        </p>
                        {questions.map((q, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <input value={q}
                              onChange={(e) => { const n = [...questions]; n[i] = e.target.value; setQuestions(n) }}
                              placeholder={t('Enter a question…', 'أدخل سؤالاً…')}
                              className="flex-1 px-3 py-2 rounded-lg text-[13px] border"
                              style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
                            <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                              className="px-2 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => setQuestions([...questions, ''])}
                          className="mt-2 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5"
                          style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                          <Plus size={12} /> {t('Add question', 'إضافة سؤال')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}

            {tab === 'branding' && (
              <Card>
                <div className="grid md:grid-cols-3 gap-4">
                  <ImageUpload label={t('Icon (favicon)', 'الأيقونة')} value={iconUrl} onChange={setIconUrl} aspect="1/1" />
                  <ImageUpload label={t('Logo', 'الشعار')} value={logoUrl} onChange={setLogoUrl} aspect="3/1" />
                  <ImageUpload label={t('Cover', 'الغلاف')} value={coverUrl} onChange={setCoverUrl} aspect="16/9" />
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

                {/* Live preview */}
                <div className="mt-6 p-6 rounded-2xl" style={{ background: primary + '18' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: primary }}>
                    {t('Preview', 'معاينة')}
                  </p>
                  <h3 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
                    {name}
                  </h3>
                  <p className="text-[13px] mb-4" style={{ color: 'var(--t2)' }}>{description}</p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl text-[13px] font-medium text-white"
                            style={{ background: primary }}>
                      {t('Join Community', 'انضم للمجتمع')}
                    </button>
                    <button className="px-4 py-2 rounded-xl text-[13px] font-medium"
                            style={{ background: accent + '22', color: accent }}>
                      {t('Learn More', 'اعرف أكثر')}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {tab === 'pricing' && (
              <Card>
                <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--t1)' }}>
                  {t('Pricing Model', 'نموذج التسعير')}
                </p>
                <div className="grid md:grid-cols-4 gap-3">
                  {([
                    { id: 'free',         label: t('Free',         'مجاني'),    hint: t('Open access',       'وصول مفتوح') },
                    { id: 'subscription', label: t('Subscription', 'اشتراك'),   hint: t('Monthly / yearly',  'شهري / سنوي') },
                    { id: 'freemium',     label: t('Freemium',     'مجاني+مدفوع'), hint: t('Free tier + paid', 'مجاني + مدفوع') },
                    { id: 'one-time',     label: t('One-Time',     'دفعة واحدة'), hint: t('Lifetime access',   'وصول دائم') },
                  ] as const).map((p) => {
                    const active = model === p.id
                    return (
                      <button key={p.id} onClick={() => setModel(p.id as PricingModel)}
                        className="p-4 rounded-2xl text-left transition-all border"
                        style={{
                          background: active ? 'var(--p2)' : 'var(--white)',
                          borderColor: active ? 'var(--p)' : 'var(--bd)',
                        }}>
                        <p className="text-[14px] font-semibold mb-1" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>
                          {p.label}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{p.hint}</p>
                      </button>
                    )
                  })}
                </div>

                {model !== 'free' && (
                  <>
                    <Divider />
                    <div className="grid md:grid-cols-2 gap-4">
                      {(model === 'subscription' || model === 'freemium') && (
                        <>
                          <Field label={t('Monthly Price', 'السعر الشهري')} hint="TND">
                            <Input value={monthly} onChange={setMonthly} type="number" />
                          </Field>
                          <Field label={t('Yearly Price', 'السعر السنوي')} hint="TND">
                            <Input value={yearly} onChange={setYearly} type="number" />
                          </Field>
                        </>
                      )}
                      {model === 'one-time' && (
                        <Field label={t('One-Time Price', 'سعر الدفعة الواحدة')} hint="TND">
                          <Input value={oneTime} onChange={setOneTime} type="number" />
                        </Field>
                      )}
                    </div>
                  </>
                )}
              </Card>
            )}

            {tab === 'tabs' && (
              <Card>
                <p className="text-[13px] mb-4" style={{ color: 'var(--t3)' }}>
                  {t('Toggle which sections appear in your community.', 'حدد الأقسام التي تظهر في مجتمعك.')}
                </p>
                {(Object.keys(tabVis) as (keyof typeof tabVis)[]).map((k) => (
                  <ToggleRow key={k}
                    icon={tabVis[k] ? Eye : EyeOff}
                    title={k.charAt(0).toUpperCase() + k.slice(1)}
                    checked={tabVis[k]}
                    onChange={(v) => setTabVis({ ...tabVis, [k]: v })} />
                ))}
              </Card>
            )}

            {tab === 'rules' && (
              <Card>
                <p className="text-[13px] mb-4" style={{ color: 'var(--t3)' }}>
                  {t('Community guidelines shown to members.', 'قواعد المجتمع الظاهرة للأعضاء.')}
                </p>
                {rules.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
                         style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                      {i + 1}
                    </div>
                    <textarea value={r} rows={2}
                      onChange={(e) => { const n = [...rules]; n[i] = e.target.value; setRules(n) }}
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] border resize-none"
                      style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
                    <button onClick={() => setRules(rules.filter((_, j) => j !== i))}
                      className="px-2 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setRules([...rules, ''])}
                  className="mt-2 px-3 py-2 rounded-xl text-[13px] font-medium flex items-center gap-1.5"
                  style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  <Plus size={13} /> {t('Add rule', 'إضافة قاعدة')}
                </button>
              </Card>
            )}

            {tab === 'notifications' && (
              <Card>
                <p className="text-[13px] mb-4" style={{ color: 'var(--t3)' }}>
                  {t('Choose which events send you an email.', 'اختر الأحداث التي ترسل لك بريداً.')}
                </p>
                {[
                  ['newMember',    t('New member joins',   'انضمام عضو جديد')],
                  ['newPost',      t('New post created',   'منشور جديد')],
                  ['newComment',   t('New comment',        'تعليق جديد')],
                  ['newPurchase',  t('New purchase',       'عملية شراء جديدة')],
                  ['weeklyDigest', t('Weekly digest',      'ملخص أسبوعي')],
                  ['monthlyReport',t('Monthly report',     'تقرير شهري')],
                  ['dmNotifs',     t('Direct messages',    'الرسائل المباشرة')],
                  ['mentions',     t('Mentions',           'الإشارات')],
                ].map(([k, label]) => (
                  <ToggleRow key={k} icon={Bell} title={label as string}
                    checked={(notif as any)[k]}
                    onChange={(v) => setNotif({ ...notif, [k as string]: v })} />
                ))}
              </Card>
            )}

            {tab === 'domain' && (
              <Card>
                <Field label={t('Custom Domain', 'نطاق مخصص')}
                       hint={t('Point your own domain to this community.', 'وجّه نطاقك الخاص إلى هذا المجتمع.')}>
                  <Input value={domain} onChange={setDomain} placeholder="community.yourdomain.com" />
                </Field>

                <Divider />

                <div className="p-4 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
                  <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--t1)' }}>
                    {t('DNS Configuration', 'إعدادات DNS')}
                  </p>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--t3)' }}>
                    {t('Add these records to your DNS provider.', 'أضف هذه السجلات إلى مزود DNS.')}
                  </p>
                  <div className="rounded-lg p-3 font-mono text-[12px] space-y-1"
                       style={{ background: 'var(--white)', color: 'var(--t2)' }}>
                    <div>CNAME  →  cname.chabaqa.io</div>
                    <div>TXT    →  chabaqa-verify=abc123xyz</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── UI atoms ────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 border space-y-5"
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
      {prefix && (
        <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>{prefix}</span>
      )}
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
    <div className="flex items-center gap-3 py-3">
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
