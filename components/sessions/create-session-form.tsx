"use client"

import confetti from "canvas-confetti"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, Clock, DollarSign,
  Globe, Lock, AlertCircle, Calendar, Plus, X,
  ChevronRight, ImageIcon, Video, FileText, Users,
  ChevronDown, Zap,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── types ────────────────────────────────────────────────────────────────────
interface TimeSlot     { id: string; time: string }
interface DaySchedule  { day: string; label: string; slots: TimeSlot[] }
interface FormData {
  title:        string
  description:  string
  requirements: string
  banner:       string
  duration:     number
  price:        number
  priceType:    "free" | "paid"
  availability: DaySchedule[]
  isPublished:  boolean
}

// ─── constants ────────────────────────────────────────────────────────────────
const DAYS: { day: string; label: string; short: string }[] = [
  { day: "monday",    label: "Monday",    short: "Mon" },
  { day: "tuesday",   label: "Tuesday",   short: "Tue" },
  { day: "wednesday", label: "Wednesday", short: "Wed" },
  { day: "thursday",  label: "Thursday",  short: "Thu" },
  { day: "friday",    label: "Friday",    short: "Fri" },
  { day: "saturday",  label: "Saturday",  short: "Sat" },
  { day: "sunday",    label: "Sunday",    short: "Sun" },
]

const DURATIONS = [
  { value: 30,  label: "30 min",  desc: "Quick"    },
  { value: 45,  label: "45 min",  desc: "Standard" },
  { value: 60,  label: "1 hr",    desc: "Full"     },
  { value: 90,  label: "90 min",  desc: "Deep"     },
  { value: 120, label: "2 hrs",   desc: "Extended" },
]

const STEPS = [
  { id: 1, label: "Session Info",   icon: FileText,   desc: "Title, description & banner" },
  { id: 2, label: "Details",        icon: Clock,      desc: "Duration & requirements"     },
  { id: 3, label: "Availability",   icon: Calendar,   desc: "Your weekly schedule"        },
  { id: 4, label: "Pricing",        icon: DollarSign, desc: "Set your rate"               },
] as const

const inp = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"

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

