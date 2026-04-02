"use client"

import confetti from "canvas-confetti"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, Clock, DollarSign,
  Globe, Lock, AlertCircle, Calendar, Plus, X,
  ChevronRight, UploadCloud, FileText, Users,
  ChevronLeft, Repeat2, Trash2,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_HEADERS = ["Mo","Tu","We","Th","Fr","Sa","Su"]

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function parseDate(s: string) {
  const [y,m,d] = s.split("-").map(Number)
  return new Date(y,m-1,d)
}
function fmtDisplay(s: string) {
  const d = parseDate(s)
  return d.toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric", year:"numeric" })
}
function fmtTime12(t: string) {
  const [h,m] = t.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2,"0")} ${period}`
}
function weekdayOf(dateStr: string) {
  return parseDate(dateStr).getDay() // 0=Sun
}

// ─── types ────────────────────────────────────────────────────────────────────
interface TimeSlot       { id: string; time: string /* "HH:MM" 24h */ }
interface DateAvailability {
  date:      string     // "YYYY-MM-DD"
  slots:     TimeSlot[]
  recurring: boolean    // repeat every week on this weekday
}
interface FormData {
  title:        string
  description:  string
  requirements: string
  banner:       string
  duration:     number
  price:        number
  priceType:    "free" | "paid"
  availability: DateAvailability[]
  isPublished:  boolean
}

// ─── constants ────────────────────────────────────────────────────────────────
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
  { id: 3, label: "Availability",   icon: Calendar,   desc: "Your schedule"               },
  { id: 4, label: "Pricing",        icon: DollarSign, desc: "Set your rate"               },
] as const

const inp = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")
const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"

// ─── shared ui ────────────────────────────────────────────────────────────────
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
// THUMBNAIL UPLOAD  (same as course form — drag-drop only)
// ════════════════════════════════════════════════════════════════════════════════
function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) onChange(URL.createObjectURL(file))
  }

  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {!value ? (
        <div
          className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150"
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
          <button type="button"
            className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer transition-all"
            style={{ background: "var(--p)", color: "#fff" }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
            Browse Files
          </button>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ border: "2px solid var(--bd)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => inputRef.current?.click()}>
          <img src={value} alt="" className="w-full aspect-video object-cover block" />
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}>
              <button type="button"
                className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
                style={{ background: "var(--p)", color: "#fff" }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                Change
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// CUSTOM TIME PICKER  (no HTML time input)
// ════════════════════════════════════════════════════════════════════════════════
function TimePicker({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const init = () => {
    const [h, m] = value.split(":").map(Number)
    return {
      hour:   h === 0 ? 12 : h > 12 ? h - 12 : h,
      minute: [0,15,30,45].includes(m) ? m : 0,
      period: (h >= 12 ? "PM" : "AM") as "AM" | "PM",
    }
  }
  const [state, setState] = useState(init)

  useEffect(() => {
    let h = state.hour
    if (state.period === "AM" && h === 12) h = 0
    if (state.period === "PM" && h !== 12) h += 12
    onChange(`${String(h).padStart(2,"0")}:${String(state.minute).padStart(2,"0")}`)
  }, [state])

  const set = (k: keyof typeof state, v: any) => setState(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-3">
      {/* preview */}
      <div className="flex items-center justify-center py-2 rounded-xl"
        style={{ background: "var(--p2)" }}>
        <span className="text-2xl font-black tabular-nums" style={{ color: "var(--p)" }}>
          {state.hour}:{String(state.minute).padStart(2,"0")}{" "}
          <span className="text-base">{state.period}</span>
        </span>
      </div>

      {/* hours */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--t3)" }}>Hour</p>
        <div className="grid grid-cols-6 gap-1.5">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => {
            const on = state.hour === h
            return (
              <button key={h} type="button" onClick={() => set("hour", h)}
                className="h-9 rounded-xl text-sm font-bold cursor-pointer transition-all duration-100"
                style={{ background: on ? "var(--p)" : "var(--bg)", color: on ? "#fff" : "var(--t2)" }}>
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* minutes */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--t3)" }}>Minute</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[0,15,30,45].map(m => {
            const on = state.minute === m
            return (
              <button key={m} type="button" onClick={() => set("minute", m)}
                className="h-10 rounded-xl text-sm font-bold cursor-pointer transition-all duration-100"
                style={{ background: on ? "var(--p)" : "var(--bg)", color: on ? "#fff" : "var(--t2)" }}>
                :{String(m).padStart(2,"0")}
              </button>
            )
          })}
        </div>
      </div>

      {/* AM / PM */}
      <div className="grid grid-cols-2 gap-1.5">
        {(["AM","PM"] as const).map(p => {
          const on = state.period === p
          return (
            <button key={p} type="button" onClick={() => set("period", p)}
              className="h-10 rounded-xl text-sm font-black cursor-pointer transition-all duration-100"
              style={{
                background: on ? (p === "AM" ? "var(--cyan)" : "var(--orange)") : "var(--bg)",
                color: on ? "#fff" : "var(--t2)",
              }}>
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════════════════════════════════════════════
function CalendarView({
  availability, selectedDate, onSelectDate,
}: {
  availability: DateAvailability[]
  selectedDate: string | null
  onSelectDate: (d: string) => void
}) {
  const [current, setCurrent] = useState(() => {
    const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year  = current.getFullYear()
  const month = current.getMonth()

  // Build 42 cells starting from Monday of the first week
  const cells: Date[] = []
  const firstDay = new Date(year, month, 1)
  const offset   = (firstDay.getDay() + 6) % 7  // Mon=0
  const start    = new Date(year, month, 1 - offset)
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }

  const today = new Date(); today.setHours(0,0,0,0)

  // Which dates have direct slots
  const slotMap = new Map(availability.map(a => [a.date, a]))

  // Which dates are "recurring shadow" (same weekday as a recurring entry, after that entry)
  const recurringSet = new Set<string>()
  availability.filter(a => a.recurring).forEach(a => {
    const wd = weekdayOf(a.date)
    const anchor = parseDate(a.date)
    cells.forEach(cell => {
      if (cell > anchor && cell.getDay() === wd && !slotMap.has(fmtDate(cell))) {
        recurringSet.add(fmtDate(cell))
      }
    })
  })

  const prev = () => setCurrent(new Date(year, month - 1, 1))
  const next = () => setCurrent(new Date(year, month + 1, 1))

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>
      {/* calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--bd)" }}>
        <button type="button" onClick={prev}
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all"
          style={{ border: "1.5px solid var(--bd)", background: "transparent" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--t2)" }} />
        </button>

        <div className="text-center">
          <p className="text-[15px] font-black" style={{ color: "var(--t1)" }}>
            {MONTH_NAMES[month]}
          </p>
          <p className="text-[11px] font-bold" style={{ color: "var(--t3)" }}>{year}</p>
        </div>

        <button type="button" onClick={next}
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all"
          style={{ border: "1.5px solid var(--bd)", background: "transparent" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--t2)" }} />
        </button>
      </div>

      <div className="p-4">
        {/* day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-[11px] font-black uppercase tracking-wider py-1"
              style={{ color: "var(--t3)" }}>{d}</div>
          ))}
        </div>

        {/* date cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map(cell => {
            const key         = fmtDate(cell)
            const inMonth     = cell.getMonth() === month
            const isPast      = cell < today
            const entry       = slotMap.get(key)
            const hasSlots    = !!entry
            const isRecurring = recurringSet.has(key) && !hasSlots
            const isSelected  = selectedDate === key
            const isToday     = fmtDate(cell) === fmtDate(today)

            return (
              <button key={key} type="button"
                disabled={isPast && !hasSlots}
                onClick={() => (!isPast || hasSlots) && onSelectDate(key)}
                className="relative flex flex-col items-center justify-center h-10 rounded-xl transition-all duration-150 cursor-pointer"
                style={{
                  background:  isSelected ? "var(--p)" :
                               hasSlots   ? "var(--p2)" :
                               isRecurring ? "rgba(142,120,251,.06)" : "transparent",
                  opacity:     !inMonth || (isPast && !hasSlots) ? 0.3 : 1,
                  cursor:      isPast && !hasSlots ? "default" : "pointer",
                  border:      isToday && !isSelected ? "2px solid var(--p)" : "2px solid transparent",
                }}>
                <span className="text-[12px] font-bold leading-none"
                  style={{ color: isSelected ? "#fff" : hasSlots ? "var(--p)" : "var(--t1)" }}>
                  {cell.getDate()}
                </span>

                {/* dots */}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {entry!.slots.slice(0,3).map((_,i) => (
                      <span key={i} className="w-1 h-1 rounded-full" style={{ background: "var(--p)" }} />
                    ))}
                  </span>
                )}
                {isRecurring && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "rgba(142,120,251,.4)" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t" style={{ borderColor: "var(--bd)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--p2)" }} />
          <span className="text-[10px]" style={{ color: "var(--t3)" }}>Has slots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(142,120,251,.06)", border: "1px solid rgba(142,120,251,.3)" }} />
          <span className="text-[10px]" style={{ color: "var(--t3)" }}>Recurring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "var(--p)" }} />
          <span className="text-[10px]" style={{ color: "var(--t3)" }}>Today</span>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SLOT PANEL  (right side when date is selected)
// ════════════════════════════════════════════════════════════════════════════════
function SlotPanel({
  date, entry, onAddSlot, onRemoveSlot, onChangeSlot, onToggleRecurring,
}: {
  date:             string
  entry:            DateAvailability | undefined
  onAddSlot:        () => void
  onRemoveSlot:     (id: string) => void
  onChangeSlot:     (id: string, time: string) => void
  onToggleRecurring:() => void
}) {
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const weekday = parseDate(date).toLocaleDateString("en-US", { weekday: "long" })
  const slots   = entry?.slots ?? []
  const recur   = entry?.recurring ?? false

  return (
    <div className="flex flex-col h-full">
      {/* date header */}
      <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--bd)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--t3)" }}>
          Selected Date
        </p>
        <p className="text-[15px] font-black" style={{ color: "var(--t1)" }}>
          {parseDate(date).toLocaleDateString("en-US",{ weekday:"long", day:"numeric", month:"short" })}
        </p>
        <p className="text-[11px]" style={{ color: "var(--t3)" }}>
          {parseDate(date).getFullYear()}
        </p>
      </div>

      {/* recurring toggle */}
      <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--bd)" }}>
        <button type="button" onClick={onToggleRecurring}
          className="w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150"
          style={{
            background: recur ? "var(--p2)" : "var(--bg)",
            border: `1.5px solid ${recur ? "var(--p)" : "var(--bd)"}`,
          }}>
          <div className="flex items-center gap-2.5">
            <Repeat2 className="w-4 h-4" style={{ color: recur ? "var(--p)" : "var(--t3)" }} />
            <div className="text-left">
              <p className="text-[12px] font-bold" style={{ color: recur ? "var(--p)" : "var(--t1)" }}>
                Repeat every {weekday}
              </p>
              <p className="text-[10px]" style={{ color: "var(--t3)" }}>
                {recur ? "Applied to all future " + weekday + "s" : "One-time availability"}
              </p>
            </div>
          </div>
          {/* toggle pill */}
          <div className="w-11 h-6 rounded-full relative transition-all duration-200 shrink-0"
            style={{ background: recur ? "var(--p)" : "var(--bd)" }}>
            <div className="w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-all duration-200 shadow"
              style={{ left: recur ? "calc(100% - 22px)" : "3px", width: 18, height: 18 }} />
          </div>
        </button>
      </div>

      {/* slots list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--t3)" }}>
            Time Slots
          </p>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--p2)", color: "var(--p)" }}>
            {slots.length} slot{slots.length !== 1 ? "s" : ""}
          </span>
        </div>

        {slots.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock className="w-8 h-8 opacity-20" style={{ color: "var(--t3)" }} />
            <p className="text-[12px]" style={{ color: "var(--t3)" }}>No slots yet — add one below</p>
          </div>
        )}

        {slots.map(slot => (
          <div key={slot.id}>
            {/* slot row */}
            <div className="flex items-center gap-2">
              <button type="button"
                onClick={() => setEditingSlot(editingSlot === slot.id ? null : slot.id)}
                className="flex-1 flex items-center gap-2.5 h-11 px-4 rounded-xl border-2 cursor-pointer transition-all text-left"
                style={{
                  borderColor: editingSlot === slot.id ? "var(--p)" : "var(--bd)",
                  background:  editingSlot === slot.id ? "var(--p2)" : "var(--white)",
                }}>
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p)" }} />
                <span className="text-sm font-bold flex-1" style={{ color: "var(--t1)" }}>
                  {fmtTime12(slot.time)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{
                    color: "var(--t3)",
                    transform: editingSlot === slot.id ? "rotate(90deg)" : "none",
                  }} />
              </button>
              <button type="button" onClick={() => onRemoveSlot(slot.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 shrink-0"
                style={{ background: "#fef2f2", border: "1.5px solid #fca5a5" }}>
                <Trash2 className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
              </button>
            </div>

            {/* inline time picker — expands below the slot */}
            {editingSlot === slot.id && (
              <div className="mt-2 p-4 rounded-xl" style={{ background: "var(--bg)", border: "1.5px solid var(--bd)" }}>
                <TimePicker value={slot.time} onChange={t => onChangeSlot(slot.id, t)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* add slot */}
      <div className="px-5 pb-5 shrink-0">
        <button type="button" onClick={() => { onAddSlot(); setEditingSlot(null) }}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border-2 cursor-pointer transition-all duration-150 font-bold text-sm"
          style={{ borderColor: "var(--p)", color: "var(--p)", background: "transparent" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <Plus className="w-4 h-4" /> Add time slot
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — AVAILABILITY
// ════════════════════════════════════════════════════════════════════════════════
function StepAvailability({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const entryFor = (date: string) => data.availability.find(a => a.date === date)

  const selectDate = (date: string) => {
    setSelectedDate(date)
    if (!entryFor(date)) {
      set("availability", [...data.availability, { date, slots: [{ id: uid(), time: "09:00" }], recurring: false }])
    }
  }

  const addSlot = (date: string) => {
    set("availability", data.availability.map(a =>
      a.date === date ? { ...a, slots: [...a.slots, { id: uid(), time: "10:00" }] } : a
    ))
  }

  const removeSlot = (date: string, slotId: string) => {
    const updated = data.availability.map(a => {
      if (a.date !== date) return a
      if (a.slots.length === 1) return null  // remove whole entry
      return { ...a, slots: a.slots.filter(s => s.id !== slotId) }
    }).filter(Boolean) as DateAvailability[]
    set("availability", updated)
    if (!updated.find(a => a.date === date)) setSelectedDate(null)
  }

  const changeSlot = (date: string, slotId: string, time: string) => {
    set("availability", data.availability.map(a =>
      a.date === date ? { ...a, slots: a.slots.map(s => s.id === slotId ? { ...s, time } : s) } : a
    ))
  }

  const toggleRecurring = (date: string) => {
    set("availability", data.availability.map(a =>
      a.date === date ? { ...a, recurring: !a.recurring } : a
    ))
  }

  const totalSlots = data.availability.reduce((n, a) => n + a.slots.length, 0)

  return (
    <div className="flex h-full gap-5">

      {/* LEFT — calendar */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="mb-4">
          <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--t1)" }}>Click a date to add availability</h3>
          <p className="text-[12px]" style={{ color: "var(--t3)" }}>
            {data.availability.length > 0
              ? `${data.availability.length} date${data.availability.length !== 1 ? "s" : ""} · ${totalSlots} total slot${totalSlots !== 1 ? "s" : ""}`
              : "Select dates when you're available for sessions"}
          </p>
        </div>
        <CalendarView
          availability={data.availability}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
        />
      </div>

      {/* RIGHT — slot panel */}
      <div className="w-[300px] shrink-0 rounded-2xl overflow-hidden flex flex-col"
        style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>
        {selectedDate ? (
          <SlotPanel
            date={selectedDate}
            entry={entryFor(selectedDate)}
            onAddSlot={() => addSlot(selectedDate)}
            onRemoveSlot={id => removeSlot(selectedDate, id)}
            onChangeSlot={(id, t) => changeSlot(selectedDate, id, t)}
            onToggleRecurring={() => toggleRecurring(selectedDate)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--p2)" }}>
              <Calendar className="w-6 h-6" style={{ color: "var(--p)" }} />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--t2)" }}>Select a date</p>
            <p className="text-[11px]" style={{ color: "var(--t3)" }}>
              Click any date on the calendar to set your available time slots
            </p>
          </div>
        )}
      </div>

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

      <Card title="Banner" sub="16:9 cover image · JPG, PNG, WebP">
        <ThumbnailUpload value={data.banner} onChange={v => set("banner", v)} />
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

      <Card title="Requirements" sub="What should students prepare before booking?">
        <Textarea
          placeholder="e.g. Basic knowledge of React, have a project idea ready, laptop required…"
          value={data.requirements} onChange={e => set("requirements", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
          style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)" }}
          onFocus={e  => (e.target as HTMLElement).style.borderColor = "var(--p)"}
          onBlur={e   => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
        <p className="text-[11px] mt-1.5" style={{ color: "var(--t3)" }}>Leave empty if no special requirements.</p>
      </Card>
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
            { val: "free" as const, label: "Free",  desc: "Open to everyone",   icon: Users },
            { val: "paid" as const, label: "Paid",  desc: "Charge per booking", icon: DollarSign },
          ]).map(opt => {
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
                  <p className="text-sm font-bold"    style={{ color: on ? "var(--p)" : "var(--t1)" }}>{opt.label}</p>
                  <p className="text-[11px]"           style={{ color: "var(--t3)" }}>{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {data.priceType === "paid" && (
          <div style={{ animation: "fadeUpP .25s ease both" }}>
            <style>{`@keyframes fadeUpP{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
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
            { val: true,  icon: Globe, label: "Published", desc: "Visible to everyone"    },
            { val: false, icon: Lock,  label: "Draft",     desc: "Hidden — not bookable"  },
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
                  <p className="text-[11px]"        style={{ color: "var(--t3)" }}>{opt.desc}</p>
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
    const colors   = ["#8e78fb","#fb923c","#22d3ee","#f472b6","#a78bfa","#ffffff"]
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
    const rand     = (a: number, b: number) => Math.random() * (b - a) + a
    const end      = Date.now() + 3500
    const iv       = window.setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) return clearInterval(iv)
      const n = 60 * (left / 3500)
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.1,.3), y: Math.random() - .2 } })
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.7,.9), y: Math.random() - .2 } })
    }, 250)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <style>{`
        @keyframes popIn   { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUpS { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
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
  const progress   = Math.round(((step - 1) / STEPS.length) * 100)
  const totalSlots = data.availability.reduce((n, a) => n + a.slots.length, 0)
  const recurring  = data.availability.filter(a => a.recurring).length

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
                <Calendar className="w-6 h-6" style={{ color: "var(--t3)" }} />
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
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: data.availability.length, label: "Dates"   },
            { n: totalSlots,                label: "Slots"   },
            { n: recurring,                 label: "Repeat"  },
          ].map(item => (
            <div key={item.label} className="px-2 py-2.5 rounded-xl text-center" style={{ background: "var(--bg)" }}>
              <p className="text-[16px] font-black tabular-nums" style={{ color: "var(--t1)" }}>{item.n}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* steps */}
      <div className="flex-1 px-4 py-4 space-y-1">
        {STEPS.map(s => {
          const active   = step === s.id
          const complete = done.has(s.id)
          return (
            <div key={s.id} className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
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
const STEP_META: Record<number,{ title: string; sub: string }> = {
  1: { title: "Session Info",    sub: "Title, description & banner"     },
  2: { title: "Session Details", sub: "Duration & requirements"         },
  3: { title: "Availability",    sub: "Click dates to set time slots"   },
  4: { title: "Pricing",         sub: "Rate and visibility"             },
}

const STEP_BLOCKER: Record<number, (d: FormData) => string> = {
  1: d => !d.title.trim()                                ? "Add a session title to continue"
          : !d.description.trim()                        ? "Add a description to continue"
          : "",
  2: d => d.duration === 0                              ? "Select a session duration"
          : "",
  3: d => d.availability.length === 0                   ? "Add at least one date with a time slot"
          : "",
  4: d => d.priceType === "paid" && d.price <= 0        ? "Enter a price for your session"
          : "",
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

  const blocker    = () => STEP_BLOCKER[step]?.(data) ?? ""
  const canContinue = () => blocker() === ""
  const goNext      = () => { if (canContinue()) { done.add(step); setStep(s => s + 1) } }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      setSubmitStatus("Creating session…");   await new Promise(r => setTimeout(r, 400))
      setSubmitStatus("Saving availability…"); await new Promise(r => setTimeout(r, 300))
      setSubmitStatus("Publishing…");          await new Promise(r => setTimeout(r, 300))

      const mockId     = `session_${Date.now()}`
      const totalSlots = data.availability.reduce((n, a) => n + a.slots.length, 0)

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

  const isAvailability = step === 3

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar data={data} step={step} done={done} />

      {/* main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* topbar */}
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

        {/* content */}
        <div className={`flex-1 ${isAvailability ? "overflow-hidden p-6" : "overflow-y-auto px-8 py-7"}`}>
          {step === 1 && <StepInfo         data={data} set={set} />}
          {step === 2 && <StepDetails      data={data} set={set} />}
          {step === 3 && <StepAvailability data={data} set={set} />}
          {step === 4 && <StepPricing      data={data} set={set} />}
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
                <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>{blocker()}</p>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
