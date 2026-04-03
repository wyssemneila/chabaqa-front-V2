'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import EventTypeSelector, { type EventFormat } from '@/components/creator-dashboard/events/EventTypeSelector'
import TicketBuilder, { type TicketType } from '@/components/creator-dashboard/events/TicketBuilder'
import {
  ArrowLeft, Upload, ChevronDown, MapPin, Globe, Link2,
  Calendar, Clock, Users, Tag, CheckCircle2, Loader2,
  Eye, Send, FileText,
} from 'lucide-react'

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES_EN = ['Technology','Business','Design','Marketing','Education','Health','Music','Arts','Sports','Other']
const CATEGORIES_AR = ['تقنية','أعمال','تصميم','تسويق','تعليم','صحة','موسيقى','فنون','رياضة','أخرى']

// ─── Form state ───────────────────────────────────────────────────────────────
interface EventForm {
  coverPreview: string
  title: string
  description: string
  category: string
  format: EventFormat
  startDate: string; startTime: string
  endDate:   string; endTime:   string
  timezone: string
  venueName: string; address: string; city: string; country: string
  platform: string; meetLink: string
  capacity: number | 'unlimited'
  tickets: TicketType[]
}

const BLANK_FORM: EventForm = {
  coverPreview: '',
  title: '', description: '', category: '',
  format: 'online',
  startDate: '', startTime: '', endDate: '', endTime: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  venueName: '', address: '', city: '', country: '',
  platform: 'google-meet', meetLink: '',
  capacity: 'unlimited',
  tickets: [],
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputCls = `w-full h-10 px-3.5 rounded-xl border text-[13px] focus:outline-none transition-colors`
const inputStyle = { background:'var(--white)', borderColor:'var(--bd)', color:'var(--t1)' }
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = 'var(--p)')
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = 'var(--bd)')

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
      <div className="px-5 py-3.5" style={{ borderBottom:'1px solid var(--bd)' }}>
        <p className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color:'var(--t3)' }}>{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="text-[12px] font-semibold block mb-1.5" style={{ color:'var(--t2)' }}>
      {text}{required && <span style={{ color:'var(--pink)' }}> *</span>}
    </label>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [form,    setForm]    = useState<EventForm>(BLANK_FORM)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  // cover image
  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    set('coverPreview', url)
  }

  // publish / save
  const handleSubmit = async (status: 'draft' | 'published') => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    const event = { ...form, status, id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString() }
    try {
      const existing = JSON.parse(localStorage.getItem('chabaqa_events') || '[]')
      localStorage.setItem('chabaqa_events', JSON.stringify([event, ...existing]))
    } catch {}
    setSaving(false)
    setSaved(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/creator/events')
  }

  const categories = lang === 'ar' ? CATEGORIES_AR : CATEGORIES_EN
  const showOffline = form.format === 'offline' || form.format === 'hybrid'
  const showOnline  = form.format === 'online'  || form.format === 'hybrid'

  const T = {
    back:           lang==='ar'?'العودة':'Back to Events',
    titlePlaceholder: lang==='ar'?'عنوان الفعالية…':'Event title…',
    descPlaceholder:  lang==='ar'?'صِف فعاليتك للجمهور…':'Describe your event for attendees…',
    category:       lang==='ar'?'الفئة':'Category',
    format:         lang==='ar'?'صيغة الفعالية':'Event Format',
    dateTime:       lang==='ar'?'التاريخ والوقت':'Date & Time',
    start:          lang==='ar'?'البداية':'Start',
    end:            lang==='ar'?'النهاية':'End',
    timezone:       lang==='ar'?'المنطقة الزمنية':'Timezone',
    location:       lang==='ar'?'الموقع':'Location',
    venueName:      lang==='ar'?'اسم المكان':'Venue Name',
    address:        lang==='ar'?'العنوان':'Address',
    city:           lang==='ar'?'المدينة':'City',
    country:        lang==='ar'?'الدولة':'Country',
    online:         lang==='ar'?'رابط الاجتماع':'Online Meeting',
    platform:       lang==='ar'?'المنصة':'Platform',
    meetLink:       lang==='ar'?'رابط الاجتماع':'Meeting Link',
    meetPlaceholder:lang==='ar'?'https://meet.google.com/…':'https://meet.google.com/…',
    capacity:       lang==='ar'?'السعة':'Capacity',
    maxAttendees:   lang==='ar'?'الحد الأقصى للحضور':'Max Attendees',
    unlimited:      lang==='ar'?'غير محدود':'Unlimited',
    tickets:        lang==='ar'?'التذاكر':'Tickets',
    saveDraft:      lang==='ar'?'حفظ كمسودة':'Save Draft',
    publish:        lang==='ar'?'نشر الفعالية':'Publish Event',
    preview:        lang==='ar'?'معاينة':'Preview',
    cover:          lang==='ar'?'صورة الغلاف':'Cover Image',
    coverHint:      lang==='ar'?'اسحب وأفلت أو انقر للرفع (1600×900 مثالي)':'Drag & drop or click to upload (1600×900 ideal)',
    details:        lang==='ar'?'تفاصيل الفعالية':'Event Details',
    titleLabel:     lang==='ar'?'العنوان':'Title',
    descLabel:      lang==='ar'?'الوصف':'Description',
    untitled:       lang==='ar'?'فعالية بدون عنوان':'Untitled Event',
    noDate:         lang==='ar'?'التاريخ غير محدد':'Date not set',
    ticketCount:    lang==='ar'?'نوع تذكرة':'ticket type',
    ticketCountPl:  lang==='ar'?'أنواع تذاكر':'ticket types',
    publishOptions: lang==='ar'?'خيارات النشر':'Publish Options',
    saving:         lang==='ar'?'جاري الحفظ…':'Saving…',
    saved:          lang==='ar'?'تم الحفظ!':'Saved!',
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background:'var(--bg)' }}>
        <DashSidebar />

        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar
            title={lang==='ar'?'إنشاء فعالية':'Create Event'}
            subtitle={lang==='ar'?'أضف فعالية جديدة لمجتمعك':'Add a new event for your community'} />

          <main className="flex-1 p-7" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* Back */}
            <button onClick={() => router.push('/creator/events')}
              className="flex items-center gap-1.5 text-[12px] font-medium mb-6 cursor-pointer hover:opacity-60 transition-opacity"
              style={{ color:'var(--t3)' }}>
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> {T.back}
            </button>

            <div className="flex gap-6 items-start">

              {/* ── Left: form ─────────────────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* Cover image */}
                <Section title={T.cover}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative w-full rounded-2xl overflow-hidden cursor-pointer group transition-all"
                    style={{
                      height: '180px',
                      background: form.coverPreview ? 'transparent' : 'var(--bg)',
                      border: `2px dashed var(--bd)`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor='var(--p)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor='var(--bd)')}>
                    {form.coverPreview
                      ? <img src={form.coverPreview} alt="cover"
                          className="w-full h-full object-cover" />
                      : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                            style={{ background:'var(--p2)' }}>
                            <Upload className="w-5 h-5" style={{ color:'var(--p)' }} strokeWidth={1.8} />
                          </div>
                          <p className="text-[12px] font-semibold" style={{ color:'var(--t2)' }}>{T.coverHint}</p>
                        </div>
                      )}
                    {form.coverPreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                                      flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 text-[12px] font-semibold"
                          style={{ color:'var(--t1)' }}>
                          <Upload className="w-3.5 h-3.5" /> Change Cover
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
                </Section>

                {/* Event details */}
                <Section title={T.details}>
                  <div>
                    <Label text={T.titleLabel} required />
                    <input value={form.title}
                      onChange={e => set('title', e.target.value)}
                      placeholder={T.titlePlaceholder}
                      className={inputCls} style={{ ...inputStyle, fontSize:'15px', fontWeight:600 }}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <Label text={T.descLabel} />
                    <textarea value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder={T.descPlaceholder} rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] resize-none focus:outline-none transition-colors"
                      style={{ background:'var(--white)', borderColor:'var(--bd)', color:'var(--t1)' }}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <Label text={T.category} />
                    <div className="relative">
                      <select value={form.category} onChange={e => set('category', e.target.value)}
                        className={inputCls + ' pr-9 appearance-none cursor-pointer'}
                        style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                        <option value="">{lang==='ar'?'اختر فئة…':'Select a category…'}</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color:'var(--t3)' }} />
                    </div>
                  </div>
                </Section>

                {/* Format */}
                <Section title={T.format}>
                  <EventTypeSelector value={form.format} onChange={v => set('format', v)} lang={lang} />
                </Section>

                {/* Date & Time */}
                <Section title={T.dateTime}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Start */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'var(--t3)' }}>
                        {T.start}
                      </p>
                      <div>
                        <Label text={lang==='ar'?'التاريخ':'Date'} />
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color:'var(--t3)' }} />
                          <input type="date" value={form.startDate}
                            onChange={e => set('startDate', e.target.value)}
                            className={inputCls + ' pl-9'} style={inputStyle}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                      <div>
                        <Label text={lang==='ar'?'الوقت':'Time'} />
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color:'var(--t3)' }} />
                          <input type="time" value={form.startTime}
                            onChange={e => set('startTime', e.target.value)}
                            className={inputCls + ' pl-9'} style={inputStyle}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                    </div>
                    {/* End */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'var(--t3)' }}>
                        {T.end}
                      </p>
                      <div>
                        <Label text={lang==='ar'?'التاريخ':'Date'} />
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color:'var(--t3)' }} />
                          <input type="date" value={form.endDate}
                            onChange={e => set('endDate', e.target.value)}
                            className={inputCls + ' pl-9'} style={inputStyle}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                      <div>
                        <Label text={lang==='ar'?'الوقت':'Time'} />
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color:'var(--t3)' }} />
                          <input type="time" value={form.endTime}
                            onChange={e => set('endTime', e.target.value)}
                            className={inputCls + ' pl-9'} style={inputStyle}
                            onFocus={onFocus} onBlur={onBlur} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Timezone */}
                  <div>
                    <Label text={T.timezone} />
                    <div className="h-9 px-3.5 rounded-xl border flex items-center text-[12px]"
                      style={{ background:'var(--bg)', borderColor:'var(--bd)', color:'var(--t3)' }}>
                      🌍 {form.timezone}
                    </div>
                  </div>
                </Section>

                {/* Offline location */}
                {showOffline && (
                  <Section title={T.location}>
                    <div>
                      <Label text={T.venueName} />
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color:'var(--t3)' }} />
                        <input value={form.venueName}
                          onChange={e => set('venueName', e.target.value)}
                          placeholder={lang==='ar'?'مثال: قاعة أبروداكشن':'e.g. Maison de la Culture'}
                          className={inputCls + ' pl-9'} style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                    <div>
                      <Label text={T.address} />
                      <input value={form.address}
                        onChange={e => set('address', e.target.value)}
                        placeholder={lang==='ar'?'الشارع والرقم…':'Street address…'}
                        className={inputCls} style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label text={T.city} />
                        <input value={form.city}
                          onChange={e => set('city', e.target.value)}
                          placeholder={lang==='ar'?'المدينة':'City'}
                          className={inputCls} style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div>
                        <Label text={T.country} />
                        <input value={form.country}
                          onChange={e => set('country', e.target.value)}
                          placeholder={lang==='ar'?'الدولة':'Country'}
                          className={inputCls} style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                  </Section>
                )}

                {/* Online link */}
                {showOnline && (
                  <Section title={T.online}>
                    <div>
                      <Label text={T.platform} />
                      <div className="relative">
                        <select value={form.platform}
                          onChange={e => set('platform', e.target.value)}
                          className={inputCls + ' pr-9 appearance-none cursor-pointer'}
                          style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                          <option value="google-meet">Google Meet</option>
                          <option value="zoom">Zoom</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="whereby">Whereby</option>
                          <option value="custom">{lang==='ar'?'رابط مخصص':'Custom Link'}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color:'var(--t3)' }} />
                      </div>
                    </div>
                    <div>
                      <Label text={T.meetLink} />
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color:'var(--t3)' }} />
                        <input value={form.meetLink}
                          onChange={e => set('meetLink', e.target.value)}
                          placeholder={T.meetPlaceholder}
                          className={inputCls + ' pl-9'} style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                  </Section>
                )}

                {/* Capacity */}
                <Section title={T.capacity}>
                  <div>
                    <Label text={T.maxAttendees} />
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color:'var(--t3)' }} />
                        <input type="number" min={1}
                          disabled={form.capacity === 'unlimited'}
                          value={form.capacity === 'unlimited' ? '' : form.capacity}
                          placeholder={form.capacity === 'unlimited' ? '∞' : ''}
                          onChange={e => set('capacity', parseInt(e.target.value) || 1)}
                          className={inputCls + ' pl-9 w-[140px]'}
                          style={{ ...inputStyle, opacity: form.capacity==='unlimited' ? 0.4 : 1 }}
                          onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => set('capacity', form.capacity==='unlimited' ? 100 : 'unlimited')}
                          className="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                          style={{ background: form.capacity==='unlimited' ? 'var(--p)' : 'var(--bd)' }}>
                          <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                            style={{ left: form.capacity==='unlimited' ? '17px' : '2px' }} />
                        </div>
                        <span className="text-[12px] font-medium" style={{ color:'var(--t2)' }}>
                          {T.unlimited}
                        </span>
                      </label>
                    </div>
                  </div>
                </Section>

                {/* Tickets */}
                <Section title={T.tickets}>
                  <TicketBuilder
                    tickets={form.tickets}
                    onChange={t => set('tickets', t)}
                    lang={lang} />
                </Section>

              </div>

              {/* ── Right: preview + publish ────────────────────────── */}
              <div className="w-[280px] shrink-0 space-y-4 sticky top-24">

                {/* Event preview card */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                  {/* Cover preview */}
                  <div className="w-full h-[140px] relative"
                    style={{ background: form.coverPreview ? 'transparent' : 'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                    {form.coverPreview
                      ? <img src={form.coverPreview} alt="" className="w-full h-full object-cover" />
                      : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-40" strokeWidth={1.5} />
                        </div>
                      )}
                    {/* Format badge */}
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)' }}>
                      {form.format === 'online'  ? (lang==='ar'?'أونلاين':'Online')    :
                       form.format === 'offline' ? (lang==='ar'?'حضوري':'In-Person')   :
                                                   (lang==='ar'?'هجين':'Hybrid')}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <p className="text-[14px] font-bold leading-snug" style={{ color:'var(--t1)' }}>
                      {form.title || T.untitled}
                    </p>
                    {form.startDate && (
                      <p className="text-[11px] flex items-center gap-1.5" style={{ color:'var(--t3)' }}>
                        <Calendar className="w-3 h-3" strokeWidth={1.8} />
                        {form.startDate}{form.startTime && `, ${form.startTime}`}
                      </p>
                    )}
                    {!form.startDate && (
                      <p className="text-[11px]" style={{ color:'var(--t3)' }}>{T.noDate}</p>
                    )}
                    {form.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:'var(--p2)', color:'var(--p)' }}>
                        <Tag className="w-2.5 h-2.5" /> {form.category}
                      </span>
                    )}
                    {form.tickets.length > 0 && (
                      <p className="text-[11px]" style={{ color:'var(--t3)' }}>
                        🎫 {form.tickets.length} {form.tickets.length===1 ? T.ticketCount : T.ticketCountPl}
                      </p>
                    )}
                  </div>
                </div>

                {/* Publish card */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color:'var(--t3)' }}>
                    {T.publishOptions}
                  </p>

                  {saved ? (
                    <div className="flex items-center justify-center gap-2 h-10 rounded-xl"
                      style={{ background:'rgba(74,222,128,.15)', color:'#16a34a' }}>
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                      <span className="text-[12px] font-bold">{T.saved}</span>
                    </div>
                  ) : saving ? (
                    <div className="flex items-center justify-center gap-2 h-10 rounded-xl"
                      style={{ background:'var(--p2)', color:'var(--p)' }}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[12px] font-semibold">{T.saving}</span>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleSubmit('draft')}
                        className="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center
                                   gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background:'var(--bg)', border:'1px solid var(--bd)', color:'var(--t2)' }}>
                        <FileText className="w-4 h-4" strokeWidth={1.8} />
                        {T.saveDraft}
                      </button>
                      <button type="button" onClick={() => handleSubmit('published')}
                        disabled={!form.title.trim()}
                        className="w-full h-10 rounded-xl text-[12px] font-bold text-white flex items-center
                                   justify-center gap-2 cursor-pointer disabled:opacity-40
                                   disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        style={{ background:'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                        <Send className="w-4 h-4" strokeWidth={1.8} />
                        {T.publish}
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
