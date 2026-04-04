"use client"

import confetti from "canvas-confetti"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, ChevronRight,
  UploadCloud, FileText, Globe, MapPin, Layers2, Lock,
  Calendar, Clock, Users, Tag, DollarSign, Ticket,
  Plus, Trash2, Edit2, X, Infinity, CheckCircle2,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── types ────────────────────────────────────────────────────────────────────
type EventFormat = "online" | "offline" | "hybrid"
type PricingType = "free" | "paid"
type TicketTier  = "general" | "vip" | "early" | "student" | "custom"

interface TicketType {
  id: string; name: string; tier: TicketTier
  pricing: PricingType; price: number
  quantity: number | "unlimited"; description: string; salesDeadline: string
}
interface FormData {
  title: string; description: string; category: string; banner: string
  format: EventFormat
  venueName: string; address: string; city: string; country: string
  meetPlatform: string; meetLink: string
  startDate: string; startTime: string; endDate: string; endTime: string
  timezone: string; capacity: number | "unlimited"
  tickets: TicketType[]
  isPublished: boolean
}

// ─── constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Technology","Business","Design","Marketing","Education","Health","Music","Arts","Sports","Other"]
const TIMEZONES  = [
  { v:"UTC+0",   l:"London / UTC±00:00"          },
  { v:"UTC+1",   l:"Central Europe (UTC+01:00)"  },
  { v:"UTC+2",   l:"Eastern Europe (UTC+02:00)"  },
  { v:"UTC+3",   l:"Tunis / Riyadh (UTC+03:00)"  },
  { v:"UTC+4",   l:"Gulf (UTC+04:00)"             },
  { v:"UTC+5.5", l:"India (UTC+05:30)"            },
  { v:"UTC+8",   l:"China / Singapore (UTC+08:00)"},
  { v:"UTC-5",   l:"Eastern US (UTC−05:00)"       },
  { v:"UTC-8",   l:"Pacific US (UTC−08:00)"       },
]
const TIER_COLOR: Record<TicketTier, { bg:string; color:string; border:string }> = {
  general: { bg:"var(--p2)",                     color:"var(--p)",      border:"var(--p3)"                  },
  vip:     { bg:"rgba(236,72,153,.1)",            color:"var(--pink)",   border:"rgba(236,72,153,.25)"       },
  early:   { bg:"rgba(251,146,60,.1)",            color:"var(--orange)", border:"rgba(251,146,60,.25)"       },
  student: { bg:"rgba(34,211,238,.1)",            color:"var(--cyan)",   border:"rgba(34,211,238,.25)"       },
  custom:  { bg:"var(--bg)",                      color:"var(--t2)",     border:"var(--bd)"                  },
}
const TIERS: { id:TicketTier; label:string }[] = [
  { id:"general", label:"General"    },
  { id:"vip",     label:"VIP"        },
  { id:"early",   label:"Early Bird" },
  { id:"student", label:"Student"    },
  { id:"custom",  label:"Custom"     },
]

const STEPS = [
  { id:1, label:"Event Info", icon:FileText,   desc:"Title, description & banner"  },
  { id:2, label:"Format",     icon:Globe,      desc:"Online, in-person or hybrid"  },
  { id:3, label:"Schedule",   icon:Calendar,   desc:"Date, time & capacity"        },
  { id:4, label:"Pricing",    icon:DollarSign, desc:"Tickets & publish"            },
] as const

// ─── shared styles ─────────────────────────────────────────────────────────────
const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"
const inp  = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

