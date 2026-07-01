"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, ChevronRight,
  UploadCloud, FileText, Globe, Lock, DollarSign, Zap,
  Plus, Trash2, X, Users, Calendar, Clock, Star, Trophy,
  Link2, Video, Paperclip, Radio, ChevronDown, ImageIcon,
  BookOpen, Target, Layers, GripVertical,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { challengesApi, normalizeChallengeResponse } from "@/lib/api/challenges.api"

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── types ────────────────────────────────────────────────────────────────────
type ResourceType = "video" | "file" | "link" | "meeting"
type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert"
type BackendDifficultyLevel = "beginner" | "intermediate" | "advanced"

interface Resource {
  id: string
  type: ResourceType
  title: string
  url: string
  file: File | null
}

interface ChallengeStep {
  id: string
  title: string
  description: string
  deliverable: string
  instructions: string
  pointReward: number
  resources: Resource[]
}

interface FormData {
  // Step 1 — Info
  title: string
  description: string
  category: string
  banner: string
  difficulty: DifficultyLevel | ""
  durationDays: number   // actual number of days (3/7/14/30/60/90/custom)

  // Step 2 — Challenge Steps
  steps: ChallengeStep[]

  // Step 3 — Settings
  sequential: boolean
  startDate: string
  maxParticipants: number | "unlimited"
  completionReward: string
  topPerformerReward: string

  // Step 4 — Pricing
  priceType: "free" | "paid"
  price: number
  isPublished: boolean
}

// ─── constants ────────────────────────────────────────────────────────────────
const CATEGORIES  = ["Technology","Business","Design","Marketing","Education","Health","Music","Arts","Sports","Other"]
const DURATIONS   = [
  { v: 3,   l: "3 Days"   },
  { v: 7,   l: "7 Days"   },
  { v: 14,  l: "14 Days"  },
  { v: 30,  l: "30 Days"  },
  { v: 60,  l: "60 Days"  },
  { v: 90,  l: "90 Days"  },
  { v: 0,   l: "Custom"   },
]
const DIFFICULTIES = [
  { id: "beginner"     as DifficultyLevel, label: "Beginner",     desc: "No prior knowledge needed",   color: "var(--cyan)",   icon: BookOpen },
  { id: "intermediate" as DifficultyLevel, label: "Intermediate", desc: "Some experience required",    color: "var(--orange)", icon: Zap      },
  { id: "advanced"     as DifficultyLevel, label: "Advanced",     desc: "Strong skill level expected", color: "var(--p)",      icon: Target   },
  { id: "expert"       as DifficultyLevel, label: "Expert",       desc: "Master-level challenge",      color: "var(--pink)",   icon: Star     },
]
const RESOURCE_TYPES: { id: ResourceType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "video",   label: "Video",        icon: Video,     desc: "Upload or link"        },
  { id: "file",    label: "File",         icon: Paperclip, desc: "PDF, ZIP, DOC…"        },
  { id: "link",    label: "Link",         icon: Link2,     desc: "Website or article"    },
  { id: "meeting", label: "Live Session", icon: Radio,     desc: "Zoom, Meet, Teams…"    },
]

const STEPS_DEF = [
  { id: 1, label: "Info",      icon: FileText,   desc: "Title, category & banner"    },
  { id: 2, label: "Steps",     icon: Layers,     desc: "Daily challenge tasks"        },
  { id: 3, label: "Settings",  icon: Target,     desc: "Rules, rewards & schedule"   },
  { id: 4, label: "Pricing",   icon: DollarSign, desc: "Free, paid & publish"         },
] as const

const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: "Challenge Info",  sub: "Name, category, difficulty & duration"   },
  2: { title: "Challenge Steps", sub: "Build the daily tasks for each day"       },
  3: { title: "Settings",        sub: "Rules, rewards, schedule & participants"  },
  4: { title: "Pricing",         sub: "Monetize and publish your challenge"      },
}

// ─── shared styles ─────────────────────────────────────────────────────────────
const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"
const inp  = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

