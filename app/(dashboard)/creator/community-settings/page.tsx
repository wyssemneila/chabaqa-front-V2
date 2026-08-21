'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import Link from 'next/link'
import {
  UserPlus, Settings, Palette, DollarSign, Layout, BookOpen, Bell, Users2,
  Copy, Check, Upload, Trash2, Plus, X, Edit3, Mail, ChevronDown, LayoutTemplate,
  FileUp, Zap, Globe, Lock, Unlock, ArrowRight, Loader2, PartyPopper, Shield,
} from 'lucide-react'

type TabId = 'general' | 'invitation' | 'team' | 'pricing' | 'tabs' | 'rules' | 'notifications'
type PricingModel = 'free' | 'subscription' | 'freemium' | 'one-time'
type BillingCycle = 'monthly' | 'yearly' | 'both'

const TABS: { id: TabId; label: { en: string; ar: string }; icon: any; color: string; softColor: string }[] = [
  { id: 'general',       label: { en: 'General',       ar: 'عام'         }, icon: Settings,   color: 'var(--p)',      softColor: 'var(--p2)'  },
  { id: 'invitation',    label: { en: 'Invitation',    ar: 'الدعوة'      }, icon: UserPlus,   color: 'var(--pink)',   softColor: 'var(--pk2)' },
  { id: 'team',          label: { en: 'Team & Roles',  ar: 'الفريق'      }, icon: Users2,     color: 'var(--cyan)',   softColor: 'var(--c2)'  },
  { id: 'pricing',       label: { en: 'Pricing',       ar: 'التسعير'     }, icon: DollarSign, color: 'var(--orange)', softColor: 'var(--o2)'  },
  { id: 'tabs',          label: { en: 'Tabs & Layout', ar: 'التبويبات'   }, icon: Layout,     color: 'var(--cyan)',   softColor: 'var(--c2)'  },
  { id: 'rules',         label: { en: 'Rules',         ar: 'القواعد'     }, icon: BookOpen,   color: 'var(--p)',      softColor: 'var(--p2)'  },
  { id: 'notifications', label: { en: 'Notifications', ar: 'الإشعارات'   }, icon: Bell,       color: 'var(--pink)',   softColor: 'var(--pk2)' },
]

const COMMUNITY_KEY = 'motion-masters'
const TAB_VIS_KEY = `community-tabs:${COMMUNITY_KEY}`