// ─── shared ui ────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label:string; required?:boolean; hint?:string; children:React.ReactNode
}) {
  return (
    <div>
      <p className={LBL} style={{ color:"var(--t3)" }}>
        {label}{required && <span className="ml-0.5" style={{ color:"var(--p)" }}>*</span>}
      </p>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color:"var(--t3)" }}>{hint}</p>}
    </div>
  )
}
function Card({ title, sub, children }: { title:string; sub?:string; children:React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid var(--bd)", background:"var(--white)" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor:"var(--bd)" }}>
        <p className="text-[14px] font-bold" style={{ color:"var(--t1)" }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color:"var(--t3)" }}>{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// THUMBNAIL UPLOAD
// ════════════════════════════════════════════════════════════════════════════════
function ThumbnailUpload({ value, onChange }: { value:string; onChange:(url:string)=>void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const handleFile = (file:File) => { if (file.type.startsWith("image/")) onChange(URL.createObjectURL(file)) }
  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
      {!value ? (
        <div className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{ border:"2px dashed var(--bd)", background:"var(--bg)", minHeight:180 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) handleFile(f) }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:"var(--p)" }}>
            <UploadCloud className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold mb-1" style={{ color:"var(--t1)" }}>Upload banner</p>
            <p className="text-xs" style={{ color:"var(--t3)" }}>JPG, PNG, WebP · 16:9 · Max 3 MB</p>
          </div>
          <button type="button"
            className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
            style={{ background:"var(--p)", color:"#fff" }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
            Browse Files
          </button>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ border:"2px solid var(--bd)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => inputRef.current?.click()}>
          <img src={value} alt="" className="w-full aspect-video object-cover block" />
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(0,0,0,.55)" }}>
              <button type="button"
                className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
                style={{ background:"var(--p)", color:"#fff" }}
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
// STEP 1 — EVENT INFO
// ════════════════════════════════════════════════════════════════════════════════
function StepInfo({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  return (
    <div className="space-y-5">
      <Card title="Event Info" sub="What attendees will see when browsing">
        <div className="space-y-5">
          <Field label="Event Title" required>
            <Input placeholder="e.g. React Summit Tunis 2025"
              value={data.title} onChange={e => set("title", e.target.value)} className={inp} />
          </Field>
          <Field label="Description" required hint={`${data.description.length} / 1000`}>
            <Textarea
              placeholder="What will happen at your event? What can attendees expect?"
              value={data.description} onChange={e => set("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor:"var(--bd)", background:"var(--white)", color:"var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor="var(--p)"}
              onBlur={e  => (e.target as HTMLElement).style.borderColor="var(--bd)"} />
          </Field>
          <Field label="Category" required>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const on = data.category === c
                return (
                  <button key={c} type="button" onClick={() => set("category", c)}
                    className="h-8 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all border-2"
                    style={{
                      background:  on ? "var(--p)"  : "var(--white)",
                      borderColor: on ? "var(--p)"  : "var(--bd)",
                      color:       on ? "#fff"       : "var(--t2)",
                    }}>
                    {c}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Event Banner" sub="16:9 cover image · JPG, PNG, WebP">
        <ThumbnailUpload value={data.banner} onChange={v => set("banner", v)} />
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — FORMAT & LOCATION
// ════════════════════════════════════════════════════════════════════════════════
const FORMAT_OPTS = [
  { id:"online"  as EventFormat, Icon:Globe,   label:"Online",    desc:"Virtual meeting or livestream"   },
  { id:"offline" as EventFormat, Icon:MapPin,  label:"In-Person", desc:"Physical venue, people show up"  },
  { id:"hybrid"  as EventFormat, Icon:Layers2, label:"Hybrid",    desc:"Both online and at a venue"      },
]
function StepFormat({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  const showOffline = data.format === "offline" || data.format === "hybrid"
  const showOnline  = data.format === "online"  || data.format === "hybrid"
  return (
    <div className="space-y-5">
      <Card title="Event Format" sub="How will attendees join your event?">
        <div className="grid grid-cols-3 gap-3">
          {FORMAT_OPTS.map(opt => {
            const on = data.format === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => set("format", opt.id)}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 cursor-pointer transition-all"
                style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background:on?"var(--p)":"var(--bg)" }}>
                  <opt.Icon className="w-5 h-5" style={{ color:on?"#fff":"var(--t3)" }} strokeWidth={1.7} />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold" style={{ color:on?"var(--p)":"var(--t1)" }}>{opt.label}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color:"var(--t3)" }}>{opt.desc}</p>
                </div>
                {on && <Check className="w-4 h-4" style={{ color:"var(--p)" }} />}
              </button>
            )
          })}
        </div>
      </Card>

      {showOffline && (
        <Card title="Venue Details" sub="Where will the event take place?">
          <div className="space-y-4">
            <Field label="Venue Name" required={data.format==="offline"}>
              <Input placeholder="e.g. Maison de la Culture, Tunis" value={data.venueName}
                onChange={e => set("venueName", e.target.value)} className={inp} />
            </Field>
            <Field label="Address">
              <Input placeholder="Street address…" value={data.address}
                onChange={e => set("address", e.target.value)} className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City">
                <Input placeholder="City" value={data.city}
                  onChange={e => set("city", e.target.value)} className={inp} />
              </Field>
              <Field label="Country">
                <Input placeholder="Country" value={data.country}
                  onChange={e => set("country", e.target.value)} className={inp} />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {showOnline && (
        <Card title="Online Meeting" sub="Link attendees will use to join">
          <div className="space-y-4">
            <Field label="Platform">
              <div className="grid grid-cols-3 gap-2">
                {["Google Meet","Zoom","Teams","Whereby","YouTube Live","Custom"].map(p => {
                  const on = data.meetPlatform === p
                  return (
                    <button key={p} type="button" onClick={() => set("meetPlatform", p)}
                      className="h-9 px-3 rounded-xl text-[12px] font-semibold cursor-pointer transition-all border-2"
                      style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)", color:on?"var(--p)":"var(--t2)" }}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Meeting Link" hint="You can add or update this later">
              <Input placeholder="https://meet.google.com/xxx-xxxx-xxx" value={data.meetLink}
                onChange={e => set("meetLink", e.target.value)} className={inp} />
            </Field>
          </div>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — DATE & TIME
// ════════════════════════════════════════════════════════════════════════════════
function StepDateTime({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  return (
    <div className="space-y-5">
      <Card title="Event Schedule" sub="When does your event start and end?">
        <div className="grid grid-cols-2 gap-6">
          {/* Start */}
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[.08em]" style={{ color:"var(--p)" }}>Start</p>
            <Field label="Date" required>
              <Input type="date" value={data.startDate} onChange={e => set("startDate", e.target.value)} className={inp} />
            </Field>
            <Field label="Time" required>
              <Input type="time" value={data.startTime} onChange={e => set("startTime", e.target.value)} className={inp} />
            </Field>
          </div>
          {/* End */}
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[.08em]" style={{ color:"var(--t3)" }}>End</p>
            <Field label="Date" required>
              <Input type="date" value={data.endDate} onChange={e => set("endDate", e.target.value)} className={inp} />
            </Field>
            <Field label="Time" required>
              <Input type="time" value={data.endTime} onChange={e => set("endTime", e.target.value)} className={inp} />
            </Field>
          </div>
        </div>

        <div className="mt-5">
          <Field label="Timezone">
            <select value={data.timezone} onChange={e => set("timezone", e.target.value)}
              className={inp + " appearance-none cursor-pointer"}
              style={{ borderColor:"var(--bd)", background:"var(--white)", color:"var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor="var(--p)"}
              onBlur={e  => (e.target as HTMLElement).style.borderColor="var(--bd)"}>
              {TIMEZONES.map(tz => <option key={tz.v} value={tz.v}>{tz.l}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Capacity" sub="How many attendees can join?">
        <div className="flex items-center gap-4">
          <div style={{ flex: 1 }}>
            <Input type="number" min={1}
              disabled={data.capacity === "unlimited"}
              value={data.capacity === "unlimited" ? "" : data.capacity}
              placeholder={data.capacity === "unlimited" ? "∞" : ""}
              onChange={e => set("capacity", parseInt(e.target.value) || 1)}
              className={inp}
              style={{ opacity: data.capacity==="unlimited" ? 0.4 : 1 }} />
          </div>
          <button type="button"
            onClick={() => set("capacity", data.capacity==="unlimited" ? 100 : "unlimited")}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all shrink-0"
            style={{
              borderColor: data.capacity==="unlimited" ? "var(--p)" : "var(--bd)",
              background:  data.capacity==="unlimited" ? "var(--p2)" : "var(--white)",
            }}>
            <Infinity className="w-4 h-4" style={{ color: data.capacity==="unlimited" ? "var(--p)" : "var(--t3)" }} />
            <span className="text-[12px] font-bold" style={{ color: data.capacity==="unlimited" ? "var(--p)" : "var(--t2)" }}>
              Unlimited
            </span>
            {data.capacity==="unlimited" && <Check className="w-3.5 h-3.5" style={{ color:"var(--p)" }} />}
          </button>
        </div>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// TICKET FORM (inline)
// ════════════════════════════════════════════════════════════════════════════════
function TicketForm({ initial, onSave, onCancel }: {
  initial: TicketType | null; onSave:(t:TicketType)=>void; onCancel:()=>void
}) {
  const [form, setForm] = useState<Omit<TicketType,"id">>({
    name:"", tier:"general", pricing:"free", price:0,
    quantity:"unlimited", description:"", salesDeadline:"",
    ...(initial ?? {}),
  })
  const set = (k:keyof typeof form, v:unknown) => setForm(p => ({ ...p, [k]:v }))

  return (
    <div className="rounded-2xl border-2 p-5 space-y-4"
      style={{ background:"var(--p2)", borderColor:"var(--p3)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold" style={{ color:"var(--p)" }}>
          {initial ? "Edit Ticket" : "New Ticket Type"}
        </p>
        <button type="button" onClick={onCancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background:"var(--bg)", color:"var(--t3)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tier */}
      <div>
        <p className={LBL} style={{ color:"var(--t3)" }}>Tier</p>
        <div className="flex gap-2 flex-wrap">
          {TIERS.map(t => {
            const on = form.tier === t.id
            const c  = TIER_COLOR[t.id]
            return (
              <button key={t.id} type="button" onClick={() => set("tier", t.id)}
                className="h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-all border"
                style={on ? { background:c.color, color:"#fff", borderColor:"transparent" }
                          : { background:"var(--white)", color:"var(--t2)", borderColor:"var(--bd)" }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Name */}
      <Field label="Ticket Name" required>
        <Input placeholder="e.g. VIP Access" value={form.name} onChange={e => set("name", e.target.value)} className={inp} />
      </Field>

      {/* Pricing toggle */}
      <div>
        <p className={LBL} style={{ color:"var(--t3)" }}>Pricing</p>
        <div className="flex items-center p-1 rounded-xl w-fit gap-1" style={{ background:"var(--bg)", border:"1px solid var(--bd)" }}>
          {(["free","paid"] as PricingType[]).map(p => (
            <button key={p} type="button" onClick={() => set("pricing", p)}
              className="h-8 px-5 rounded-lg text-[12px] font-bold cursor-pointer transition-all capitalize"
              style={form.pricing===p ? { background:"var(--p)", color:"#fff" } : { background:"transparent", color:"var(--t3)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      {form.pricing === "paid" && (
        <Field label="Price (TND)" required>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold select-none" style={{ color:"var(--t3)" }}>TND</span>
            <Input type="number" min={0} value={form.price || ""}
              onChange={e => set("price", parseFloat(e.target.value)||0)}
              className={inp + " pl-16"} placeholder="0" />
          </div>
        </Field>
      )}

      {/* Quantity */}
      <div>
        <p className={LBL} style={{ color:"var(--t3)" }}>Quantity</p>
        <div className="flex items-center gap-3">
          <div style={{ width:140 }}>
            <Input type="number" min={1}
              disabled={form.quantity==="unlimited"}
              value={form.quantity==="unlimited" ? "" : form.quantity}
              placeholder={form.quantity==="unlimited" ? "∞" : ""}
              onChange={e => set("quantity", parseInt(e.target.value)||1)}
              className={inp}
              style={{ opacity: form.quantity==="unlimited" ? 0.4 : 1 }} />
          </div>
          <button type="button"
            onClick={() => set("quantity", form.quantity==="unlimited" ? 100 : "unlimited")}
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ color: form.quantity==="unlimited" ? "var(--p)" : "var(--t3)" }}>
            <div className="w-8 h-4 rounded-full relative transition-colors"
              style={{ background: form.quantity==="unlimited" ? "var(--p)" : "var(--bd)" }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: form.quantity==="unlimited" ? "17px" : "2px", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
            </div>
            <span className="text-[12px] font-semibold">Unlimited</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <Field label="Description (optional)">
        <Textarea value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="What's included with this ticket?"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
          style={{ borderColor:"var(--bd)", background:"var(--white)", color:"var(--t1)" }}
          onFocus={e => (e.target as HTMLElement).style.borderColor="var(--p)"}
          onBlur={e  => (e.target as HTMLElement).style.borderColor="var(--bd)"} />
      </Field>

      {/* Sale deadline */}
      <Field label="Sales Deadline (optional)">
        <Input type="datetime-local" value={form.salesDeadline}
          onChange={e => set("salesDeadline", e.target.value)} className={inp} style={{ maxWidth:260 }} />
      </Field>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button type="button" onClick={onCancel}
          className="flex-1 h-10 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-70 transition-opacity"
          style={{ background:"var(--white)", border:"1px solid var(--bd)", color:"var(--t2)" }}>
          Cancel
        </button>
        <button type="button"
          disabled={!form.name.trim()}
          onClick={() => onSave({ ...form, id: initial?.id ?? uid() })}
          className="flex-[2] h-10 rounded-xl text-[12px] font-bold text-white flex items-center justify-center
                     gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          style={{ background:"var(--p)" }}>
          <Check className="w-3.5 h-3.5" strokeWidth={1.7} />
          Save Ticket
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — PRICING (tickets + visibility)
// ════════════════════════════════════════════════════════════════════════════════
function StepPricing({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  const [formState, setFormState] = useState<"closed"|"adding"|string>("closed")
  const editing = typeof formState === "string" && formState !== "closed" && formState !== "adding"
    ? data.tickets.find(t => t.id === formState) ?? null
    : null

  const save = (t: TicketType) => {
    if (editing) { set("tickets", data.tickets.map(x => x.id===t.id ? t : x)) }
    else         { set("tickets", [...data.tickets, t]) }
    setFormState("closed")
  }
  const del = (id:string) => set("tickets", data.tickets.filter(t => t.id!==id))

  return (
    <div className="space-y-5">
      <Card title="Ticket Types" sub="Add one or more ticket categories for your event">
        <div className="space-y-3">

          {/* Existing tickets */}
          {data.tickets.map(t => {
            const c = TIER_COLOR[t.tier]
            const tier = TIERS.find(x => x.id===t.tier)?.label ?? t.tier
            return (
              <div key={t.id}
                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all"
                style={{ background:"var(--white)", borderColor:"var(--bd)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow="none"}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                  <Ticket className="w-4 h-4" style={{ color:c.color }} strokeWidth={1.7} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold truncate" style={{ color:"var(--t1)" }}>{t.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
                      style={{ background:c.bg, color:c.color, borderColor:c.border }}>{tier}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color:"var(--t3)" }}>
                    {t.pricing==="free" ? "Free" : `${t.price} TND`}
                    {" · "}
                    {t.quantity==="unlimited" ? "Unlimited seats" : `${t.quantity} seats`}
                    {t.description && ` · ${t.description}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => setFormState(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                    style={{ background:"var(--bg)", color:"var(--t3)" }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => del(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                    style={{ background:"rgba(239,68,68,.08)", color:"#ef4444" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {data.tickets.length === 0 && formState === "closed" && (
            <div className="rounded-2xl flex flex-col items-center justify-center py-10 gap-3"
              style={{ border:"2px dashed var(--bd)", background:"var(--bg)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:"var(--p2)" }}>
                <Ticket className="w-6 h-6" style={{ color:"var(--p)" }} strokeWidth={1.7} />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold" style={{ color:"var(--t2)" }}>No tickets yet</p>
                <p className="text-[11px] mt-0.5" style={{ color:"var(--t3)" }}>Add your first ticket type below</p>
              </div>
            </div>
          )}

          {/* Inline form */}
          {formState !== "closed" && (
            <TicketForm initial={editing} onSave={save} onCancel={() => setFormState("closed")} />
          )}

          {/* Add button */}
          {formState === "closed" && (
            <button type="button" onClick={() => setFormState("adding")}
              className="w-full h-11 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2
                         text-[12px] font-bold cursor-pointer transition-all hover:opacity-80"
              style={{ borderColor:"var(--p3)", color:"var(--p)", background:"var(--p2)" }}>
              <Plus className="w-4 h-4" strokeWidth={1.7} />
              Add Ticket Type
            </button>
          )}
        </div>
      </Card>

      <Card title="Publishing" sub="Who can see and register for this event?">
        <div className="grid grid-cols-2 gap-3">
          {([
            { val:true,  Icon:Globe, label:"Published", desc:"Visible to everyone"        },
            { val:false, Icon:Lock,  label:"Draft",     desc:"Hidden — not registerable"  },
          ] as const).map(opt => {
            const on = data.isPublished === opt.val
            return (
              <button key={String(opt.val)} type="button" onClick={() => set("isPublished", opt.val)}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:on?"var(--p)":"var(--bg)" }}>
                  <opt.Icon className="w-4 h-4" style={{ color:on?"#fff":"var(--t3)" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color:on?"var(--p)":"var(--t1)" }}>{opt.label}</p>
                  <p className="text-[11px]" style={{ color:"var(--t3)" }}>{opt.desc}</p>
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
    const defaults = { startVelocity:30, spread:360, ticks:80, zIndex:9999, colors }
    const rand     = (a:number, b:number) => Math.random()*(b-a)+a
    const end      = Date.now() + 3500
    const iv       = window.setInterval(() => {
      const left = end - Date.now()
      if (left<=0) return clearInterval(iv)
      const n = 60*(left/3500)
      confetti({ ...defaults, particleCount:n, origin:{ x:rand(.1,.3), y:Math.random()-.2 } })
      confetti({ ...defaults, particleCount:n, origin:{ x:rand(.7,.9), y:Math.random()-.2 } })
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
        style={{ background:"var(--p)", boxShadow:"0 12px 40px rgba(142,120,251,.5)", animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both" }}>
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </div>
      <div className="text-center" style={{ animation:"fadeUpS .5s .2s ease both" }}>
        <h2 className="text-2xl font-bold mb-1" style={{ color:"var(--t1)" }}>Event Created!</h2>
        <p className="text-sm" style={{ color:"var(--t3)" }}>Redirecting to your events…</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════
function Sidebar({ data, step, done }: { data:FormData; step:number; done:Set<number> }) {
  const progress = Math.round(((step-1) / STEPS.length) * 100)
  const fmtLabel = FORMAT_OPTS.find(f => f.id===data.format)?.label ?? "Online"
  const FmtIcon  = FORMAT_OPTS.find(f => f.id===data.format)?.Icon ?? Globe
  const paidTickets = data.tickets.filter(t => t.pricing==="paid")
  const lowestPrice = paidTickets.length ? Math.min(...paidTickets.map(t=>t.price)) : null

  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background:"var(--white)", borderColor:"var(--bd)" }}>

      {/* banner preview */}
      <div className="p-5 border-b" style={{ borderColor:"var(--bd)" }}>
        <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background:"var(--bg)", border:"1.5px dashed var(--bd)" }}>
          {data.banner
            ? <img src={data.banner} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 opacity-40">
                <Calendar className="w-6 h-6" style={{ color:"var(--t3)" }} />
                <span className="text-[10px]" style={{ color:"var(--t3)" }}>No banner</span>
              </div>
          }
        </div>
        <p className="text-[13px] font-bold leading-snug"
          style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
          {data.title || "Untitled Event"}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Format chip */}
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ background:"var(--p2)", color:"var(--p)" }}>
            <FmtIcon className="w-2.5 h-2.5" strokeWidth={1.7} />
            {fmtLabel}
          </span>
          {/* Start date */}
          {data.startDate && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background:"rgba(251,146,60,.12)", color:"var(--orange)" }}>
              <Calendar className="w-2.5 h-2.5" />
              {data.startDate}
            </span>
          )}
          {/* Price */}
          {data.tickets.length > 0 && lowestPrice !== null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background:"rgba(34,211,238,.12)", color:"var(--cyan)" }}>
              from {lowestPrice} TND
            </span>
          )}
          {data.tickets.length > 0 && lowestPrice === null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background:"rgba(34,211,238,.12)", color:"var(--cyan)" }}>
              Free
            </span>
          )}
        </div>
      </div>

      {/* progress + stats */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor:"var(--bd)" }}>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:"var(--t3)" }}>Progress</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color:"var(--p)" }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"var(--bg)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width:`${progress}%`, background:"var(--p)" }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: data.tickets.length,                                         label:"Tickets"  },
            { n: data.capacity==="unlimited" ? "∞" : data.capacity,          label:"Capacity" },
            { n: data.startDate ? 1 : 0,                                      label:"Date"     },
          ].map(item => (
            <div key={item.label} className="px-2 py-2.5 rounded-xl text-center" style={{ background:"var(--bg)" }}>
              <p className="text-[16px] font-bold leading-none tabular-nums" style={{ color:"var(--p)" }}>{item.n}</p>
              <p className="text-[9px] mt-0.5" style={{ color:"var(--t3)" }}>{item.label}</p>
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
                  style={{ color: active ? "var(--p)" : complete ? "var(--t1)" : "var(--t2)" }}>{s.label}</p>
                <p className="text-[10px] truncate" style={{ color:"var(--t3)" }}>{s.desc}</p>
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
const STEP_META: Record<number,{ title:string; sub:string }> = {
  1: { title:"Event Info",        sub:"Title, description, category & banner"    },
  2: { title:"Format & Location", sub:"How and where your event will take place" },
  3: { title:"Schedule",          sub:"Date, time and attendance capacity"       },
  4: { title:"Pricing",           sub:"Ticket types and event visibility"        },
}

const STEP_BLOCKER: Record<number,(d:FormData)=>string> = {
  1: d => !d.title.trim()       ? "Add an event title to continue"
        : !d.description.trim() ? "Add a description to continue"
        : !d.category           ? "Select a category to continue"
        : "",
  2: d => (d.format==="offline"||d.format==="hybrid") && !d.venueName.trim()
                                ? "Add a venue name for in-person events"
        : "",
  3: d => !d.startDate          ? "Set a start date"
        : !d.startTime          ? "Set a start time"
        : !d.endDate            ? "Set an end date"
        : !d.endTime            ? "Set an end time"
        : "",
  4: d => d.tickets.length === 0 ? "Add at least one ticket type"
        : "",
}

export function CreateEventForm() {
  const router = useRouter()

  const [step,         setStep]         = useState(1)
  const [error,        setError]        = useState("")
  const [success,      setSuccess]      = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [done]                          = useState<Set<number>>(new Set())

  const [data, setData] = useState<FormData>({
    title:"", description:"", category:"", banner:"",
    format:"online",
    venueName:"", address:"", city:"", country:"",
    meetPlatform:"Google Meet", meetLink:"",
    startDate:"", startTime:"", endDate:"", endTime:"",
    timezone:"UTC+1",
    capacity:"unlimited",
    tickets:[], isPublished:true,
  })

  const set = (field:keyof FormData, value:any) => setData(p => ({ ...p, [field]:value }))

  const blocker     = () => STEP_BLOCKER[step]?.(data) ?? ""
  const canContinue = () => blocker() === ""
  const goNext      = () => { if (canContinue()) { done.add(step); setStep(s => s+1) } }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      setSubmitStatus("Creating event…");    await new Promise(r => setTimeout(r, 400))
      setSubmitStatus("Saving tickets…");    await new Promise(r => setTimeout(r, 300))
      setSubmitStatus("Publishing…");        await new Promise(r => setTimeout(r, 300))

      const events: any[] = JSON.parse(localStorage.getItem("chabaqa_events") ?? "[]")
      events.unshift({ id:`event_${Date.now()}`, ...data, createdAt:new Date().toISOString() })
      localStorage.setItem("chabaqa_events", JSON.stringify(events))
      setSuccess(true)
      setTimeout(() => router.push("/creator/events"), 2800)
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

        {/* topbar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b"
          style={{ borderColor:"var(--bd)", background:"var(--white)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button type="button" onClick={() => router.push("/creator/events")}
                className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
                style={{ color:"var(--t3)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Events
              </button>
              <ChevronRight className="w-3 h-3" style={{ color:"var(--bd)" }} />
              <span className="text-xs font-medium" style={{ color:"var(--t2)" }}>New Event</span>
            </div>
            <h1 className="text-[15px] font-bold" style={{ color:"var(--t1)" }}>{STEP_META[step].title}</h1>
            <p className="text-[11px]" style={{ color:"var(--t3)" }}>{STEP_META[step].sub}</p>
          </div>
          <span className="text-[11px] font-bold tabular-nums px-3 py-1 rounded-full"
            style={{ background:"var(--p2)", color:"var(--p)" }}>
            {step} / {STEPS.length}
          </span>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {step === 1 && <StepInfo     data={data} set={set} />}
          {step === 2 && <StepFormat   data={data} set={set} />}
          {step === 3 && <StepDateTime data={data} set={set} />}
          {step === 4 && <StepPricing  data={data} set={set} />}
        </div>

        {/* bottom nav */}
        <div className="shrink-0 border-t" style={{ borderColor:"var(--bd)", background:"var(--white)" }}>
          {error && (
            <div className="px-8 py-3 flex items-start gap-2.5 border-b"
              style={{ background:"#fef2f2", borderColor:"#fca5a5" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:"#dc2626" }} />
              <p className="text-[13px] font-medium flex-1" style={{ color:"#b83232" }}>{error}</p>
              <button type="button" onClick={() => setError("")}
                className="text-[12px] font-bold underline cursor-pointer shrink-0" style={{ color:"#dc2626" }}>
                Dismiss
              </button>
            </div>
          )}

          <div className="px-8 py-4 flex items-center justify-between">
            {step > 1
              ? <button type="button" onClick={() => setStep(s => s-1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  style={{ border:"2px solid var(--bd)", color:"var(--t2)", background:"transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="var(--p2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              : <div />
            }

            {!canContinue() && !error && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color:"#f59e0b" }} />
                <p className="text-[11px] font-medium" style={{ color:"#92400e" }}>{blocker()}</p>
              </div>
            )}
            {canContinue() && !error && <div />}

            <button type="button"
              onClick={step === STEPS.length ? submit : goNext}
              disabled={!canContinue() || submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:cursor-not-allowed transition-all"
              style={{
                background: canContinue()&&!submitting ? "var(--p)" : "var(--p3)",
                opacity:    canContinue()&&!submitting ? 1 : 0.45,
                boxShadow:  canContinue()&&!submitting ? "0 4px 16px rgba(142,120,251,.4)" : "none",
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
                <>{data.isPublished ? "Publish Event" : "Save as Draft"} <Check className="w-4 h-4" /></>
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