// ─── shared UI ────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <p className={LBL} style={{ color: "var(--t3)" }}>
        {label}{required && <span className="ml-0.5" style={{ color: "var(--p)" }}>*</span>}
      </p>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: "var(--t3)" }}>{hint}</p>}
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "var(--bd)" }}>
        <p className="text-[14px] font-bold" style={{ color: "var(--t1)" }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// THUMBNAIL UPLOAD
// ════════════════════════════════════════════════════════════════════════════════
function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const handleFile = (file: File) => { if (file.type.startsWith("image/")) onChange(URL.createObjectURL(file)) }
  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {!value ? (
        <div className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{ border: "2px dashed var(--bd)", background: "var(--bg)", minHeight: 180 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--p)" }}>
            <UploadCloud className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold mb-1" style={{ color: "var(--t1)" }}>Upload banner</p>
            <p className="text-xs" style={{ color: "var(--t3)" }}>JPG, PNG, WebP · 16:9 · Max 3 MB</p>
          </div>
          <button type="button" className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
            style={{ background: "var(--p)", color: "#fff" }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>Browse Files</button>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ border: "2px solid var(--bd)" }}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onClick={() => inputRef.current?.click()}>
          <img src={value} alt="Challenge banner preview" loading="lazy" className="w-full aspect-video object-cover block" />
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}>
              <button type="button" className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
                style={{ background: "var(--p)", color: "#fff" }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>Change</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// RESOURCE EDITOR (inside step popup)
// ════════════════════════════════════════════════════════════════════════════════
function ResourceEditor({ resource, onChange, onDelete }: {
  resource: Resource
  onChange: (r: Resource) => void
  onDelete: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof Resource, v: any) => onChange({ ...resource, [k]: v })

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--bg)", borderColor: "var(--bd)" }}>
      {/* type selector + delete */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {RESOURCE_TYPES.map(rt => {
            const on = resource.type === rt.id
            return (
              <button key={rt.id} type="button" onClick={() => set("type", rt.id)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border"
                style={{
                  background:  on ? "var(--p)"  : "var(--white)",
                  borderColor: on ? "var(--p)"  : "var(--bd)",
                  color:       on ? "#fff"       : "var(--t2)",
                }}>
                <rt.icon className="w-3 h-3" />
                {rt.label}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 shrink-0"
          style={{ background: "rgba(239,68,68,.08)", color: "#ef4444" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title field (all types) */}
      <Field label="Resource Title" required>
        <Input placeholder="e.g. Day 1 Tutorial Video" value={resource.title}
          onChange={e => set("title", e.target.value)} className={inp} />
      </Field>

      {/* Type-specific fields */}
      {resource.type === "video" && (
        <>
          <input type="file" accept="video/*" ref={videoRef} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) set("file", f) }} />
          <div className="flex gap-2">
            <button type="button" onClick={() => videoRef.current?.click()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-bold cursor-pointer transition-all border-2"
              style={{ borderColor: resource.file ? "var(--p)" : "var(--bd)", background: resource.file ? "var(--p2)" : "var(--white)", color: resource.file ? "var(--p)" : "var(--t2)" }}>
              <UploadCloud className="w-3.5 h-3.5" />
              {resource.file ? resource.file.name.slice(0, 20) + "…" : "Upload Video"}
            </button>
            <span className="text-[11px] self-center" style={{ color: "var(--t3)" }}>or</span>
            <Input placeholder="YouTube / Vimeo link" value={resource.url}
              onChange={e => set("url", e.target.value)}
              className={inp + " flex-1"} style={{ height: 36 }} />
          </div>
        </>
      )}

      {resource.type === "file" && (
        <>
          <input type="file" ref={fileRef} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) set("file", f) }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold cursor-pointer transition-all border-2 w-full"
            style={{ borderColor: resource.file ? "var(--p)" : "var(--bd)", background: resource.file ? "var(--p2)" : "var(--white)", color: resource.file ? "var(--p)" : "var(--t2)" }}>
            <Paperclip className="w-3.5 h-3.5" />
            {resource.file ? resource.file.name : "Choose File (PDF, ZIP, DOC…)"}
          </button>
        </>
      )}

      {resource.type === "link" && (
        <Input placeholder="https://…" value={resource.url}
          onChange={e => set("url", e.target.value)} className={inp} />
      )}

      {resource.type === "meeting" && (
        <Input placeholder="Zoom / Google Meet / Teams link…" value={resource.url}
          onChange={e => set("url", e.target.value)} className={inp} />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP POPUP EDITOR
// ════════════════════════════════════════════════════════════════════════════════
function StepPopup({ step, dayIndex, onSave, onClose }: {
  step: ChallengeStep
  dayIndex: number
  onSave: (s: ChallengeStep) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ChallengeStep>({ ...step, resources: [...step.resources] })
  const set = (k: keyof ChallengeStep, v: any) => setForm(p => ({ ...p, [k]: v }))

  const addResource = () => setForm(p => ({
    ...p,
    resources: [...p.resources, { id: uid(), type: "link", title: "", url: "", file: null }],
  }))
  const updateResource = (id: string, r: Resource) =>
    setForm(p => ({ ...p, resources: p.resources.map(x => x.id === id ? r : x) }))
  const deleteResource = (id: string) =>
    setForm(p => ({ ...p, resources: p.resources.filter(x => x.id !== id) }))

  const isFilled = form.title.trim() && form.description.trim()

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* panel */}
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--white)", border: "1px solid var(--bd)" }}>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--bd)", background: "var(--p2)" }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--p)" }}>
              Day {dayIndex + 1}
            </p>
            <p className="text-[15px] font-bold" style={{ color: "var(--t1)" }}>
              {form.title || `Step ${dayIndex + 1}`}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: "var(--bg)", color: "var(--t3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Step Title" required>
                <Input placeholder={`Day ${dayIndex + 1} — e.g. Set your goal`}
                  value={form.title} onChange={e => set("title", e.target.value)} className={inp} />
              </Field>
            </div>
            <Field label="Point Reward">
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "var(--orange)" }} />
                <Input type="number" min={0} placeholder="e.g. 100"
                  value={form.pointReward || ""}
                  onChange={e => set("pointReward", parseInt(e.target.value) || 0)}
                  className={inp + " pl-9"} />
              </div>
            </Field>
          </div>

          <Field label="Description" required hint={`${form.description.length} / 500`}>
            <Textarea placeholder="What is this day's challenge about?"
              value={form.description} onChange={e => set("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e  => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </Field>

          <Field label="Deliverable" hint="What participants must submit to complete this step">
            <Input placeholder="e.g. Screenshot of your completed workout tracker"
              value={form.deliverable} onChange={e => set("deliverable", e.target.value)} className={inp} />
          </Field>

          <Field label="Instructions" hint="Step-by-step guidance for participants">
            <Textarea placeholder="1. Open your app&#10;2. Navigate to…&#10;3. Submit a screenshot of…"
              value={form.instructions} onChange={e => set("instructions", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e  => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </Field>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={LBL} style={{ color: "var(--t3)" }}>Resources</p>
              <button type="button" onClick={addResource}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                style={{ background: "var(--p2)", color: "var(--p)", border: "1px solid var(--p3)" }}>
                <Plus className="w-3 h-3" strokeWidth={1.7} /> Add Resource
              </button>
            </div>
            {form.resources.length === 0 && (
              <div className="rounded-xl flex flex-col items-center justify-center py-8 gap-2"
                style={{ border: "2px dashed var(--bd)", background: "var(--bg)" }}>
                <Paperclip className="w-6 h-6 opacity-30" style={{ color: "var(--t3)" }} />
                <p className="text-[12px]" style={{ color: "var(--t3)" }}>No resources yet — click Add Resource</p>
              </div>
            )}
            <div className="space-y-3">
              {form.resources.map(r => (
                <ResourceEditor key={r.id} resource={r}
                  onChange={updated => updateResource(r.id, updated)}
                  onDelete={() => deleteResource(r.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 px-6 py-4 border-t flex items-center justify-between gap-3"
          style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          <button type="button" onClick={onClose}
            className="h-10 px-5 rounded-xl text-[13px] font-bold cursor-pointer hover:opacity-70 transition-opacity border-2"
            style={{ borderColor: "var(--bd)", color: "var(--t2)", background: "transparent" }}>
            Cancel
          </button>
          <button type="button" onClick={() => { onSave(form); onClose() }}
            disabled={!isFilled}
            className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-bold text-white cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: "var(--p)", boxShadow: isFilled ? "0 4px 16px rgba(142,120,251,.35)" : "none" }}>
            <Check className="w-4 h-4" strokeWidth={1.7} /> Save Step
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════
function Sidebar({ wizardStep, data, done }: { wizardStep: number; data: FormData; done: Set<number> }) {
  const progress  = Math.round(((wizardStep - 1) / STEPS_DEF.length) * 100)
  const filledSteps = data.steps.filter(s => s.title.trim() && s.description.trim()).length
  const diffLabel = DIFFICULTIES.find(d => d.id === data.difficulty)?.label ?? "—"

  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: "var(--white)", borderColor: "var(--bd)" }}>

      {/* banner + title */}
      <div className="p-5 border-b" style={{ borderColor: "var(--bd)" }}>
        <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background: "var(--bg)", border: "1.5px dashed var(--bd)" }}>
          {data.banner
            ? <img src={data.banner} alt="Challenge banner preview" loading="lazy" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 opacity-40">
                <Trophy className="w-6 h-6" style={{ color: "var(--t3)" }} />
                <span className="text-[10px]" style={{ color: "var(--t3)" }}>No banner</span>
              </div>
          }
        </div>
        <p className="text-[13px] font-bold leading-snug"
          style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
          {data.title || "Untitled Challenge"}
        </p>
        {(data.category || data.difficulty) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {data.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: "var(--p2)", color: "var(--p)" }}>{data.category}</span>
            )}
            {data.difficulty && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: "var(--bg)", color: "var(--t3)" }}>{diffLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* progress + stats */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--bd)" }}>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Progress</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--p)" }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--p)" }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Steps",  value: filledSteps > 0 ? `${filledSteps}/${data.steps.length}` : data.steps.length || "—" },
            { label: "Days",   value: data.durationDays || "—" },
            { label: "Price",  value: data.priceType === "free" ? "Free" : data.price > 0 ? `${data.price}` : "—" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-2 py-2.5 text-center" style={{ background: "var(--bg)" }}>
              <p className="text-[16px] font-bold leading-none" style={{ color: "var(--p)" }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--t3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* step nav */}
      <nav className="flex-1 p-4 space-y-1">
        {STEPS_DEF.map(s => {
          const isDone   = done.has(s.id) && wizardStep > s.id
          const isActive = wizardStep === s.id
          return (
            <div key={s.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 select-none"
              style={{ background: isActive ? "var(--p2)" : "transparent" }}>
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
                style={{ background: isDone ? "var(--p)" : isActive ? "var(--p)" : "var(--bg)" }}>
                {isDone
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <s.icon className="w-3.5 h-3.5" style={{ color: isActive ? "#fff" : "var(--t3)" }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight"
                  style={{ color: isActive ? "var(--p)" : isDone ? "var(--t1)" : "var(--t3)" }}>{s.label}</p>
                <p className="text-[10px]" style={{ color: "var(--t3)" }}>{s.desc}</p>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — INFO
// ════════════════════════════════════════════════════════════════════════════════
function StepInfo({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  const [customDays, setCustomDays] = useState(data.durationDays || 0)
  const isCustom = !DURATIONS.slice(0, -1).some(d => d.v === data.durationDays)

  return (
    <div className="space-y-5">
      <Card title="Challenge Info" sub="What participants will see when browsing">
        <div className="space-y-5">
          <Field label="Challenge Title" required>
            <Input placeholder="e.g. 30-Day Design Sprint Challenge"
              value={data.title} onChange={e => set("title", e.target.value)} className={inp} />
          </Field>

          <Field label="Description" required hint={`${data.description.length} / 1000`}>
            <Textarea placeholder="What's this challenge about? What will participants achieve?"
              value={data.description} onChange={e => set("description", e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e  => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </Field>

          <Field label="Category" required>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const on = data.category === c
                return (
                  <button key={c} type="button" onClick={() => set("category", c)}
                    className="h-8 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all border-2"
                    style={{ background: on ? "var(--p)" : "var(--white)", borderColor: on ? "var(--p)" : "var(--bd)", color: on ? "#fff" : "var(--t2)" }}>
                    {c}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Banner" sub="16:9 cover image · JPG, PNG, WebP">
        <ThumbnailUpload value={data.banner} onChange={v => set("banner", v)} />
      </Card>

      <Card title="Difficulty Level" sub="Who is this challenge designed for?">
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTIES.map(lvl => {
            const on = data.difficulty === lvl.id
            return (
              <button key={lvl.id} type="button" onClick={() => set("difficulty", lvl.id)}
                className="relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all text-left"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: lvl.color }}>
                  <lvl.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{lvl.label}</p>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--t3)" }}>{lvl.desc}</p>
                </div>
                {on && <Check className="w-4 h-4 absolute top-3 right-3" style={{ color: "var(--p)" }} />}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="Challenge Duration" sub="How many days will this challenge last?">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DURATIONS.map(d => {
            const on = d.v === 0 ? isCustom : data.durationDays === d.v
            return (
              <button key={d.v} type="button"
                onClick={() => {
                  if (d.v === 0) { set("durationDays", customDays || 1) }
                  else           { set("durationDays", d.v) }
                }}
                className="h-10 rounded-xl text-[13px] font-bold cursor-pointer transition-all border-2"
                style={{ background: on ? "var(--p)" : "var(--white)", borderColor: on ? "var(--p)" : "var(--bd)", color: on ? "#fff" : "var(--t2)" }}>
                {d.l}
              </button>
            )
          })}
        </div>
        {isCustom && (
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 160 }}>
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--t3)" }} />
              <Input type="number" min={1} max={365} placeholder="e.g. 21"
                value={customDays || ""}
                onChange={e => {
                  const v = parseInt(e.target.value) || 0
                  setCustomDays(v)
                  set("durationDays", v)
                }}
                className={inp + " pl-9"} />
            </div>
            <p className="text-[12px]" style={{ color: "var(--t3)" }}>days (1–365)</p>
          </div>
        )}
        {data.durationDays > 0 && (
          <p className="text-[12px] mt-3 font-semibold" style={{ color: "var(--p)" }}>
            → This will generate {data.durationDays} challenge step{data.durationDays !== 1 ? "s" : ""} in Step 2
          </p>
        )}
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — CHALLENGE STEPS
// ════════════════════════════════════════════════════════════════════════════════
function StepSteps({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  const [openStepId, setOpenStepId] = useState<string | null>(null)

  const openStep = data.steps.find(s => s.id === openStepId) ?? null
  const openIdx  = data.steps.findIndex(s => s.id === openStepId)

  const saveStep = (updated: ChallengeStep) => {
    set("steps", data.steps.map(s => s.id === updated.id ? updated : s))
  }

  const filledCount = data.steps.filter(s => s.title.trim() && s.description.trim()).length

  return (
    <div className="space-y-4">
      {/* header summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold" style={{ color: "var(--t1)" }}>
            {data.durationDays} day{data.durationDays !== 1 ? "s" : ""} · {data.steps.length} steps
          </p>
          <p className="text-[11px]" style={{ color: "var(--t3)" }}>
            {filledCount} of {data.steps.length} completed · click any step to edit
          </p>
        </div>
        {filledCount === data.steps.length && data.steps.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(74,222,128,.12)", color: "#16a34a" }}>
            <Check className="w-3.5 h-3.5" strokeWidth={1.7} /> All done
          </span>
        )}
      </div>

      {/* step cards grid */}
      <div className="space-y-2">
        {data.steps.map((s, i) => {
          const filled = s.title.trim() && s.description.trim()
          const points = s.pointReward > 0 ? `${s.pointReward} pts` : null
          const resCount = s.resources.length

          return (
            <button key={s.id} type="button" onClick={() => setOpenStepId(s.id)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all text-left group"
              style={{
                borderColor: filled ? "rgba(74,222,128,.4)" : "var(--bd)",
                background:  filled ? "rgba(74,222,128,.05)" : "var(--white)",
                boxShadow:   "none",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,.07)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>

              {/* day badge */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: filled ? "rgba(74,222,128,.15)" : "var(--bg)",
                  border: filled ? "1.5px solid rgba(74,222,128,.4)" : "1.5px solid var(--bd)",
                }}>
                {filled
                  ? <Check className="w-4 h-4" style={{ color: "#16a34a" }} strokeWidth={1.7} />
                  : <span className="text-[12px] font-black tabular-nums" style={{ color: "var(--t3)" }}>{i + 1}</span>
                }
              </div>

              {/* content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate"
                  style={{ color: filled ? "var(--t1)" : "var(--t3)" }}>
                  {filled ? s.title : `Day ${i + 1} — click to edit`}
                </p>
                {filled && (
                  <div className="flex items-center gap-3 mt-0.5">
                    {points && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--orange)" }}>
                        <Star className="w-3 h-3" strokeWidth={1.7} /> {points}
                      </span>
                    )}
                    {resCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--t3)" }}>
                        <Paperclip className="w-3 h-3" strokeWidth={1.7} /> {resCount} resource{resCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {s.deliverable && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--t3)" }}>
                        <Target className="w-3 h-3" strokeWidth={1.7} /> deliverable set
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* edit arrow */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:opacity-100 opacity-0"
                style={{ background: "var(--p2)", color: "var(--p)" }}>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )
        })}
      </div>

      {/* popup */}
      {openStep && (
        <StepPopup
          step={openStep}
          dayIndex={openIdx}
          onSave={saveStep}
          onClose={() => setOpenStepId(null)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — SETTINGS
// ════════════════════════════════════════════════════════════════════════════════
function StepSettings({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">

      {/* Sequential progression */}
      <Card title="Progression Mode" sub="How participants move through challenge steps">
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              val: true,
              label: "Sequential",
              desc: "Each step unlocks after the previous one is completed",
              icon: Layers,
              color: "var(--p)",
            },
            {
              val: false,
              label: "Open Access",
              desc: "All steps are available from day one",
              icon: Globe,
              color: "var(--cyan)",
            },
          ] as const).map(opt => {
            const on = data.sequential === opt.val
            return (
              <button key={String(opt.val)} type="button" onClick={() => set("sequential", opt.val)}
                className="flex flex-col gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all text-left"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: on ? opt.color : "var(--bg)" }}>
                  <opt.icon className="w-4 h-4" style={{ color: on ? "#fff" : "var(--t3)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{opt.label}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--t3)" }}>{opt.desc}</p>
                </div>
                {on && <Check className="w-4 h-4 self-end" style={{ color: "var(--p)" }} />}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Schedule */}
      <Card title="Schedule" sub="When does the challenge start?">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" required>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--t3)" }} />
              <Input type="date" value={data.startDate}
                onChange={e => set("startDate", e.target.value)}
                className={inp + " pl-9"} />
            </div>
          </Field>
          <Field label="Max Participants">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "var(--t3)" }} />
                <Input type="number" min={1}
                  disabled={data.maxParticipants === "unlimited"}
                  value={data.maxParticipants === "unlimited" ? "" : data.maxParticipants}
                  placeholder={data.maxParticipants === "unlimited" ? "∞" : "e.g. 100"}
                  onChange={e => set("maxParticipants", parseInt(e.target.value) || 1)}
                  className={inp + " pl-9"}
                  style={{ opacity: data.maxParticipants === "unlimited" ? 0.4 : 1 }} />
              </div>
              <button type="button"
                onClick={() => set("maxParticipants", data.maxParticipants === "unlimited" ? 100 : "unlimited")}
                className="h-11 px-3 rounded-xl text-[11px] font-bold cursor-pointer transition-all border-2 shrink-0"
                style={{
                  borderColor: data.maxParticipants === "unlimited" ? "var(--p)" : "var(--bd)",
                  background:  data.maxParticipants === "unlimited" ? "var(--p2)" : "var(--white)",
                  color:       data.maxParticipants === "unlimited" ? "var(--p)" : "var(--t2)",
                }}>
                ∞ Unlimited
              </button>
            </div>
          </Field>
        </div>
      </Card>

      {/* Rewards */}
      <Card title="Rewards" sub="What participants earn for completing the challenge">
        <div className="space-y-4">
          <Field label="Completion Reward" hint="What every finisher receives">
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--orange)" }} />
              <Input placeholder="e.g. Certificate of completion + 500 bonus points"
                value={data.completionReward}
                onChange={e => set("completionReward", e.target.value)}
                className={inp + " pl-9"} />
            </div>
          </Field>
          <Field label="Top Performer Reward" hint="Prize for #1 ranked participant">
            <div className="relative">
              <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--pink)" }} />
              <Input placeholder="e.g. Free 1-on-1 mentorship session + premium badge"
                value={data.topPerformerReward}
                onChange={e => set("topPerformerReward", e.target.value)}
                className={inp + " pl-9"} />
            </div>
          </Field>
        </div>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — PRICING
// ════════════════════════════════════════════════════════════════════════════════
const PRICING_OPTS = [
  { id: "free" as const, icon: Users,      label: "Free",  sub: "Anyone can join — maximize participation",     color: "var(--cyan)"   },
  { id: "paid" as const, icon: DollarSign, label: "Paid",  sub: "Set an entry fee to earn from your challenge", color: "var(--orange)" },
]
function StepPricing({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Pricing Model" sub="You can change this after publishing">
        <div className="space-y-3">
          {PRICING_OPTS.map(opt => {
            const on = data.priceType === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => set("priceType", opt.id)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all text-left"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: opt.color }}>
                  <opt.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{opt.sub}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p)" : "transparent" }}>
                  {on && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {data.priceType === "paid" && (
        <Card title="Entry Fee" sub="Participants pay once to join the challenge">
          <div className="flex items-center gap-4">
            <div className="flex h-12 rounded-xl border-2 overflow-hidden"
              style={{ borderColor: "var(--p)", background: "var(--white)" }}>
              <span className="flex items-center px-4 text-sm font-bold border-r select-none"
                style={{ background: "var(--p2)", color: "var(--p)", borderColor: "var(--p)" }}>TND</span>
              <input type="number" min={1} step={0.5} placeholder="0.00"
                value={data.price || ""}
                onChange={e => set("price", parseFloat(e.target.value) || 0)}
                className="w-32 h-full px-4 text-lg font-bold bg-transparent outline-none"
                style={{ color: "var(--t1)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--t3)" }}>Entry fee per participant</p>
          </div>
        </Card>
      )}

      <Card title="Publishing" sub="When will this challenge go live?">
        <div className="grid grid-cols-2 gap-3">
          {([
            { val: true,  icon: Globe, label: "Publish Now",   desc: "Visible and joinable immediately"    },
            { val: false, icon: Lock,  label: "Save as Draft", desc: "Publish manually when ready"         },
          ] as const).map(opt => {
            const on = data.isPublished === opt.val
            return (
              <button key={String(opt.val)} type="button" onClick={() => set("isPublished", opt.val)}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: on ? "var(--p)" : "var(--bg)" }}>
                  <opt.icon className="w-4 h-4" style={{ color: on ? "#fff" : "var(--t3)" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{opt.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--t3)" }}>{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ════════════════════════════════════════════════════════════════════════════════
function SuccessScreen() {
  useEffect(() => {
    let iv: number
    ;(async () => {
      const confetti = (await import('canvas-confetti')).default
      const colors   = ["#8e78fb","#fb923c","#22d3ee","#f472b6","#a78bfa","#ffffff"]
      const defaults = { startVelocity:30, spread:360, ticks:80, zIndex:9999, colors }
      const rand     = (a:number, b:number) => Math.random()*(b-a)+a
      const end      = Date.now() + 3500
      iv             = window.setInterval(() => {
        const left = end - Date.now()
        if (left <= 0) return clearInterval(iv)
        const n = 60*(left/3500)
        confetti({ ...defaults, particleCount:n, origin:{ x:rand(.1,.3), y:Math.random()-.2 } })
        confetti({ ...defaults, particleCount:n, origin:{ x:rand(.7,.9), y:Math.random()-.2 } })
      }, 250)
    })()
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <style>{`
        @keyframes popIn   { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUpS { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background:"var(--p)", boxShadow:"0 12px 40px rgba(142,120,251,.5)", animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both" }}>
        <Trophy className="w-10 h-10 text-white" strokeWidth={1.7} />
      </div>
      <div className="text-center" style={{ animation:"fadeUpS .5s .2s ease both" }}>
        <h2 className="text-2xl font-bold mb-1" style={{ color:"var(--t1)" }}>Challenge Created!</h2>
        <p className="text-sm" style={{ color:"var(--t3)" }}>Redirecting to your challenges…</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN FORM
// ════════════════════════════════════════════════════════════════════════════════
function buildSteps(count: number, existing: ChallengeStep[]): ChallengeStep[] {
  return Array.from({ length: count }, (_, i) =>
    existing[i] ?? { id: uid(), title: "", description: "", deliverable: "", instructions: "", pointReward: 0, resources: [] }
  )
}

export function CreateChallengeForm() {
  const router = useRouter()
  const { selectedCommunity } = useCreatorCommunity()

  const [wizardStep,   setWizardStep]   = useState(1)
  const [error,        setError]        = useState("")
  const [success,      setSuccess]      = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [done]                          = useState<Set<number>>(new Set())

  const [data, setData] = useState<FormData>({
    title: "", description: "", category: "", banner: "", difficulty: "", durationDays: 7,
    steps: buildSteps(7, []),
    sequential: true, startDate: "", maxParticipants: "unlimited",
    completionReward: "", topPerformerReward: "",
    priceType: "free", price: 0, isPublished: true,
  })

  // Rebuild steps array whenever durationDays changes
  const set = (field: keyof FormData, value: any) => {
    setData(prev => {
      const next = { ...prev, [field]: value }
      if (field === "durationDays" && typeof value === "number" && value > 0) {
        next.steps = buildSteps(value, prev.steps)
      }
      return next
    })
  }

  const blocker = (): string => {
    if (wizardStep === 1) {
      if (!data.title.trim())       return "Add a challenge title to continue"
      if (!data.description.trim()) return "Add a description to continue"
      if (!data.category)           return "Select a category to continue"
      if (!data.difficulty)         return "Select a difficulty level to continue"
      if (!data.durationDays)       return "Set a challenge duration to continue"
      return ""
    }
    if (wizardStep === 2) {
      const filledCount = data.steps.filter(s => s.title.trim() && s.description.trim()).length
      if (filledCount < data.steps.length)
        return `Complete all ${data.steps.length} steps (${filledCount} done)`
      return ""
    }
    if (wizardStep === 3) {
      if (!data.startDate) return "Set a start date to continue"
      return ""
    }
    if (wizardStep === 4) {
      if (data.priceType === "paid" && data.price <= 0) return "Set an entry fee to continue"
      return ""
    }
    return ""
  }

  const canContinue = () => blocker() === ""

  const goNext = () => {
    if (canContinue()) { done.add(wizardStep); setWizardStep(s => s + 1) }
  }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      const communitySlug = selectedCommunity?.slug
      if (!communitySlug) throw new Error("Select a community before creating a challenge.")

      const start = new Date(data.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + Math.max(1, data.durationDays) - 1)
      const difficulty: BackendDifficultyLevel = data.difficulty === "expert" ? "advanced" : (data.difficulty || "beginner")

      setSubmitStatus("Creating challenge…")
      const created = await challengesApi.create({
        title: data.title,
        description: data.description,
        communitySlug,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        category: data.category,
        difficulty,
        duration: `${data.durationDays} days`,
        thumbnail: data.banner || undefined,
        maxParticipants: data.maxParticipants === "unlimited" ? undefined : Number(data.maxParticipants),
        sequentialProgression: data.sequential,
        participationFee: data.priceType === "paid" ? Number(data.price || 0) : 0,
        currency: "TND",
        isActive: false,
        resources: [],
        tasks: data.steps.map((step, index) => ({
          day: index + 1,
          title: step.title,
          description: step.description,
          deliverable: step.deliverable || step.description,
          points: Number(step.pointReward || 0),
          instructions: step.instructions || undefined,
          resources: step.resources
            .filter(resource => resource.url.trim())
            .map((resource, resourceIndex) => ({
              title: resource.title,
              type: resource.type === "meeting" ? "tool" : resource.type === "file" ? "article" : resource.type === "link" ? "article" : resource.type,
              url: resource.url,
              description: undefined,
              order: resourceIndex,
            })),
        })),
      })

      const challenge = normalizeChallengeResponse(created)
      const challengeId = challenge?._id || challenge?.id
      if (data.isPublished && challengeId) {
        setSubmitStatus("Publishing…")
        await challengesApi.publish(challengeId)
      }

      setSuccess(true)
      setTimeout(() => router.push("/creator/challenges"), 2800)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false); setSubmitStatus("")
    }
  }

  if (success) return <SuccessScreen />

  const isCurriculum = wizardStep === 2

  return (
    <div className="flex flex-1 h-full overflow-hidden" style={{ minHeight: 0 }}>
      <Sidebar wizardStep={wizardStep} data={data} done={done} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* topbar */}
        <div className="px-8 py-4 border-b shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button type="button" onClick={() => router.push("/creator/challenges")}
                className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
                style={{ color: "var(--t3)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Challenges
              </button>
              <ChevronRight className="w-3 h-3" style={{ color: "var(--bd)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--t2)" }}>New Challenge</span>
            </div>
            <h1 className="text-[15px] font-bold" style={{ color: "var(--t1)" }}>{STEP_META[wizardStep].title}</h1>
            <p className="text-[11px]" style={{ color: "var(--t3)" }}>{STEP_META[wizardStep].sub}</p>
          </div>
          <span className="text-[11px] font-bold tabular-nums px-3 py-1 rounded-full"
            style={{ background: "var(--p2)", color: "var(--p)" }}>
            {wizardStep} / {STEPS_DEF.length}
          </span>
        </div>

        {/* content */}
        <div className={`flex-1 overflow-y-auto ${isCurriculum ? "px-8 py-6" : "px-8 py-7"}`}>
          {wizardStep === 1 && <StepInfo     data={data} set={set} />}
          {wizardStep === 2 && <StepSteps    data={data} set={set} />}
          {wizardStep === 3 && <StepSettings data={data} set={set} />}
          {wizardStep === 4 && <StepPricing  data={data} set={set} />}
        </div>

        {/* bottom nav */}
        <div className="shrink-0 border-t" style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          {error && (
            <div className="px-8 py-3 flex items-start gap-2.5 border-b"
              style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
              <p className="text-[13px] font-medium flex-1" style={{ color: "#b83232" }}>{error}</p>
              <button type="button" onClick={() => setError("")}
                className="text-[12px] font-bold underline cursor-pointer shrink-0" style={{ color: "#dc2626" }}>
                Dismiss
              </button>
            </div>
          )}

          <div className="px-8 py-4 flex items-center justify-between">
            {wizardStep > 1
              ? <button type="button" onClick={() => setWizardStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  style={{ border: "2px solid var(--bd)", color: "var(--t2)", background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              : <div />
            }

            {!canContinue() && !error && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f59e0b" }} />
                <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>{blocker()}</p>
              </div>
            )}
            {canContinue() && !error && <div />}

            <button type="button"
              onClick={wizardStep === STEPS_DEF.length ? submit : goNext}
              disabled={!canContinue() || submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer
                         disabled:cursor-not-allowed transition-all"
              style={{
                background: canContinue() && !submitting ? "var(--p)" : "var(--p3)",
                opacity:    canContinue() && !submitting ? 1 : 0.45,
                boxShadow:  canContinue() && !submitting ? "0 4px 16px rgba(142,120,251,.4)" : "none",
              }}>
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {submitStatus || "Creating…"}
                </>
              ) : wizardStep === STEPS_DEF.length ? (
                <>{data.isPublished ? "Publish Challenge" : "Save as Draft"} <Check className="w-4 h-4" /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