export default function CommunitySettingsPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [tab, setTab] = useState<TabId>('general')
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [savedMessage, setSavedMessage] = useState('')

  const triggerSave = async (message: string) => {
    setSavedMessage(message)
    setSaveState('loading')
    await new Promise((r) => setTimeout(r, 700))
    setSaveState('success')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto pb-24">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              {t('Community Settings', 'إعدادات المجتمع')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {t('Configure how your community looks, feels and works.', 'اضبط شكل مجتمعك وطريقة عمله.')}
            </p>
          </div>

          {/* Tabs — minimalist pills with colored icons */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
            {TABS.map((T) => {
              const active = tab === T.id
              const Icon = T.icon
              return (
                <button key={T.id} onClick={() => setTab(T.id)}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap rounded-xl transition-colors border"
                  style={{
                    background: active ? T.softColor : 'var(--white)',
                    color: active ? T.color : 'var(--t2)',
                    borderColor: active ? T.color : 'var(--bd)',
                  }}>
                  <Icon size={14} style={{ color: T.color }} />
                  {T.label[lang]}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            {tab === 'general'       && <GeneralSection t={t} onSave={triggerSave} />}
            {tab === 'invitation'    && <InvitationSection t={t} />}
            {tab === 'team'          && <TeamSection t={t} onSave={triggerSave} />}
            {tab === 'pricing'       && <PricingSection t={t} onSave={triggerSave} />}
            {tab === 'tabs'          && <TabsLayoutSection t={t} onSave={triggerSave} />}
            {tab === 'rules'         && <RulesSection t={t} onSave={triggerSave} />}
            {tab === 'notifications' && <NotificationsSection t={t} onSave={triggerSave} />}
          </div>
        </main>
      </div>

      {/* Save loader / success popup */}
      {saveState === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,.35)' }}>
          <div className="rounded-2xl px-6 py-5 flex items-center gap-3"
               style={{ background: 'var(--white)' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--p)' }} />
            <span className="text-[14px] font-medium" style={{ color: 'var(--t1)' }}>
              {t('Saving your changes…', 'جارٍ حفظ تغييراتك…')}
            </span>
          </div>
        </div>
      )}
      {saveState === 'success' && (
        <SuccessModal t={t} message={savedMessage} onClose={() => setSaveState('idle')} />
      )}
    </div>
  )
}

/* ─── GENERAL ────────────────────────────────────────────── */

function GeneralSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [logo, setLogo] = useState('')
  const [cover, setCover] = useState('')
  const [name, setName] = useState('Motion Masters')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('motion-masters')
  const [editingSlug, setEditingSlug] = useState(false)
  const [customDomain, setCustomDomain] = useState('')
  const [showDomain, setShowDomain] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [requireQuestions, setRequireQuestions] = useState(false)
  const [questions, setQuestions] = useState<string[]>([''])

  return (
    <div className="space-y-4">
      {/* Card 1 — Identity: Icon + Cover uploaders + Name + Description */}
      <div className="rounded-2xl border p-5 space-y-5"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        {/* Two uploaders side by side */}
        <div className="flex gap-5 flex-wrap">
          <NiceUploader label={t('Icon', 'الأيقونة')}
            hint={t('Recommended: 128 × 128', 'مقاس مقترح: 128 × 128')}
            value={logo} onChange={setLogo} w={200} h={200} />
          <NiceUploader label={t('Cover', 'الغلاف')}
            hint={t('Recommended: 1084 × 576', 'مقاس مقترح: 1084 × 576')}
            value={cover} onChange={setCover} w={380} h={200} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium" style={{ color: 'var(--t2)' }}>{t('Community Name', 'اسم المجتمع')}</label>
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{name.length}/30</span>
          </div>
          <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] border outline-none focus:border-[var(--p)]"
            style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium" style={{ color: 'var(--t2)' }}>{t('Description', 'الوصف')}</label>
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{description.length}/150</span>
          </div>
          <textarea value={description} maxLength={150} rows={2}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Say what your community is about…', 'اكتب فكرة مجتمعك…')}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none resize-none focus:border-[var(--p)]"
            style={{ background: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
        </div>
      </div>

      {/* Card 2 — URL & Domain */}
      <div className="rounded-2xl border p-5"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} style={{ color: 'var(--p)' }} />
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('URL & Domain', 'الرابط والنطاق')}
          </p>
        </div>

        {editingSlug ? (
          <div className="flex gap-2 mb-3">
            <div className="flex items-center rounded-xl border overflow-hidden flex-1"
                 style={{ background: 'var(--bg)', borderColor: 'var(--p)' }}>
              <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>chabaqa.io/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                className="flex-1 px-1 py-2.5 text-[13px] bg-transparent outline-none"
                style={{ color: 'var(--t1)' }} autoFocus />
            </div>
            <button onClick={() => setEditingSlug(false)}
              className="px-4 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'var(--p)' }}>
              {t('Done', 'تم')}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border mb-3"
               style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <span className="text-[13px]" style={{ color: 'var(--t2)' }}>
              chabaqa.io/<span className="font-semibold" style={{ color: 'var(--t1)' }}>{slug}</span>
            </span>
            <button onClick={() => setEditingSlug(true)}
              className="text-[12px] font-medium flex items-center gap-1" style={{ color: 'var(--p)' }}>
              <Edit3 size={12} /> {t('Edit', 'تعديل')}
            </button>
          </div>
        )}

        {!showDomain ? (
          <button onClick={() => setShowDomain(true)}
            className="text-[12px] font-medium flex items-center gap-1.5"
            style={{ color: 'var(--p)' }}>
            <Plus size={12} /> {t('Add custom domain', 'إضافة نطاق مخصص')}
          </button>
        ) : (
          <div className="flex gap-2">
            <div className="flex items-center rounded-xl border overflow-hidden flex-1"
                 style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <Globe size={13} className="ml-3" style={{ color: 'var(--t3)' }} />
              <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="community.yourdomain.com"
                className="flex-1 px-2 py-2.5 text-[13px] bg-transparent outline-none"
                style={{ color: 'var(--t1)' }} />
            </div>
            <button onClick={() => { setShowDomain(false); setCustomDomain('') }}
              className="px-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Card 3 — Landing Page shortcut (flat, minimalist) */}
      <Link href="/creator/branding"
        className="flex items-center gap-4 p-4 rounded-2xl border transition-colors hover:border-[var(--p)]"
        style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'var(--p2)', color: 'var(--p)' }}>
          <LayoutTemplate size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('Landing Page', 'صفحة الهبوط')}
          </p>
          <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
            {t('Design the page people see when they discover your community.', 'صمم الصفحة التي يراها الناس عند اكتشاف مجتمعك.')}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'var(--p)' }}>
          {t('Open', 'افتح')} <ArrowRight size={13} />
        </div>
      </Link>

      {/* Card 4 — Visibility */}
      <div className="rounded-2xl border p-5"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Lock size={14} style={{ color: 'var(--p)' }} />
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('Community Visibility', 'ظهور المجتمع')}
          </p>
        </div>
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

        {visibility === 'private' && (
          <div className="mt-4 rounded-xl border p-4"
               style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                  {t('Require questions from applicants', 'اشتراط أسئلة على المتقدمين')}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
                  {t('People must answer before requesting access.', 'يجب على الأشخاص الإجابة قبل طلب الوصول.')}
                </p>
              </div>
              <Toggle checked={requireQuestions} onChange={setRequireQuestions} />
            </div>

            {requireQuestions && (
              <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--bd)' }}>
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={q}
                      onChange={(e) => { const n = [...questions]; n[i] = e.target.value; setQuestions(n) }}
                      placeholder={t('Enter a question…', 'أدخل سؤالاً…')}
                      className="flex-1 px-3 py-2 rounded-lg text-[13px] border"
                      style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }} />
                    <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                      className="px-2 rounded-lg" style={{ background: 'var(--white)', color: 'var(--t3)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setQuestions([...questions, ''])}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5"
                  style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  <Plus size={12} /> {t('Add question', 'إضافة سؤال')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <SaveBar onSave={() => onSave(t('Your general settings are saved. Your community is looking sharp!', 'تم حفظ الإعدادات العامة. مجتمعك يبدو رائعاً!'))} t={t} />
    </div>
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
             style={{ borderColor: active ? 'var(--p)' : 'var(--bd)' }}>
          {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--p)' }} />}
        </div>
        <Icon size={15} style={{ color: active ? 'var(--p)' : 'var(--t2)' }} />
        <p className="text-[14px] font-semibold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{title}</p>
      </div>
      <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{hint}</p>
    </button>
  )
}

/* ─── TEAM & ROLES ────────────────────────────────────────────── */

type Role = 'owner' | 'admin' | 'moderator' | 'support'
type Member = { id: string; name: string; email: string; role: Role; avatar?: string }

const ROLES: { id: Role; label: string; hint: string; color: string }[] = [
  { id: 'owner',     label: 'Owner',     hint: 'Full access', color: 'var(--p)' },
  { id: 'admin',     label: 'Admin',     hint: 'Manage content, members, settings', color: 'var(--pink)' },
  { id: 'moderator', label: 'Moderator', hint: 'Manage posts and members', color: 'var(--cyan)' },
  { id: 'support',   label: 'Support',   hint: 'Reply to help requests', color: 'var(--orange)' },
]

function TeamSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'You', email: 'you@chabaqa.io', role: 'owner' },
  ])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('admin')

  const invite = () => {
    if (!inviteEmail) return
    setMembers([...members, {
      id: String(Date.now()),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
    }])
    setInviteEmail('')
  }

  const removeMember = (id: string) => setMembers(members.filter(m => m.id !== id))
  const setRole = (id: string, role: Role) =>
    setMembers(members.map(m => m.id === id ? { ...m, role } : m))

  return (
    <div className="space-y-4">
      {/* Invite */}
      <div className="rounded-2xl border p-5"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={14} style={{ color: 'var(--cyan)' }} />
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('Invite a team member', 'ادعُ عضو فريق')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('Email address', 'البريد الإلكتروني')}
            className="flex-1 min-w-[220px] px-3 py-2.5 rounded-xl text-[13px] border"
            style={{ background: 'var(--bg)', color: 'var(--t1)', borderColor: 'var(--bd)' }} />
          <RoleSelect value={inviteRole} onChange={setInviteRole} />
          <button onClick={invite} disabled={!inviteEmail}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--p)' }}>
            {t('Invite', 'دعوة')}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border p-5"
           style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users2 size={14} style={{ color: 'var(--cyan)' }} />
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('Team members', 'أعضاء الفريق')}
          </p>
          <span className="text-[12px] ml-auto" style={{ color: 'var(--t3)' }}>
            {members.length} {t('members', 'أعضاء')}
          </span>
        </div>

        <div className="space-y-2">
          {members.map((m) => {
            const roleObj = ROLES.find(r => r.id === m.role)!
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border"
                   style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
                     style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{m.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>{m.email}</p>
                </div>
                {m.role === 'owner' ? (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                    Owner
                  </span>
                ) : (
                  <>
                    <RoleSelect value={m.role} onChange={(r) => setRole(m.id, r)} compact />
                    <button onClick={() => removeMember(m.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--white)', color: '#ef4444', border: '1px solid var(--bd)' }}>
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <SaveBar onSave={() => onSave(t('Team roles saved. Your crew is ready to help.', 'تم حفظ صلاحيات الفريق.'))} t={t} />
    </div>
  )
}

function RoleSelect({ value, onChange, compact = false }:
  { value: Role; onChange: (v: Role) => void; compact?: boolean }) {
  const roleObj = ROLES.find(r => r.id === value)!
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as Role)}
        className="appearance-none rounded-xl text-[12px] font-semibold border pl-3 pr-8 cursor-pointer"
        style={{
          background: 'var(--white)',
          color: roleObj.color,
          borderColor: 'var(--bd)',
          height: compact ? 36 : 42,
        }}>
        {ROLES.filter(r => r.id !== 'owner').map(r => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      <ChevronDown size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--t3)' }} />
    </div>
  )
}

/* ─── INVITATION ────────────────────────────────────────────── */

function InvitationSection({ t }: { t: (en: string, ar: string) => string }) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [csvEmails, setCsvEmails] = useState<string[]>([])
  const [csvName, setCsvName] = useState('')
  const csvRef = useRef<HTMLInputElement>(null)
  const shareLink = `https://chabaqa.io/${COMMUNITY_KEY}/about`

  const copy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleCsv = (file: File) => {
    setCsvName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      const emails = text
        .split(/[\s,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      setCsvEmails(Array.from(new Set(emails)))
    }
    reader.readAsText(file)
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
          <button disabled={!email}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--p)' }}>
            {t('SEND', 'إرسال')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 py-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'var(--p2)', color: 'var(--p)' }}>
          <FileUp size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
            {t('Import a .CSV file', 'استيراد ملف CSV')}
          </p>
          <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
            {csvName
              ? `${csvName} — ${csvEmails.length} ${t('emails found', 'بريدًا تم العثور عليه')}`
              : t('Invite members in bulk by importing an email list.', 'ادعُ الأعضاء دفعة واحدة عبر ملف البريد.')}
          </p>
        </div>
        <input ref={csvRef} type="file" accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])} />
        <button onClick={() => csvRef.current?.click()}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold border"
          style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>
          {csvEmails.length > 0 ? t('SEND ALL', 'إرسال الكل') : t('IMPORT', 'استيراد')}
        </button>
      </div>
    </Card>
  )
}