// ─── thumbnail upload ──────────────────────────────────────────────────────────
function BannerUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"url" | "upload">("url")
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["url", "upload"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            style={{
              background: tab === t ? "var(--p)" : "var(--bg)",
              color:      tab === t ? "#fff"     : "var(--t3)",
            }}>
            {t === "url" ? "URL" : "Upload"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <Input value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://…" className={inp} />
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
          style={{ borderColor: "var(--bd)", background: "var(--bg)" }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) onChange(URL.createObjectURL(file))
          }}>
          <ImageIcon className="w-7 h-7 opacity-30" style={{ color: "var(--t3)" }} />
          <p className="text-[12px] font-medium" style={{ color: "var(--t3)" }}>
            Drop image or <span style={{ color: "var(--p)" }}>browse</span>
          </p>
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)) }} />
        </label>
      )}

      {value && (
        <div className="relative rounded-xl overflow-hidden">
          <img src={value} alt="" className="w-full aspect-video object-cover" />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold text-white cursor-pointer"
            style={{ background: "rgba(0,0,0,.55)" }}>
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — SESSION INFO
// ════════════════════════════════════════════════════════════════════════════════
function StepInfo({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Session Info" sub="What students will see when browsing">
        <div className="space-y-5">
          <Field label="Session Title" required>
            <Input placeholder="e.g. 1-on-1 Business Strategy Call"
              value={data.title} onChange={e => set("title", e.target.value)} className={inp} />
          </Field>
          <Field label="Description" required hint={`${data.description.length} / 1000`}>
            <Textarea
              placeholder="What will you cover? What can students expect from this session?"
              value={data.description} onChange={e => set("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
              onFocus={e  => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e   => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </Field>
        </div>
      </Card>

      <Card title="Banner" sub="Cover image shown on your session card">
        <BannerUpload value={data.banner} onChange={v => set("banner", v)} />
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — DETAILS
// ════════════════════════════════════════════════════════════════════════════════
function StepDetails({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Session Duration" sub="How long is each session?">
        <div className="grid grid-cols-5 gap-2.5">
          {DURATIONS.map(d => {
            const on = data.duration === d.value
            return (
              <button key={d.value} type="button" onClick={() => set("duration", d.value)}
                className="flex flex-col items-center gap-1 py-4 rounded-2xl border-2 cursor-pointer transition-all duration-150"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <Clock className="w-4 h-4" style={{ color: on ? "var(--p)" : "var(--t3)" }} />
                <span className="text-[13px] font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{d.label}</span>
                <span className="text-[10px]" style={{ color: on ? "var(--p)" : "var(--t3)" }}>{d.desc}</span>
                {on && <Check className="w-3 h-3" style={{ color: "var(--p)" }} />}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="Requirements" sub="What should students know or prepare before booking?">
        <Textarea
          placeholder="e.g. Basic knowledge of React, have a project idea ready, laptop required…"
          value={data.requirements} onChange={e => set("requirements", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
          style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
          onFocus={e  => (e.target as HTMLElement).style.borderColor = "var(--p)"}
          onBlur={e   => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
        <p className="text-[11px] mt-1.5" style={{ color: "var(--t3)" }}>
          Leave empty if there are no special requirements.
        </p>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — AVAILABILITY
// ════════════════════════════════════════════════════════════════════════════════
function DayRow({ schedule, onToggle, onAddSlot, onRemoveSlot, onChangeSlot }: {
  schedule:       DaySchedule
  onToggle:       () => void
  onAddSlot:      () => void
  onRemoveSlot:   (slotId: string) => void
  onChangeSlot:   (slotId: string, time: string) => void
}) {
  const active = schedule.slots.length > 0
  const ref    = useRef<HTMLDivElement>(null)

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ border: `2px solid ${active ? "var(--p)" : "var(--bd)"}`, background: active ? "var(--p2)" : "var(--white)" }}>

      {/* day header */}
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{ background: "transparent" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            style={{ background: active ? "var(--p)" : "var(--bg)" }}>
            <Calendar className="w-4 h-4" style={{ color: active ? "#fff" : "var(--t3)" }} />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold" style={{ color: active ? "var(--p)" : "var(--t1)" }}>
              {schedule.label}
            </p>
            <p className="text-[11px]" style={{ color: active ? "var(--p)" : "var(--t3)" }}>
              {active ? `${schedule.slots.length} slot${schedule.slots.length !== 1 ? "s" : ""}` : "Not available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {active && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--p)", color: "#fff" }}>
              Active
            </span>
          )}
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{ borderColor: active ? "var(--p)" : "var(--bd)", background: active ? "var(--p)" : "transparent" }}>
            {active && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      </button>

      {/* time slots — animated expand */}
      <div ref={ref}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: active ? `${(schedule.slots.length + 1) * 64 + 48}px` : "0px" }}>
        <div className="px-5 pb-5 space-y-2.5 border-t" style={{ borderColor: "rgba(142,120,251,.15)" }}>
          <div className="pt-4 space-y-2.5">
            {schedule.slots.map(slot => (
              <div key={slot.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 h-11 px-4 rounded-xl border-2 transition-colors"
                  style={{ borderColor: "var(--p)", background: "var(--white)" }}>
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p)" }} />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={e => onChangeSlot(slot.id, e.target.value)}
                    className="flex-1 text-sm font-medium bg-transparent outline-none border-none"
                    style={{ color: "var(--t1)" }}
                  />
                </div>
                <button type="button" onClick={() => onRemoveSlot(slot.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                  style={{ background: "#fef2f2", border: "1.5px solid #fca5a5" }}>
                  <X className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                </button>
              </div>
            ))}
          </div>

          {/* add slot */}
          <button type="button" onClick={onAddSlot}
            className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150"
            style={{ borderColor: "var(--p)", color: "var(--p)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(142,120,251,.08)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[12px] font-bold">Add time slot</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function StepAvailability({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  const toggle = (day: string) => {
    const exists = data.availability.find(d => d.day === day)
    if (exists) {
      set("availability", data.availability.filter(d => d.day !== day))
    } else {
      const meta = DAYS.find(d => d.day === day)!
      set("availability", [
        ...data.availability,
        { day, label: meta.label, slots: [{ id: uid(), time: "09:00" }] },
      ])
    }
  }

  const addSlot = (day: string) => {
    set("availability", data.availability.map(d =>
      d.day === day ? { ...d, slots: [...d.slots, { id: uid(), time: "10:00" }] } : d
    ))
  }

  const removeSlot = (day: string, slotId: string) => {
    set("availability", data.availability.map(d =>
      d.day === day
        ? d.slots.length === 1
          ? null
          : { ...d, slots: d.slots.filter(s => s.id !== slotId) }
        : d
    ).filter(Boolean) as DaySchedule[])
  }

  const changeSlot = (day: string, slotId: string, time: string) => {
    set("availability", data.availability.map(d =>
      d.day === day
        ? { ...d, slots: d.slots.map(s => s.id === slotId ? { ...s, time } : s) }
        : d
    ))
  }

  const totalSlots = data.availability.reduce((n, d) => n + d.slots.length, 0)

  return (
    <div className="space-y-5">
      {/* day picker */}
      <div className="rounded-2xl p-5" style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--t3)" }}>
          Select Available Days
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(d => {
            const on = !!data.availability.find(a => a.day === d.day)
            return (
              <button key={d.day} type="button" onClick={() => toggle(d.day)}
                className="flex flex-col items-center gap-1 w-[52px] py-3 rounded-2xl border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: on ? "var(--p)" : "var(--bd)",
                  background:  on ? "var(--p)" : "var(--bg)",
                  transform:   on ? "translateY(-2px)" : "none",
                  boxShadow:   on ? "0 4px 16px rgba(142,120,251,.3)" : "none",
                }}>
                <span className="text-[11px] font-bold" style={{ color: on ? "#fff" : "var(--t2)" }}>
                  {d.short}
                </span>
                {on && <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />}
              </button>
            )
          })}
        </div>

        {totalSlots > 0 && (
          <p className="text-[11px] mt-4 font-medium" style={{ color: "var(--p)" }}>
            {data.availability.length} days · {totalSlots} total slot{totalSlots !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* day rows */}
      {data.availability.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 rounded-2xl"
          style={{ border: "2px dashed var(--bd)", background: "var(--white)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--p2)" }}>
            <Calendar className="w-6 h-6" style={{ color: "var(--p)" }} />
          </div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--t2)" }}>No days selected yet</p>
          <p className="text-[11px]" style={{ color: "var(--t3)" }}>Tap a day above to add your availability</p>
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.filter(d => data.availability.find(a => a.day === d.day)).map(d => {
            const schedule = data.availability.find(a => a.day === d.day)!
            return (
              <DayRow key={d.day}
                schedule={schedule}
                onToggle={() => toggle(d.day)}
                onAddSlot={() => addSlot(d.day)}
                onRemoveSlot={slotId => removeSlot(d.day, slotId)}
                onChangeSlot={(slotId, time) => changeSlot(d.day, slotId, time)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — PRICING
// ════════════════════════════════════════════════════════════════════════════════
function StepPricing({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Session Rate" sub="How much do you charge per session?">
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { val: "free", label: "Free",      desc: "Open to everyone", icon: Users },
            { val: "paid", label: "Paid",       desc: "Charge per booking", icon: DollarSign },
          ] as const).map(opt => {
            const on = data.priceType === opt.val
            return (
              <button key={opt.val} type="button" onClick={() => set("priceType", opt.val)}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150"
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

        {data.priceType === "paid" && (
          <div style={{ animation: "fadeUp .25s ease both" }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
            <Field label="Price per session (TND)" required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold select-none"
                  style={{ color: "var(--t3)" }}>TND</span>
                <Input type="number" min={1} step={1}
                  value={data.price || ""} onChange={e => set("price", parseFloat(e.target.value) || 0)}
                  className={`${inp} pl-16`} placeholder="0" />
              </div>
            </Field>
          </div>
        )}
      </Card>

      <Card title="Visibility" sub="Who can see and book this session?">
        <div className="grid grid-cols-2 gap-3">
          {([
            { val: true,  icon: Globe, label: "Published", desc: "Visible to everyone"  },
            { val: false, icon: Lock,  label: "Draft",      desc: "Hidden — not bookable" },
          ] as const).map(opt => {
            const on = data.isPublished === opt.val
            return (
              <button key={String(opt.val)} type="button" onClick={() => set("isPublished", opt.val)}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150"
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
    const colors   = ["#8e78fb", "#fb923c", "#22d3ee", "#f472b6", "#a78bfa", "#ffffff"]
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
    const randIn   = (min: number, max: number) => Math.random() * (max - min) + min
    const end      = Date.now() + 3500
    const iv       = window.setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) return clearInterval(iv)
      const n = 60 * (left / 3500)
      confetti({ ...defaults, particleCount: n, origin: { x: randIn(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount: n, origin: { x: randIn(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <style>{`
        @keyframes popIn  { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUpS{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--p)", boxShadow: "0 12px 40px rgba(142,120,251,.5)", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1) both" }}>
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </div>
      <div className="text-center" style={{ animation: "fadeUpS .5s .2s ease both" }}>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--t1)" }}>Session Live!</h2>
        <p className="text-sm" style={{ color: "var(--t3)" }}>Redirecting to your sessions…</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════
function Sidebar({ data, step, done }: { data: FormData; step: number; done: Set<number> }) {
  const progress    = Math.round(((step - 1) / STEPS.length) * 100)
  const totalSlots  = data.availability.reduce((n, d) => n + d.slots.length, 0)
  const activeDays  = data.availability.length

  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: "var(--white)", borderColor: "var(--bd)" }}>

      {/* banner preview */}
      <div className="p-5 border-b" style={{ borderColor: "var(--bd)" }}>
        <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background: "var(--bg)", border: "1.5px dashed var(--bd)" }}>
          {data.banner
            ? <img src={data.banner} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 opacity-40">
                <Video className="w-6 h-6" style={{ color: "var(--t3)" }} />
                <span className="text-[10px]" style={{ color: "var(--t3)" }}>No banner</span>
              </div>
          }
        </div>

        <p className="text-[13px] font-bold leading-snug"
          style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
          {data.title || "Untitled Session"}
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {data.duration > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: "var(--p2)", color: "var(--p)" }}>
              <Clock className="w-2.5 h-2.5" />
              {data.duration >= 60 ? `${data.duration / 60}h` : `${data.duration}min`}
            </span>
          )}
          {data.priceType === "paid" && data.price > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: "rgba(251,146,60,.15)", color: "var(--orange)" }}>
              {data.price} TND
            </span>
          )}
          {data.priceType === "free" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: "rgba(34,211,238,.15)", color: "var(--cyan)" }}>
              Free
            </span>
          )}
        </div>
      </div>

      {/* progress + stats */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--bd)" }}>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Progress</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--p)" }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--p)" }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "var(--bg)" }}>
            <p className="text-[18px] font-black tabular-nums" style={{ color: "var(--t1)" }}>{activeDays}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Days</p>
          </div>
          <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "var(--bg)" }}>
            <p className="text-[18px] font-black tabular-nums" style={{ color: "var(--t1)" }}>{totalSlots}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Slots</p>
          </div>
        </div>
      </div>

      {/* step list */}
      <div className="flex-1 px-4 py-4 space-y-1">
        {STEPS.map(s => {
          const active   = step === s.id
          const complete = done.has(s.id)
          return (
            <div key={s.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
              style={{ background: active ? "var(--p2)" : "transparent" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                style={{ background: complete ? "var(--p)" : active ? "var(--p)" : "var(--bg)" }}>
                {complete
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <s.icon className="w-3.5 h-3.5" style={{ color: active ? "#fff" : "var(--t3)" }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold truncate"
                  style={{ color: active || complete ? "var(--p)" : "var(--t2)" }}>{s.label}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--t3)" }}>{s.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN FORM
// ════════════════════════════════════════════════════════════════════════════════
const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: "Session Info",   sub: "Title, description & banner"     },
  2: { title: "Session Details", sub: "Duration & what students need"   },
  3: { title: "Availability",   sub: "Set your weekly schedule"        },
  4: { title: "Pricing",        sub: "Rate and visibility"             },
}

export function CreateSessionForm() {
  const router = useRouter()

  const [step,         setStep]         = useState(1)
  const [error,        setError]        = useState("")
  const [success,      setSuccess]      = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [done]                          = useState<Set<number>>(new Set())

  const [data, setData] = useState<FormData>({
    title: "", description: "", requirements: "", banner: "",
    duration: 0, price: 0, priceType: "paid",
    availability: [], isPublished: true,
  })

  const set = (field: keyof FormData, value: any) =>
    setData(p => ({ ...p, [field]: value }))

  const canContinue = () => {
    switch (step) {
      case 1: return !!(data.title.trim() && data.description.trim())
      case 2: return data.duration > 0
      case 3: return data.availability.length > 0
      case 4: return data.priceType === "free" || (data.priceType === "paid" && data.price > 0)
      default: return false
    }
  }

  const stepBlockerMsg = () => {
    switch (step) {
      case 1: return "Add a title and description to continue"
      case 2: return "Select a session duration"
      case 3: return "Add at least one available day with a time slot"
      case 4: return data.priceType === "paid" ? "Enter a price for your session" : "Fill in all required fields"
      default: return "Fill in all required fields"
    }
  }

  const goNext = () => { if (canContinue()) { done.add(step); setStep(s => s + 1) } }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      setSubmitStatus("Creating session…")
      await new Promise(r => setTimeout(r, 400))
      setSubmitStatus("Saving availability…")
      await new Promise(r => setTimeout(r, 300))
      setSubmitStatus("Publishing…")
      await new Promise(r => setTimeout(r, 300))

      const mockId = `session_${Date.now()}`
      const totalSlots = data.availability.reduce((n, d) => n + d.slots.length, 0)

      const sessions: any[] = JSON.parse(localStorage.getItem("chabaqa_mock_sessions") ?? "[]")
      sessions.unshift({
        _id: mockId, title: data.title, banner: data.banner,
        duration: data.duration, priceType: data.priceType, price: data.price,
        isPublished: data.isPublished, availabilityDays: data.availability.length,
        totalSlots, description: data.description,
      })
      localStorage.setItem("chabaqa_mock_sessions", JSON.stringify(sessions))

      setSuccess(true)
      setTimeout(() => router.push("/creator/sessions"), 2800)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false); setSubmitStatus("")
    }
  }

  if (success) return <SuccessScreen />

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar data={data} step={step} done={done} />

      {/* main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* top bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b"
          style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button type="button" onClick={() => router.push("/creator/sessions")}
                className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
                style={{ color: "var(--t3)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Sessions
              </button>
              <ChevronRight className="w-3 h-3" style={{ color: "var(--bd)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--t2)" }}>New Session</span>
            </div>
            <h1 className="text-[15px] font-bold" style={{ color: "var(--t1)" }}>
              {STEP_META[step].title}
            </h1>
            <p className="text-[11px]" style={{ color: "var(--t3)" }}>{STEP_META[step].sub}</p>
          </div>
          <span className="text-[11px] font-bold tabular-nums px-3 py-1 rounded-full"
            style={{ background: "var(--p2)", color: "var(--p)" }}>
            {step} / {STEPS.length}
          </span>
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {step === 1 && <StepInfo         data={data} set={set} />}
          {step === 2 && <StepDetails      data={data} set={set} />}
          {step === 3 && <StepAvailability data={data} set={set} />}
          {step === 4 && <StepPricing      data={data} set={set} />}
        </div>

        {/* sticky bottom nav */}
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
            {step > 1
              ? <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150"
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
                <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>{stepBlockerMsg()}</p>
              </div>
            )}
            {canContinue() && !error && <div />}

            <button type="button"
              onClick={step === STEPS.length ? submit : goNext}
              disabled={!canContinue() || submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:cursor-not-allowed transition-all duration-150"
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
                  {submitStatus || "Publishing…"}
                </>
              ) : step === STEPS.length ? (
                <>{data.isPublished ? "Publish Session" : "Save as Draft"} <Check className="w-4 h-4" /></>
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
