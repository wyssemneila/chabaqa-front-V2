"use client"

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
          <img src={value} alt="Session banner preview" loading="lazy" className="w-full aspect-video object-cover block" />
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

// ─── time options (30-min increments, 6 AM → 11 PM) ─────────────────────────
const TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const totalMins = 6 * 60 + i * 30
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const v = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
  return { value: v, label: fmtTime12(v) }
})

// ─── timezones ────────────────────────────────────────────────────────────────
const TIMEZONES = [
  { v: "UTC-12", l: "UTC−12:00" },
  { v: "UTC-8",  l: "Pacific (UTC−08:00)" },
  { v: "UTC-7",  l: "Mountain (UTC−07:00)" },
  { v: "UTC-6",  l: "Central (UTC−06:00)" },
  { v: "UTC-5",  l: "Eastern (UTC−05:00)" },
  { v: "UTC-3",  l: "Brasília (UTC−03:00)" },
  { v: "UTC+0",  l: "London / UTC±00:00" },
  { v: "UTC+1",  l: "Central Europe (UTC+01:00)" },
  { v: "UTC+2",  l: "Eastern Europe (UTC+02:00)" },
  { v: "UTC+3",  l: "Tunis / Riyadh (UTC+03:00)" },
  { v: "UTC+4",  l: "Gulf (UTC+04:00)" },
  { v: "UTC+5.5",l: "India (UTC+05:30)" },
  { v: "UTC+7",  l: "Bangkok (UTC+07:00)" },
  { v: "UTC+8",  l: "China / Singapore (UTC+08:00)" },
  { v: "UTC+9",  l: "Tokyo / Seoul (UTC+09:00)" },
  { v: "UTC+10", l: "Sydney (UTC+10:00)" },
  { v: "UTC+12", l: "Auckland (UTC+12:00)" },
]

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

  const cells: Date[] = []
  const firstDay = new Date(year, month, 1)
  const offset   = (firstDay.getDay() + 6) % 7
  const start    = new Date(year, month, 1 - offset)
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }

  const today    = new Date(); today.setHours(0,0,0,0)
  const slotMap  = new Map(availability.map(a => [a.date, a]))

  const recurringSet = new Set<string>()
  availability.filter(a => a.recurring).forEach(a => {
    const wd = weekdayOf(a.date)
    const anchor = parseDate(a.date)
    cells.forEach(cell => {
      if (cell > anchor && cell.getDay() === wd && !slotMap.has(fmtDate(cell)))
        recurringSet.add(fmtDate(cell))
    })
  })

  const prev = () => setCurrent(new Date(year, month - 1, 1))
  const next = () => setCurrent(new Date(year, month + 1, 1))

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>
      <style>{`
        .cal-cell { transition: background .1s ease, transform .1s ease; }
        .cal-cell:not(:disabled):hover { background: var(--p2) !important; transform: scale(1.08); }
        .cal-cell:not(:disabled):active { transform: scale(.92); }
        .cal-nav { transition: background .12s ease; border: 1.5px solid var(--bd); }
        .cal-nav:hover { background: var(--p2) !important; border-color: var(--p) !important; }
      `}</style>

      {/* month nav */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
        style={{ borderColor: "var(--bd)" }}>
        <button type="button" onClick={prev}
          className="cal-nav w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: "transparent" }}>
          <ChevronLeft className="w-3.5 h-3.5" style={{ color: "var(--t2)" }} />
        </button>
        <p className="text-[13px] font-black select-none" style={{ color: "var(--t1)" }}>
          {MONTH_NAMES[month]}{" "}
          <span className="font-semibold" style={{ color: "var(--t3)" }}>{year}</span>
        </p>
        <button type="button" onClick={next}
          className="cal-nav w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: "transparent" }}>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--t2)" }} />
        </button>
      </div>

      {/* grid */}
      <div className="px-3 pt-2 pb-3 flex-1">
        {/* day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="h-7 flex items-center justify-center text-[10px] font-black uppercase tracking-wider select-none"
              style={{ color: "var(--t3)" }}>{d}</div>
          ))}
        </div>
        {/* cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(cell => {
            const key         = fmtDate(cell)
            const inMonth     = cell.getMonth() === month
            const isPast      = cell < today
            const entry       = slotMap.get(key)
            const hasSlots    = !!entry && entry.slots.length > 0
            const isRecurring = recurringSet.has(key)
            const isSelected  = selectedDate === key
            const isToday     = key === fmtDate(today)
            const disabled    = isPast && !hasSlots

            return (
              <button key={key} type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelectDate(key)}
                className="cal-cell relative flex flex-col items-center justify-center rounded-xl"
                style={{
                  height: 40,
                  background: isSelected
                    ? "var(--p)"
                    : hasSlots ? "var(--p2)"
                    : isRecurring ? "rgba(142,120,251,.06)"
                    : "transparent",
                  opacity:  !inMonth ? 0.2 : disabled ? 0.28 : 1,
                  cursor:   disabled ? "default" : "pointer",
                  border:   isToday && !isSelected
                    ? "2px solid var(--p)"
                    : isRecurring && !hasSlots
                      ? "2px solid rgba(142,120,251,.22)"
                      : "2px solid transparent",
                  boxShadow: isSelected ? "0 2px 12px rgba(142,120,251,.4)" : "none",
                }}>
                <span className="text-[12px] font-bold select-none leading-none"
                  style={{ color: isSelected ? "#fff" : hasSlots ? "var(--p)" : "var(--t1)" }}>
                  {cell.getDate()}
                </span>
                {/* slot dot */}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-[4px] w-[5px] h-[5px] rounded-full"
                    style={{ background: "var(--p)" }} />
                )}
                {isRecurring && !hasSlots && (
                  <span className="absolute bottom-[4px] w-[4px] h-[4px] rounded-full"
                    style={{ background: "rgba(142,120,251,.45)" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t" style={{ borderColor: "var(--bd)" }}>
        {[
          { bg: "var(--p2)", dot: "var(--p)",              label: "Has slots"  },
          { bg: "transparent", dot: "rgba(142,120,251,.45)", label: "Recurring" },
          { bg: "transparent", outline: "var(--p)",          label: "Today"     },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{
                background: (item as any).bg,
                border: (item as any).outline ? `1.5px solid ${(item as any).outline}` : "none",
              }} />
            <span className="text-[10px] font-medium" style={{ color: "var(--t3)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SLOT PANEL — premium redesign with time dropdown, chips, micro-animation
// ════════════════════════════════════════════════════════════════════════════════
function SlotPanel({
  date, entry, onAddSlot, onRemoveSlot, onToggleRecurring,
}: {
  date:              string
  entry:             DateAvailability | undefined
  onAddSlot:         (time: string) => void
  onRemoveSlot:      (id: string) => void
  onToggleRecurring: () => void
}) {
  const [newTime,    setNewTime]    = useState("09:00")
  const [timezone,   setTimezone]   = useState("UTC+1")
  const [justAdded,  setJustAdded]  = useState(false)

  const weekday = parseDate(date).toLocaleDateString("en-US", { weekday: "long" })
  const slots   = entry?.slots ?? []
  const recur   = entry?.recurring ?? false

  const handleAdd = () => {
    if (!newTime) return
    onAddSlot(newTime)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>{`
        @keyframes chipIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes addPop { 0%{transform:scale(1)} 40%{transform:scale(.93)} 70%{transform:scale(1.05)} 100%{transform:scale(1)} }
        .slot-chip { animation: chipIn .2s cubic-bezier(.34,1.56,.64,1) both; transition: box-shadow .12s ease; }
        .slot-chip:hover { box-shadow: 0 0 0 2px rgba(220,38,38,.35) !important; }
        .slot-chip:hover .chip-time { text-decoration: line-through; opacity: .6; }
        .sp-tz { color-scheme: light; appearance: none; -webkit-appearance: none; }
        .sp-select { color-scheme: light; appearance: none; -webkit-appearance: none; }
      `}</style>

      {/* ── DATE HEADER ── */}
      <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--bd)" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[16px] font-black leading-tight" style={{ color: "var(--t1)" }}>
              {parseDate(date).toLocaleDateString("en-US", { weekday: "long" })}
            </p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--t3)" }}>
              {parseDate(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {/* slot count badge */}
          {slots.length > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
              style={{ background: "var(--p)", color: "#fff" }}>
              {slots.length} {slots.length === 1 ? "slot" : "slots"}
            </span>
          )}
        </div>
      </div>

      {/* ── TIMEZONE ── */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-3 h-9 rounded-xl relative"
          style={{ border: "1.5px solid var(--bd)", background: "var(--bg)" }}>
          <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--t3)" }} />
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="sp-tz flex-1 bg-transparent border-none outline-none text-[12px] font-semibold cursor-pointer pr-4"
            style={{ color: "var(--t2)" }}>
            {TIMEZONES.map(tz => (
              <option key={tz.v} value={tz.v}>{tz.l}</option>
            ))}
          </select>
          <ChevronRight className="w-3 h-3 shrink-0 rotate-90 absolute right-3 pointer-events-none"
            style={{ color: "var(--t3)" }} />
        </div>
      </div>

      {/* ── RECURRING TOGGLE ── */}
      <div className="px-4 pb-3 shrink-0">
        <button type="button" onClick={onToggleRecurring}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
          style={{
            background: recur ? "var(--p2)" : "var(--bg)",
            border: `1.5px solid ${recur ? "var(--p)" : "var(--bd)"}`,
          }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: recur ? "var(--p)" : "var(--bd)" }}>
              <Repeat2 className="w-3.5 h-3.5" style={{ color: recur ? "#fff" : "var(--white)" }} />
            </div>
            <div className="text-left">
              <p className="text-[12px] font-bold" style={{ color: recur ? "var(--p)" : "var(--t1)" }}>
                {recur ? `Repeats every ${weekday}` : `Repeat weekly`}
              </p>
              <p className="text-[10px]" style={{ color: "var(--t3)" }}>
                {recur ? "Applied to all future weeks" : `One-time · ${parseDate(date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}
              </p>
            </div>
          </div>
          {/* pill toggle */}
          <div className="w-10 h-[22px] rounded-full relative shrink-0 ml-2"
            style={{ background: recur ? "var(--p)" : "rgba(0,0,0,.12)", transition: "background .2s" }}>
            <div style={{
              position:"absolute", top:3, width:16, height:16, borderRadius:"50%",
              background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.25)",
              left: recur ? "calc(100% - 19px)" : 3,
              transition: "left .2s cubic-bezier(.34,1.56,.64,1)",
            }} />
          </div>
        </button>
      </div>

      {/* ── DIVIDER ── */}
      <div className="mx-4 border-t shrink-0" style={{ borderColor: "var(--bd)" }} />

      {/* ── SLOTS CHIPS AREA ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
        <p className={`${LBL} mb-2.5`} style={{ color: "var(--t3)" }}>
          Available at
        </p>

        {slots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center rounded-xl"
            style={{ background: "var(--bg)", border: "1.5px dashed var(--bd)" }}>
            <Clock className="w-6 h-6 opacity-25" style={{ color: "var(--t3)" }} />
            <p className="text-[11px] font-medium" style={{ color: "var(--t3)" }}>No times set yet</p>
            <p className="text-[10px]" style={{ color: "var(--t3)", opacity: .7 }}>
              Pick a time below and tap Add
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map(slot => (
              <button key={slot.id} type="button"
                onClick={() => onRemoveSlot(slot.id)}
                title="Click to remove"
                className="slot-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
                style={{
                  background: "var(--p2)",
                  border: "1.5px solid rgba(142,120,251,.3)",
                  boxShadow: "0 1px 4px rgba(142,120,251,.12)",
                }}>
                <Clock className="w-3 h-3 shrink-0" style={{ color: "var(--p)" }} />
                <span className="chip-time text-[12px] font-bold tabular-nums" style={{ color: "var(--p)" }}>
                  {fmtTime12(slot.time)}
                </span>
                <X className="w-3 h-3 shrink-0 opacity-50" style={{ color: "var(--p)" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD TIME ── */}
      <div className="px-4 pt-2 pb-4 shrink-0 border-t" style={{ borderColor: "var(--bd)" }}>
        <p className={`${LBL} mb-2`} style={{ color: "var(--t3)" }}>Add a time</p>
        <div className="flex gap-2">
          {/* styled select dropdown */}
          <div className="relative flex-1">
            <select
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="sp-select w-full h-10 pl-3 pr-8 rounded-xl text-[13px] font-bold cursor-pointer outline-none"
              style={{
                border: "1.5px solid var(--bd)",
                background: "var(--bg)",
                color: "var(--t1)",
                transition: "border-color .12s",
              }}
              onFocus={e  => (e.currentTarget as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e   => (e.currentTarget as HTMLElement).style.borderColor = "var(--bd)"}>
              {TIME_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--t3)" }} />
          </div>
          {/* add button with success state */}
          <button type="button" onClick={handleAdd}
            className="h-10 px-4 rounded-xl text-[12px] font-bold cursor-pointer shrink-0 transition-all duration-150"
            style={{
              background: justAdded ? "#10b981" : "var(--p)",
              color: "#fff",
              boxShadow: justAdded ? "0 2px 12px rgba(16,185,129,.4)" : "0 2px 10px rgba(142,120,251,.35)",
              animation: justAdded ? "addPop .4s ease both" : "none",
            }}>
            {justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
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
      set("availability", [...data.availability, { date, slots: [], recurring: false }])
    }
  }

  const addSlot = (date: string, time: string) => {
    set("availability", data.availability.map(a =>
      a.date === date ? { ...a, slots: [...a.slots, { id: uid(), time }] } : a
    ))
  }

  const removeSlot = (date: string, slotId: string) => {
    set("availability", data.availability.map(a =>
      a.date !== date ? a : { ...a, slots: a.slots.filter(s => s.id !== slotId) }
    ))
  }

  const toggleRecurring = (date: string) => {
    set("availability", data.availability.map(a =>
      a.date === date ? { ...a, recurring: !a.recurring } : a
    ))
  }

  const totalSlots = data.availability.reduce((n, a) => n + a.slots.length, 0)
  const datesWithSlots = data.availability.filter(a => a.slots.length > 0).length

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── SUMMARY BAR ── */}
      <div className="px-6 py-3 shrink-0 border-b flex items-center gap-3"
        style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {datesWithSlots === 0 ? (
            <span className="text-[12px]" style={{ color: "var(--t3)" }}>
              Select a date on the calendar, then add your available times →
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[12px] font-bold"
                style={{ color: "var(--t1)" }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--p)" }} />
                {datesWithSlots} date{datesWithSlots !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "var(--bd)" }}>·</span>
              <span className="flex items-center gap-1.5 text-[12px] font-bold"
                style={{ color: "var(--t1)" }}>
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--p)" }} />
                {totalSlots} slot{totalSlots !== 1 ? "s" : ""}
              </span>
              {data.availability.some(a => a.recurring) && (
                <>
                  <span style={{ color: "var(--bd)" }}>·</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--p2)", color: "var(--p)" }}>
                    <Repeat2 className="w-3 h-3" />
                    {data.availability.filter(a => a.recurring).length} recurring
                  </span>
                </>
              )}
            </>
          )}
        </div>
        {selectedDate && (
          <button type="button" onClick={() => setSelectedDate(null)}
            className="text-[11px] font-bold cursor-pointer px-2.5 py-1 rounded-lg transition-all"
            style={{ color: "var(--t3)", background: "var(--bg)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--t1)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t3)"}>
            ← All dates
          </button>
        )}
      </div>

      {/* ── TWO PANELS ── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* LEFT — calendar */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          <CalendarView
            availability={data.availability}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
          />
        </div>

        {/* divider */}
        <div className="w-px shrink-0" style={{ background: "var(--bd)" }} />

        {/* RIGHT — slot panel or date list */}
        <div className="w-[290px] shrink-0 flex flex-col overflow-hidden">
          {selectedDate ? (
            <SlotPanel
              date={selectedDate}
              entry={entryFor(selectedDate)}
              onAddSlot={t => addSlot(selectedDate, t)}
              onRemoveSlot={id => removeSlot(selectedDate, id)}
              onToggleRecurring={() => toggleRecurring(selectedDate)}
            />
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3.5 border-b shrink-0" style={{ borderColor: "var(--bd)" }}>
                <p className="text-[12px] font-black" style={{ color: "var(--t1)" }}>Your schedule</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--t3)" }}>
                  {data.availability.length === 0
                    ? "No dates added yet"
                    : `${data.availability.length} date${data.availability.length !== 1 ? "s" : ""} configured`}
                </p>
              </div>

              {data.availability.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--p2)" }}>
                    <Calendar className="w-6 h-6" style={{ color: "var(--p)" }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold mb-1" style={{ color: "var(--t2)" }}>No dates yet</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--t3)" }}>
                      Click any date on the calendar to start setting your availability
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                  {data.availability.map(a => (
                    <button key={a.date} type="button"
                      onClick={() => setSelectedDate(a.date)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left"
                      style={{ border: "1.5px solid var(--bd)", background: "var(--white)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--p)"
                        ;(e.currentTarget as HTMLElement).style.background = "var(--p2)"
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--bd)"
                        ;(e.currentTarget as HTMLElement).style.background = "var(--white)"
                      }}>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold truncate" style={{ color: "var(--t1)" }}>
                          {parseDate(a.date).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
                          {a.recurring && <span className="ml-1.5 text-[10px]" style={{ color: "var(--p)" }}>↻</span>}
                        </p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--t3)" }}>
                          {a.slots.length === 0
                            ? "No times — tap to add"
                            : a.slots.map(s => fmtTime12(s.time)).join(" · ")}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                        style={{
                          background: a.slots.length > 0 ? "var(--p2)" : "rgba(0,0,0,.05)",
                          color: a.slots.length > 0 ? "var(--p)" : "var(--t3)",
                        }}>
                        {a.slots.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
    let iv: ReturnType<typeof setInterval>
    ;(async () => {
      const confetti = (await import('canvas-confetti')).default
      const colors   = ["#8e78fb","#fb923c","#22d3ee","#f472b6","#a78bfa","#ffffff"]
      const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
      const rand     = (a: number, b: number) => Math.random() * (b - a) + a
      const end      = Date.now() + 3500
      iv             = window.setInterval(() => {
        const left = end - Date.now()
        if (left <= 0) return clearInterval(iv)
        const n = 60 * (left / 3500)
        confetti({ ...defaults, particleCount: n, origin: { x: rand(.1,.3), y: Math.random() - .2 } })
        confetti({ ...defaults, particleCount: n, origin: { x: rand(.7,.9), y: Math.random() - .2 } })
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
            ? <img src={data.banner} alt="Session banner preview" loading="lazy" className="w-full h-full object-cover" />
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
  3: d => d.availability.length === 0                                   ? "Add at least one date with a time slot"
          : d.availability.every(a => a.slots.length === 0)              ? "Add at least one time slot to a date"
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