/* ─── PRICING ────────────────────────────────────────────── */

function PricingSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [model, setModel] = useState<PricingModel>('free')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [yearlyPrice, setYearlyPrice] = useState('')
  const [oneTimePrice, setOneTimePrice] = useState('')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [trial, setTrial] = useState(false)

  const [premiumPrice, setPremiumPrice] = useState('')
  const [vipEnabled, setVipEnabled] = useState(false)
  const [vipPrice, setVipPrice] = useState('')
  const [showTierModal, setShowTierModal] = useState<'premium' | 'vip' | null>(null)

  const MODELS = [
    { id: 'free',         label: t('Free',         'مجاني'),        hint: t('Free to join',           'مجاني للانضمام') },
    { id: 'subscription', label: t('Subscription', 'اشتراك'),       hint: t('Monthly, yearly or both','شهري، سنوي، أو الاثنين') },
    { id: 'freemium',     label: t('Freemium',     'مجاني+مدفوع'),  hint: t('Free + 1–2 paid tiers',  'مجاني + 1-2 مستوى مدفوع') },
    { id: 'one-time',     label: t('One-Time',     'دفعة واحدة'),   hint: t('Single payment',         'دفعة واحدة') },
  ] as const

  return (
    <Card>
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

      {/* Subscription */}
      {model === 'subscription' && (
        <>
          {cycle === 'both' ? (
            /* Two columns: monthly + yearly */
            <div className="grid md:grid-cols-2 gap-3">
              <PriceButton label={t('Monthly price', 'السعر الشهري')}
                value={monthlyPrice} suffix={`/${t('month', 'شهر')}`}
                onClick={() => setShowPriceModal(true)} />
              <PriceButton label={t('Yearly price', 'السعر السنوي')}
                value={yearlyPrice} suffix={`/${t('year', 'سنة')}`}
                onClick={() => setShowPriceModal(true)} />
            </div>
          ) : (
            <PriceButton
              label={cycle === 'monthly' ? t('Monthly price', 'السعر الشهري') : t('Yearly price', 'السعر السنوي')}
              value={cycle === 'monthly' ? monthlyPrice : yearlyPrice}
              suffix={`/${cycle === 'monthly' ? t('month', 'شهر') : t('year', 'سنة')}`}
              onClick={() => setShowPriceModal(true)} />
          )}

          <ToggleRow icon={Zap}
            title={t('7-day free trial', 'تجربة مجانية 7 أيام')}
            hint={t('Members get 7 days free before being charged.', 'يحصل الأعضاء على 7 أيام مجاناً قبل الدفع.')}
            color="var(--orange)" softColor="var(--o2)"
            checked={trial} onChange={setTrial} />
        </>
      )}

      {/* Freemium */}
      {model === 'freemium' && (
        <div className="grid md:grid-cols-3 gap-3">
          <TierCard title={t('Standard', 'قياسي')} priceLabel={t('Free', 'مجاني')} onSetPrice={() => {}} disabled />
          <TierCard title={t('Premium', 'مميز')}
            priceLabel={premiumPrice ? `${premiumPrice} TND` : t('Set price', 'تحديد السعر')}
            onSetPrice={() => setShowTierModal('premium')} />
          <TierCard title={t('VIP', 'كبار')}
            priceLabel={vipPrice ? `${vipPrice} TND` : t('Set price', 'تحديد السعر')}
            onSetPrice={() => vipEnabled && setShowTierModal('vip')}
            disabled={!vipEnabled}
            toggle={{ value: vipEnabled, onChange: setVipEnabled }} />
        </div>
      )}

      {/* One-time */}
      {model === 'one-time' && (
        <PriceButton label={t('One-time price', 'السعر الواحد')}
          value={oneTimePrice} suffix={t('(one-time)', '(دفعة واحدة)')}
          onClick={() => setShowPriceModal(true)} />
      )}

      <SaveBar onSave={() => onSave(t('Pricing updated. Time to make some sales!', 'تم تحديث التسعير. حان وقت البيع!'))} t={t} />

      {/* Set price modal */}
      {showPriceModal && (
        <Modal onClose={() => setShowPriceModal(false)} title={t('Set price', 'تحديد السعر')}>
          {cycle === 'both' && model === 'subscription' ? (
            <div className="space-y-3 mb-3">
              <PriceInput label={t('Monthly', 'شهري')} value={monthlyPrice} onChange={setMonthlyPrice} suffix={`/${t('month', 'شهر')}`} />
              <PriceInput label={t('Yearly', 'سنوي')} value={yearlyPrice} onChange={setYearlyPrice} suffix={`/${t('year', 'سنة')}`} />
            </div>
          ) : (
            <div className="flex items-center rounded-xl border overflow-hidden mb-3"
                 style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <span className="px-3 text-[15px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
              <input type="number" autoFocus
                value={model === 'one-time' ? oneTimePrice : cycle === 'monthly' ? monthlyPrice : yearlyPrice}
                onChange={(e) => {
                  const v = e.target.value
                  if (model === 'one-time') setOneTimePrice(v)
                  else if (cycle === 'monthly') setMonthlyPrice(v)
                  else setYearlyPrice(v)
                }}
                className="flex-1 px-2 py-3 text-[15px] font-semibold text-right bg-transparent outline-none"
                style={{ color: 'var(--t1)' }} />
              {model === 'subscription' && (
                <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>
                  /{cycle === 'monthly' ? t('month', 'شهر') : t('year', 'سنة')}
                </span>
              )}
            </div>
          )}
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
              className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
              {t('CANCEL', 'إلغاء')}
            </button>
            <button onClick={() => setShowPriceModal(false)}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'var(--p)' }}>
              {t('SET', 'تحديد')}
            </button>
          </div>
        </Modal>
      )}

      {showTierModal && (
        <Modal onClose={() => setShowTierModal(null)} title={t('Set tier price', 'تحديد سعر المستوى')}>
          <div className="flex items-center rounded-xl border overflow-hidden mb-4"
               style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
            <span className="px-3 text-[15px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
            <input type="number" autoFocus
              value={showTierModal === 'premium' ? premiumPrice : vipPrice}
              onChange={(e) => showTierModal === 'premium' ? setPremiumPrice(e.target.value) : setVipPrice(e.target.value)}
              className="flex-1 px-2 py-3 text-[15px] font-semibold bg-transparent outline-none"
              style={{ color: 'var(--t1)' }} />
            <span className="px-3 text-[13px]" style={{ color: 'var(--t3)' }}>/{t('month', 'شهر')}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTierModal(null)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ color: 'var(--t2)' }}>
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

