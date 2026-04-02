'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  ArrowLeft, Save, Globe, Lock, BookOpen, Zap, Star,
  Clock, AlertCircle, Check, Loader2, ImageIcon,
} from 'lucide-react'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     icon: BookOpen, color: 'var(--cyan)'   },
  { id: 'intermediate', label: 'Intermediate', icon: Zap,      color: 'var(--orange)' },
  { id: 'advanced',     label: 'Advanced',     icon: Star,     color: 'var(--pink)'   },
]

const inp = [
  'w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150',
  'border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]',
  'focus:outline-none focus:border-[var(--p)] focus:ring-0',
].join(' ')

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bd)', background: 'var(--white)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--bd)' }}>
        <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function ManageCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [course,   setCourse]   = useState<any>(null)

  // editable fields
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [level,       setLevel]       = useState('')
  const [duration,    setDuration]    = useState(0)
  const [price,       setPrice]       = useState(0)
  const [priceType,   setPriceType]   = useState<'free' | 'paid'>('free')
  const [isPublished, setIsPublished] = useState(false)
  const [thumbnail,   setThumbnail]   = useState('')

  useEffect(() => {
    if (!id) return
    // ── Mock: load from localStorage ─────────────────────────────────────────
    try {
      const stored = localStorage.getItem('chabaqa_mock_courses')
      const list: any[] = stored ? JSON.parse(stored) : []
      const c = list.find((x: any) => (x._id ?? x.id) === id)
      if (c) {
        setCourse(c)
        setTitle(c.title ?? '')
        setDescription(c.description ?? '')
        setLevel(c.level ?? '')
        setDuration(c.duration ?? 0)
        setPrice(c.price ?? 0)
        setPriceType(c.priceType ?? 'free')
        setIsPublished(c.isPublished ?? false)
        setThumbnail(c.thumbnail ?? '')
      } else {
        setCourse({ title: 'New Course' })
      }
    } catch {
      setError('Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [id])

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    // ── Mock: save to localStorage ────────────────────────────────────────────
    try {
      await new Promise(r => setTimeout(r, 500))
      const stored = localStorage.getItem('chabaqa_mock_courses')
      const list: any[] = stored ? JSON.parse(stored) : []
      const idx = list.findIndex((x: any) => (x._id ?? x.id) === id)
      const updated = { ...(idx >= 0 ? list[idx] : {}), _id: id, title, description, level, duration, price, priceType, isPublished, thumbnail }
      if (idx >= 0) list[idx] = updated; else list.unshift(updated)
      localStorage.setItem('chabaqa_mock_courses', JSON.stringify(list))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Manage Course" subtitle="Edit course info, settings & visibility" />

          <main className="p-7 flex-1 max-w-3xl" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => router.push('/creator/courses')}
                className="flex items-center gap-1.5 text-sm font-medium cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: 'var(--t3)' }}>
                <ArrowLeft className="w-4 h-4" /> Courses
              </button>
              <span style={{ color: 'var(--bd)' }}>/</span>
              <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--t1)' }}>
                {title || 'Course'}
              </span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--p)' }} />
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
                style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <p className="text-sm" style={{ color: '#b83232' }}>{error}</p>
              </div>
            )}

            {!loading && course && (
              <div className="space-y-5">

                {/* basic info */}
                <Section title="Basic Info" sub="Course title and description">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--t3)' }}>Title</p>
                      <Input value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Course title" className={inp} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--t3)' }}>Description</p>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)}
                        rows={4} placeholder="Course description"
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
                        style={{ borderColor: 'var(--bd)', background: 'var(--white)', color: 'var(--t1)' }}
                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--p)'}
                        onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--bd)'} />
                    </div>
                  </div>
                </Section>

                {/* thumbnail */}
                <Section title="Thumbnail" sub="Course cover image">
                  {thumbnail ? (
                    <div className="relative rounded-2xl overflow-hidden max-w-sm">
                      <img src={thumbnail} alt="" className="w-full aspect-video object-cover" />
                      <button
                        onClick={() => setThumbnail('')}
                        className="absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-bold text-white cursor-pointer"
                        style={{ background: 'rgba(0,0,0,.6)' }}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: 'var(--bg)', border: '2px dashed var(--bd)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--p2)' }}>
                        <ImageIcon className="w-5 h-5" style={{ color: 'var(--p)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>No thumbnail</p>
                        <p className="text-xs" style={{ color: 'var(--t3)' }}>Paste a URL below to set one</p>
                      </div>
                    </div>
                  )}
                  <Input value={thumbnail} onChange={e => setThumbnail(e.target.value)}
                    placeholder="https://…" className={`${inp} mt-3`} />
                </Section>

                {/* level + duration */}
                <Section title="Settings" sub="Difficulty, duration and pricing">
                  <div className="space-y-5">
                    {/* level */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--t3)' }}>Difficulty Level</p>
                      <div className="grid grid-cols-3 gap-3">
                        {LEVELS.map(lvl => {
                          const on = level === lvl.id
                          return (
                            <button key={lvl.id} type="button" onClick={() => setLevel(lvl.id)}
                              className="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150"
                              style={{ borderColor: on ? 'var(--p)' : 'var(--bd)', background: on ? 'var(--p2)' : 'var(--white)' }}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: lvl.color }}>
                                <lvl.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-[12px] font-semibold"
                                style={{ color: on ? 'var(--p)' : 'var(--t1)' }}>{lvl.label}</span>
                              {on && <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: 'var(--p)' }} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* duration + pricing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--t3)' }}>Duration (hours)</p>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--t3)' }} />
                          <Input type="number" min={1} value={duration || ''}
                            onChange={e => setDuration(parseInt(e.target.value) || 0)}
                            className={`${inp} pl-9`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--t3)' }}>Pricing</p>
                        <Select value={priceType} onValueChange={v => setPriceType(v as 'free' | 'paid')}>
                          <SelectTrigger className={inp} style={{ height: 44 }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {priceType === 'paid' && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--t3)' }}>Price (TND)</p>
                        <Input type="number" min={1} step={0.5} value={price || ''}
                          onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                          className={inp} />
                      </div>
                    )}
                  </div>
                </Section>

                {/* visibility */}
                <Section title="Visibility" sub="Control who can see your course">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true,  icon: Globe, label: 'Published', desc: 'Visible to students' },
                      { val: false, icon: Lock,  label: 'Draft',     desc: 'Hidden from students' },
                    ].map(opt => {
                      const on = isPublished === opt.val
                      return (
                        <button key={String(opt.val)} type="button" onClick={() => setIsPublished(opt.val)}
                          className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150"
                          style={{ borderColor: on ? 'var(--p)' : 'var(--bd)', background: on ? 'var(--p2)' : 'var(--white)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: on ? 'var(--p)' : 'var(--bg)' }}>
                            <opt.icon className="w-4 h-4" style={{ color: on ? '#fff' : 'var(--t3)' }} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold" style={{ color: on ? 'var(--p)' : 'var(--t1)' }}>{opt.label}</p>
                            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{opt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Section>

                {/* save bar */}
                <div className="flex items-center justify-between gap-4 py-4 px-6 rounded-2xl sticky bottom-4"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
                  {error && (
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: '#dc2626' }}>
                      <AlertCircle className="w-4 h-4" /> {error}
                    </p>
                  )}
                  {saved && !error && (
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: '#10b981' }}>
                      <Check className="w-4 h-4" /> Changes saved
                    </p>
                  )}
                  {!saved && !error && <div />}

                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:cursor-not-allowed transition-all hover:opacity-90"
                    style={{ background: 'var(--p)', boxShadow: '0 4px 16px rgba(142,120,251,.35)' }}>
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><Save className="w-4 h-4" /> Save Changes</>
                    }
                  </button>
                </div>

              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