function PriceButton({ label, value, suffix, onClick }:
  { label: string; value: string; suffix: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 p-4 rounded-xl border text-left"
      style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
      <DollarSign size={16} style={{ color: 'var(--t2)' }} />
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--t3)' }}>{label}</p>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
          {value ? `${value} TND ${suffix}` : 'Set price'}
        </p>
      </div>
      <Edit3 size={13} style={{ color: 'var(--t3)' }} />
    </button>
  )
}

function PriceInput({ label, value, onChange, suffix }:
  { label: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--t2)' }}>{label}</label>
      <div className="flex items-center rounded-xl border overflow-hidden"
           style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
        <span className="px-3 text-[13px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-2.5 text-[14px] font-semibold text-right bg-transparent outline-none"
          style={{ color: 'var(--t1)' }} />
        <span className="px-3 text-[12px]" style={{ color: 'var(--t3)' }}>{suffix}</span>
      </div>
    </div>
  )
}

function TierCard({ title, priceLabel, onSetPrice, disabled, toggle }:
  { title: string; priceLabel: string; onSetPrice: () => void;
    disabled?: boolean; toggle?: { value: boolean; onChange: (v: boolean) => void } }) {
  return (
    <div className="p-4 rounded-2xl border relative"
         style={{ background: 'var(--bg)', borderColor: 'var(--bd)', opacity: disabled ? 0.5 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</p>
        {toggle && <Toggle checked={toggle.value} onChange={toggle.onChange} />}
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
    <button onClick={onClick} className="w-full flex items-center gap-2.5 py-2 text-left">
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

function TabsLayoutSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [vis, setVis] = useState<Record<string, boolean>>({
    courses: true, challenges: true, sessions: true, events: true, products: true,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TAB_VIS_KEY)
      if (raw) setVis(JSON.parse(raw))
    } catch {}
  }, [])

  const save = () => {
    localStorage.setItem(TAB_VIS_KEY, JSON.stringify(vis))
    onSave(t('Community tabs updated. Refresh your community view to see it.', 'تم تحديث تبويبات المجتمع. حدّث صفحة المجتمع لرؤيتها.'))
  }

  const items: [string, string][] = [
    ['courses',    t('Courses',    'الدورات')],
    ['challenges', t('Challenges', 'التحديات')],
    ['sessions',   t('Sessions',   'الجلسات')],
    ['events',     t('Events',     'الأحداث')],
    ['products',   t('Products',   'المنتجات')],
  ]

  return (
    <Card>
      <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {t('Choose which sections show up inside your community. Home is always visible.', 'اختر الأقسام التي تظهر داخل مجتمعك. الرئيسية دائماً ظاهرة.')}
      </p>
      {items.map(([k, label]) => (
        <ToggleRow key={k} icon={Layout} title={label}
          color="var(--cyan)" softColor="var(--c2)"
          checked={vis[k]} onChange={(v) => setVis({ ...vis, [k]: v })} />
      ))}
      <SaveBar onSave={save} t={t} />
    </Card>
  )
}

/* ─── RULES ────────────────────────────────────────────── */

function RulesSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [rules, setRules] = useState<string[]>([
    'Be respectful and kind to other members.',
    'No spam, self-promotion, or off-topic posts.',
    'Share your work and support others.',
  ])

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
      <SaveBar onSave={() => onSave(t('Rules saved. Members will see them from now on.', 'تم حفظ القواعد. سيراها الأعضاء من الآن.'))} t={t} />
    </Card>
  )
}

/* ─── NOTIFICATIONS ────────────────────────────────────────── */

function NotificationsSection({ t, onSave }: { t: (en: string, ar: string) => string; onSave: (m: string) => void }) {
  const [n, setN] = useState({
    newMember: true, newPost: true, newComment: true, newPurchase: true,
    weeklyDigest: false, monthlyReport: true, dmNotifs: true, mentions: true,
  })

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
          color="var(--pink)" softColor="var(--pk2)"
          checked={n[k]} onChange={(v) => setN({ ...n, [k]: v })} />
      ))}
      <SaveBar onSave={() => onSave(t('Notification preferences saved.', 'تم حفظ تفضيلات الإشعارات.'))} t={t} />
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

function FloatField({ label, counter, children }: { label: string; counter: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border px-3 pt-1.5 pb-1 relative"
         style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
      <label className="block text-[11px] font-medium" style={{ color: 'var(--t3)' }}>{label}</label>
      {children}
      <p className="text-[11px] text-right" style={{ color: 'var(--t3)' }}>{counter}</p>
    </div>
  )
}

function Divider() { return <div className="h-px" style={{ background: 'var(--bd)' }} /> }

function Toggle({ checked, onChange, color = 'var(--p)' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? color : 'var(--bd)' }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

function ToggleRow({ icon: Icon, title, hint, checked, onChange, color = 'var(--p)', softColor = 'var(--p2)' }:
  { icon: any; title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; color?: string; softColor?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: checked ? softColor : 'var(--bg)', color: checked ? color : 'var(--t3)' }}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium" style={{ color: 'var(--t1)' }}>{title}</p>
        {hint && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
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

function SmallUpload({ label, hint, value, onChange, size, aspect }:
  { label: string; hint: string; value: string; onChange: (v: string) => void; size: number; aspect: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl relative overflow-hidden flex items-center justify-center flex-shrink-0"
           style={{ background: 'var(--bg)', border: '1px solid var(--bd)', width: size, aspectRatio: aspect }}>
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[12px] font-semibold" style={{ color: 'var(--p)' }}>Import</span>
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
      <div>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{label}</p>
        <p className="text-[11px] mb-2" style={{ color: 'var(--t3)' }}>{hint}</p>
        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border"
                style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>
          {value ? 'MODIFY' : 'IMPORT'}
        </button>
      </div>
    </div>
  )
}

function NiceUploader({ label, hint, value, onChange, w, h }:
  { label: string; hint: string; value: string; onChange: (v: string) => void; w: number; h: number }) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5" style={{ width: w }}>
        <label className="text-[12px] font-medium" style={{ color: 'var(--t2)' }}>{label}</label>
      </div>

      <div className="group relative rounded-2xl border-2 border-dashed overflow-hidden transition-colors"
           style={{ width: w, height: h, borderColor: value ? 'transparent' : 'var(--bd2)', background: value ? 'transparent' : 'var(--p2)' }}>
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                 style={{ background: 'var(--white)', color: 'var(--p)' }}>
              <Upload size={14} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--p)' }}>
              Upload
            </span>
          </div>
        )}

        {value && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ background: 'rgba(0,0,0,.5)' }}>
            <label className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                   style={{ background: '#fff', color: 'var(--t1)' }}>
              <Upload size={11} /> Change
              <input type="file" accept="image/*" className="hidden" onChange={handle} />
            </label>
            <button onClick={() => onChange('')}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,.9)', color: '#ef4444' }}>
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {!value && (
          <input type="file" accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer" onChange={handle} />
        )}
      </div>

      <p className="text-[10px] mt-1.5" style={{ color: 'var(--t3)', width: w }}>{hint}</p>
    </div>
  )
}

function SaveBar({ onSave, t }: { onSave: () => void; t: (en: string, ar: string) => string }) {
  return (
    <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--bd)' }}>
      <button onClick={onSave}
        className="mt-4 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, var(--p) 0%, #a08cff 100%)',
          boxShadow: '0 8px 20px -8px var(--p)',
        }}>
        {t('Save changes', 'حفظ التغييرات')}
      </button>
    </div>
  )
}

function SuccessModal({ t, message, onClose }: { t: (en: string, ar: string) => string; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.4)', animation: 'fadeIn .2s ease' }}
         onClick={onClose}>
      <div className="rounded-2xl p-6 text-center relative flex flex-col items-center"
           style={{
             background: 'var(--white)',
             animation: 'popIn .3s ease',
             width: 380,
             minHeight: 280,
           }}
           onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
          <PartyPopper size={28} color="#fff" />
        </div>
        <h3 className="text-[17px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>
          {t('All set!', 'تم بنجاح!')}
        </h3>
        <p className="text-[13px] flex-1 flex items-center" style={{ color: 'var(--t2)' }}>
          {message}
        </p>
        <button onClick={onClose}
          className="mt-4 px-6 py-2 rounded-xl text-[13px] font-semibold text-white flex-shrink-0"
          style={{ background: 'var(--p)' }}>
          {t('Awesome', 'ممتاز')}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          0%   { transform: scale(.85); opacity: 0 }
          60%  { transform: scale(1.05); opacity: 1 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
