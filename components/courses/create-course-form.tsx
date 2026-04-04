"use client"

import confetti from "canvas-confetti"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, BookOpen, Zap, Star,
  DollarSign, Users, Plus, Trash2, Clock, Video,
  FileText, Globe, Lock, GripVertical, AlertCircle,
  ChevronRight, Pencil, UploadCloud, Link2, X, ImageIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
// ─── helpers ──────────────────────────────────────────────────────────────────
const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── types ────────────────────────────────────────────────────────────────────
interface Chapter {
  id: string; title: string; videoUrl: string
  duration: number; isFree: boolean; price: number; notes: string
  videoFile?: File | null
}
interface Section {
  id: string; title: string; chapters: Chapter[]
}
interface FormData {
  title: string; slug: string; description: string; thumbnail: string
  category: string; level: "beginner" | "intermediate" | "advanced" | ""
  duration: number; sections: Section[]; priceType: "free" | "paid"
  price: number; isPublished: boolean
}


const STEPS = [
  { id: 1, label: "Info",       icon: BookOpen,   desc: "Title, category & thumbnail" },
  { id: 2, label: "Curriculum", icon: FileText,   desc: "Sections & chapters"          },
  { id: 3, label: "Settings",   icon: Zap,        desc: "Level & duration"             },
  { id: 4, label: "Pricing",    icon: DollarSign, desc: "Free, paid & publish"         },
] as const

const CATEGORIES = ["Technology","Business","Design","Marketing","Education","Health","Music","Arts","Sports","Other"]

// ─── label / field helpers ────────────────────────────────────────────────────
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

const inp = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR  (fixed — never scrolls)
// ════════════════════════════════════════════════════════════════════════════════
function Sidebar({ step, data, done }: { step: number; data: FormData; done: Set<number> }) {
  const total    = data.sections.reduce((n, s) => n + s.chapters.length, 0)
  const progress = Math.round(((step - 1) / STEPS.length) * 100)

  return (
    <aside
      className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: "var(--white)", borderColor: "var(--bd)" }}
    >
      {/* ── thumbnail + title ───────────────────────────────────────────── */}
      <div className="p-5 border-b" style={{ borderColor: "var(--bd)" }}>
        <div
          className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background: "var(--bg)", border: "1.5px dashed var(--bd)" }}
        >
          {data.thumbnail
            ? <img src={data.thumbnail} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 opacity-40">
                <ImageIcon className="w-6 h-6" style={{ color: "var(--t3)" }} />
                <span className="text-[10px]" style={{ color: "var(--t3)" }}>No thumbnail</span>
              </div>
          }
        </div>

        <p className="text-[13px] font-bold leading-snug"
          style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
          {data.title || "Untitled Course"}
        </p>

        {(data.category || data.level) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {data.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: "var(--p2)", color: "var(--p)" }}>
                {data.category}
              </span>
            )}
            {data.level && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: "var(--bg)", color: "var(--t3)" }}>
                {data.level}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── progress + stats ────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--bd)" }}>
        {/* progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>
              Progress
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--p)" }}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--p)" }}
            />
          </div>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sections",  value: data.sections.length },
            { label: "Chapters",  value: total               },
            { label: "Price",     value: data.priceType === "free" ? "Free" : data.price > 0 ? `${data.price}` : "—" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: "var(--bg)" }}>
              <p className="text-[16px] font-bold leading-none" style={{ color: "var(--p)" }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--t3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── steps nav ────────────────────────────────────────────────────── */}
      <nav className="flex-1 p-4 space-y-1">
        {STEPS.map(s => {
          const isDone   = done.has(s.id) && step > s.id
          const isActive = step === s.id
          return (
            <div key={s.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 select-none"
              style={{
                background: isActive ? "var(--p2)" : "transparent",
              }}>
              <div
                className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background: isDone ? "var(--p)" : isActive ? "var(--p)" : "var(--bg)",
                }}>
                {isDone
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <s.icon className="w-3.5 h-3.5" style={{ color: isActive ? "#fff" : "var(--t3)" }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight"
                  style={{ color: isActive ? "var(--p)" : isDone ? "var(--t1)" : "var(--t3)" }}>
                  {s.label}
                </p>
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
// THUMBNAIL UPLOAD COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    onChange(url)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {!value ? (
        <div
          className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150"
          style={{
            border: "2px dashed var(--bd)",
            background: "var(--bg)",
            minHeight: 180,
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--p)" }}
          >
            <UploadCloud className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold mb-1" style={{ color: "var(--t1)" }}>Upload thumbnail</p>
            <p className="text-xs" style={{ color: "var(--t3)" }}>JPG, PNG, WebP · 16:9 · Max 3 MB</p>
          </div>
          <button
            type="button"
            className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer transition-all"
            style={{ background: "var(--p)", color: "#fff" }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div
          className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ border: "2px solid var(--bd)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => inputRef.current?.click()}
        >
          <img src={value} alt="Thumbnail preview" className="w-full aspect-video object-cover block" />
          {hovered && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              <button
                type="button"
                className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
                style={{ background: "var(--p)", color: "#fff" }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
              >
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
// VIDEO FIELD COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
function VideoField({
  videoUrl,
  videoFile,
  onUrlChange,
  onFileChange,
}: {
  videoUrl: string
  videoFile?: File | null
  onUrlChange: (url: string) => void
  onFileChange: (file: File | null) => void
}) {
  const [mode, setMode] = useState<"upload" | "url">("url")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    onFileChange(file)
    onUrlChange("")
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("video/")) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      {/* toggle tabs */}
      <div
        className="flex rounded-lg overflow-hidden mb-2"
        style={{ border: "1px solid var(--bd)", background: "var(--bg)", width: "fit-content" }}
      >
        {(["upload", "url"] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-all"
            style={{
              background: mode === m ? "var(--p)" : "transparent",
              color: mode === m ? "#fff" : "var(--t3)",
            }}
          >
            {m === "upload" ? "Upload Video" : "YouTube / Vimeo"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
          <input
            type="file"
            accept="video/*"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
          {!videoFile ? (
            <div
              className="w-full rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
              style={{
                border: `1.5px dashed ${dragOver ? "var(--p)" : "var(--bd)"}`,
                background: dragOver ? "var(--p2)" : "var(--bg)",
                minHeight: 72,
                padding: "12px",
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="w-5 h-5" style={{ color: "var(--p)" }} />
              <p className="text-[11px] font-medium" style={{ color: "var(--t2)" }}>
                Drag & drop or <span style={{ color: "var(--p)" }}>browse</span>
              </p>
              <p className="text-[10px]" style={{ color: "var(--t3)" }}>MP4, MOV, WebM</p>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--p2)", border: "1px solid var(--p3)" }}
            >
              <Video className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p)" }} />
              <span className="flex-1 text-[11px] font-medium truncate min-w-0" style={{ color: "var(--t1)" }}>
                {videoFile.name}
              </span>
              <button
                type="button"
                onClick={() => { onFileChange(null) }}
                className="p-0.5 rounded cursor-pointer"
                style={{ color: "var(--t3)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="relative">
          <Link2
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: "var(--t3)" }}
          />
          <input
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={e => { onUrlChange(e.target.value); onFileChange(null) }}
            className="w-full h-8 pl-7 pr-2 text-[11px] rounded-lg border outline-none transition-colors"
            style={{ borderColor: "var(--bd)", background: "var(--bg)", color: "var(--t1)" }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--bd)"}
          />
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — COURSE INFO
// ════════════════════════════════════════════════════════════════════════════════
const LEVELS = [
  { id: "beginner",     label: "Beginner",     desc: "No prior knowledge",    icon: BookOpen, color: "var(--cyan)"   },
  { id: "intermediate", label: "Intermediate", desc: "Some basics expected",  icon: Zap,      color: "var(--orange)" },
  { id: "advanced",     label: "Advanced",     desc: "Experienced learners",  icon: Star,     color: "var(--pink)"   },
]

function StepInfo({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Basic Details" sub="How students will find and understand your course">
        <div className="space-y-5">
          <Field label="Course Title" required>
            <Input placeholder="e.g. Motion Design Masterclass"
              value={data.title} onChange={e => set("title", e.target.value)} className={inp} />
          </Field>

          <Field label="URL Slug" hint="Auto-generated — you can edit it">
            <div className="flex h-11 rounded-xl border-2 overflow-hidden transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
              <span className="flex items-center px-3 text-[11px] font-mono border-r shrink-0 select-none"
                style={{ background: "var(--bg)", color: "var(--t3)", borderColor: "var(--bd)" }}>
                /courses/
              </span>
              <input value={data.slug} onChange={e => set("slug", slugify(e.target.value))}
                className="flex-1 px-3 font-mono text-sm bg-transparent outline-none"
                style={{ color: "var(--t1)" }} />
            </div>
          </Field>

          <Field label="Description" required hint={`${data.description.length} / 1000`}>
            <Textarea
              placeholder="What will students learn? Who is it for?"
              value={data.description} onChange={e => set("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-0 transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--white)", color: "var(--t1)", lineHeight: 1.6 }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--bd)"}
            />
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

      <Card title="Thumbnail" sub="16:9 ratio · max 3 MB">
        <ThumbnailUpload value={data.thumbnail} onChange={url => set("thumbnail", url)} />
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — SETTINGS
// ════════════════════════════════════════════════════════════════════════════════
function StepSettings({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Difficulty Level" sub="Who is this course designed for?">
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map(lvl => {
            const on = data.level === lvl.id
            return (
              <button key={lvl.id} type="button" onClick={() => set("level", lvl.id)}
                className="relative flex flex-col gap-3 p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-150"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: lvl.color }}>
                  <lvl.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: on ? "var(--p)" : "var(--t1)" }}>{lvl.label}</p>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--t3)" }}>{lvl.desc}</p>
                </div>
                {on && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--p)" }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="Total Duration" sub="Approximate course length in hours">
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: 180 }}>
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "var(--t3)" }} />
            <Input type="number" min={1} placeholder="e.g. 8"
              value={data.duration || ""}
              onChange={e => set("duration", parseInt(e.target.value) || 0)}
              className={`${inp} pl-9`} />
          </div>
          <p className="text-[11px]" style={{ color: "var(--t3)" }}>hours total for students to complete</p>
        </div>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — CURRICULUM  (two-panel: section list ← → chapter editor)
// ════════════════════════════════════════════════════════════════════════════════
function ChapterEditor({ ch, idx, secId, onUpdate, onDelete, onVideoFileChange }: {
  ch: Chapter; idx: number; secId: string
  onUpdate: (secId: string, chId: string, f: keyof Chapter, v: any) => void
  onDelete: (secId: string, chId: string) => void
  onVideoFileChange: (secId: string, chId: string, file: File | null) => void
}) {
  const upd = (f: keyof Chapter, v: any) => onUpdate(secId, ch.id, f, v)

  return (
    <div
      className="rounded-xl border transition-all duration-150"
      style={{ background: "var(--white)", borderColor: "var(--bd)" }}>
      {/* chapter title row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-25 cursor-grab" style={{ color: "var(--t3)" }} />
        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
          style={{ background: "var(--p)" }}>{idx + 1}</span>
        <input
          value={ch.title}
          onChange={e => upd("title", e.target.value)}
          placeholder={`Chapter ${idx + 1} title`}
          className="flex-1 text-[13px] font-medium bg-transparent outline-none min-w-0"
          style={{ color: "var(--t1)" }}
        />
        <button type="button" onClick={() => onDelete(secId, ch.id)}
          className="p-1.5 rounded-lg cursor-pointer shrink-0 transition-colors"
          style={{ color: "var(--t3)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t3)"}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* details */}
      <div className="px-3 pb-3 border-t pt-2.5 space-y-2.5"
        style={{ borderColor: "var(--bd)" }}>
        {/* video field — full width */}
        <VideoField
          videoUrl={ch.videoUrl}
          videoFile={ch.videoFile}
          onUrlChange={v => upd("videoUrl", v)}
          onFileChange={file => onVideoFileChange(secId, ch.id, file)}
        />

        <div className="grid grid-cols-12 gap-2">
          {/* duration */}
          <div className="col-span-3 relative">
            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: "var(--t3)" }} />
            <input type="number" min={1} placeholder="Min"
              value={ch.duration || ""}
              onChange={e => upd("duration", parseInt(e.target.value) || 0)}
              className="w-full h-8 pl-6 pr-2 text-[11px] rounded-lg border outline-none transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--bg)", color: "var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </div>

          {/* notes */}
          <div className="col-span-5">
            <input placeholder="Notes (optional)" value={ch.notes}
              onChange={e => upd("notes", e.target.value)}
              className="w-full h-8 px-2.5 text-[11px] rounded-lg border outline-none transition-colors"
              style={{ borderColor: "var(--bd)", background: "var(--bg)", color: "var(--t1)" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--p)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--bd)"} />
          </div>

          {/* free/paid */}
          <div className="col-span-4 flex items-center gap-1">
            {[
              { val: true,  label: "Free", color: "#10b981" },
              { val: false, label: "Paid", color: "var(--p)" },
            ].map(opt => (
              <button key={String(opt.val)} type="button" onClick={() => upd("isFree", opt.val)}
                className="flex-1 h-8 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                style={{
                  background: ch.isFree === opt.val ? opt.color : "var(--bg)",
                  color:      ch.isFree === opt.val ? "#fff" : "var(--t3)",
                  border:     `1px solid ${ch.isFree === opt.val ? opt.color : "var(--bd)"}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* price if paid */}
        {!ch.isFree && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Price</span>
            <input type="number" min={1} step={0.5} placeholder="TND"
              value={ch.price || ""}
              onChange={e => upd("price", parseFloat(e.target.value) || 0)}
              className="w-28 h-8 px-3 text-[12px] font-semibold rounded-lg border outline-none transition-colors"
              style={{ borderColor: "var(--p)", background: "var(--p2)", color: "var(--p)" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StepCurriculum({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  const [activeSec, setActiveSec] = useState<string | null>(
    data.sections[0]?.id ?? null
  )

  // keep activeSec in sync when sections change
  useEffect(() => {
    if (data.sections.length === 0) { setActiveSec(null); return }
    if (!data.sections.find(s => s.id === activeSec)) {
      setActiveSec(data.sections[data.sections.length - 1].id)
    }
  }, [data.sections])

  const addSection = () => {
    const id = uid()
    set("sections", [...data.sections, { id, title: "", chapters: [] }])
    setActiveSec(id)
  }
  const updateSectionTitle = (id: string, title: string) =>
    set("sections", data.sections.map(s => s.id === id ? { ...s, title } : s))
  const deleteSection = (id: string) =>
    set("sections", data.sections.filter(s => s.id !== id))
  const addChapter = (secId: string) =>
    set("sections", data.sections.map(s => s.id === secId
      ? { ...s, chapters: [...s.chapters, { id: uid(), title: "", videoUrl: "", duration: 0, isFree: true, price: 0, notes: "", videoFile: null }] }
      : s))
  const updateChapter = (secId: string, chId: string, f: keyof Chapter, v: any) =>
    set("sections", data.sections.map(s => s.id === secId
      ? { ...s, chapters: s.chapters.map(c => c.id === chId ? { ...c, [f]: v } : c) }
      : s))
  const deleteChapter = (secId: string, chId: string) =>
    set("sections", data.sections.map(s => s.id === secId
      ? { ...s, chapters: s.chapters.filter(c => c.id !== chId) }
      : s))
  const updateVideoFile = (secId: string, chId: string, file: File | null) =>
    set("sections", data.sections.map(s => s.id === secId
      ? { ...s, chapters: s.chapters.map(c => c.id === chId ? { ...c, videoFile: file } : c) }
      : s))

  const active = data.sections.find(s => s.id === activeSec) ?? null

  return (
    <div className="flex gap-5 h-full" style={{ minHeight: 520 }}>

      {/* ── LEFT: section picker ─────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 flex flex-col">
        <div className="rounded-2xl overflow-hidden flex flex-col h-full"
          style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>

          {/* header */}
          <div className="px-3 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor: "var(--bd)", background: "var(--bg)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--t3)" }}>
              Sections <span style={{ color: "var(--p)" }}>({data.sections.length})</span>
            </p>
          </div>

          {/* section list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {data.sections.length === 0 && (
              <div className="flex flex-col items-center py-10 gap-2 px-3 text-center">
                <BookOpen className="w-8 h-8 opacity-20" style={{ color: "var(--t3)" }} />
                <p className="text-[11px] leading-snug" style={{ color: "var(--t3)" }}>
                  Click <strong style={{ color: "var(--p)" }}>+ Add</strong> above to create your first section
                </p>
              </div>
            )}
            {data.sections.map((s, i) => {
              const isAct     = activeSec === s.id
              const hasTitle  = s.title.trim() !== ""
              const hasChaps  = s.chapters.length > 0
              const warn      = !hasTitle || (hasTitle && !hasChaps)
              return (
                <div key={s.id}
                  onClick={() => setActiveSec(s.id)}
                  className="group flex items-center gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{
                    background: isAct ? "var(--p2)" : "transparent",
                    borderLeft: isAct ? "3px solid var(--p)" : warn ? "3px solid #f59e0b" : "3px solid transparent",
                  }}>
                  {/* number badge */}
                  <span className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
                    style={{ background: isAct ? "var(--p)" : warn ? "#f59e0b" : "var(--t3)", opacity: isAct ? 1 : 0.7 }}>
                    {i + 1}
                  </span>

                  {/* title */}
                  <span className="flex-1 text-[12px] font-medium truncate min-w-0"
                    style={{ color: isAct ? "var(--p)" : hasTitle ? "var(--t1)" : "#f59e0b" }}>
                    {s.title || "⚠ Needs a title"}
                  </span>

                  {/* chapter count or warning */}
                  {hasTitle && (
                    <span className="text-[10px] shrink-0 tabular-nums font-medium"
                      style={{ color: hasChaps ? "var(--t3)" : "#f59e0b" }}>
                      {s.chapters.length === 0 ? "0 ch" : `${s.chapters.length}ch`}
                    </span>
                  )}

                  {/* delete (hover) */}
                  <button type="button"
                    onClick={e => { e.stopPropagation(); deleteSection(s.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded cursor-pointer transition-all shrink-0"
                    style={{ color: "var(--t3)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t3)"}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* add section — always visible at bottom */}
          <div className="p-2 border-t shrink-0" style={{ borderColor: "var(--bd)" }}>
            <button type="button" onClick={addSection}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
              style={{ border: "1.5px dashed var(--p3)", color: "var(--p)", background: "transparent" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <Plus className="w-3 h-3" /> New Section
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: chapter editor ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--bd)", background: "var(--white)" }}>

        {!active ? (
          /* no section selected */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--p2)" }}>
              <FileText className="w-7 h-7" style={{ color: "var(--p)" }} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--t1)" }}>
                {data.sections.length === 0 ? "No sections yet" : "Select a section"}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--t3)" }}>
                {data.sections.length === 0
                  ? <>Click <strong style={{ color: "var(--p)" }}>+ Add</strong> in the left panel to create your first section, then add chapters inside it.</>
                  : "Click a section on the left to edit its title and chapters"}
              </p>
            </div>
            {data.sections.length === 0 && (
              <button type="button" onClick={addSection}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: "var(--p)", boxShadow: "0 4px 16px rgba(142,120,251,.35)" }}>
                <Plus className="w-4 h-4" /> Create First Section
              </button>
            )}
          </div>
        ) : (
          <>
            {/* section title — prominent editable field */}
            <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--bd)", background: "var(--p2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--p)" }}>
                Section {data.sections.findIndex(s => s.id === active.id) + 1} — Title
              </p>
              <div className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p)" }} />
                <input
                  value={active.title}
                  onChange={e => updateSectionTitle(active.id, e.target.value)}
                  placeholder="e.g. Introduction to Motion Design"
                  className="flex-1 bg-transparent text-[15px] font-bold outline-none min-w-0 placeholder:font-normal"
                  style={{ color: active.title ? "var(--t1)" : "var(--t3)" }}
                  autoFocus={!active.title}
                />
                {!active.title && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0"
                    style={{ background: "#fef3c7", color: "#92400e" }}>
                    Required
                  </span>
                )}
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: "var(--t3)" }}>
                {active.chapters.length} chapter{active.chapters.length !== 1 ? "s" : ""} in this section
              </p>
            </div>

            {/* add chapter — top */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <button type="button" onClick={() => addChapter(active.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                style={{ border: "1.5px dashed var(--p3)", color: "var(--p)", background: "transparent" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--p2)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <Plus className="w-4 h-4" /> Add Chapter
              </button>
            </div>

            {/* chapter list — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
              {active.chapters.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Video className="w-8 h-8 opacity-20" style={{ color: "var(--t3)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>No chapters yet</p>
                  <p className="text-xs" style={{ color: "var(--t3)" }}>Click "Add Chapter" above to start</p>
                </div>
              )}
              {active.chapters.map((ch, i) => (
                <ChapterEditor
                  key={ch.id} ch={ch} idx={i} secId={active.id}
                  onUpdate={updateChapter} onDelete={deleteChapter}
                  onVideoFileChange={updateVideoFile}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — PRICING
// ════════════════════════════════════════════════════════════════════════════════
const PRICING_OPTIONS = [
  { id: "free", icon: Users,      label: "Free",  sub: "Anyone can enroll — maximise your reach",        color: "var(--cyan)"   },
  { id: "paid", icon: DollarSign, label: "Paid",  sub: "Set a one-time price — earn from your knowledge", color: "var(--orange)" },
]

function StepPricing({ data, set }: { data: FormData; set: (f: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <Card title="Pricing Model" sub="You can change this after publishing">
        <div className="space-y-3">
          {PRICING_OPTIONS.map(opt => {
            const on = data.priceType === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => set("priceType", opt.id as "free" | "paid")}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 text-left"
                style={{ borderColor: on ? "var(--p)" : "var(--bd)", background: on ? "var(--p2)" : "var(--white)" }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: opt.color }}
                >
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
        <Card title="Set Your Price" sub="Students pay this once for full access">
          <div className="flex items-center gap-4">
            <div className="flex h-12 rounded-xl border-2 overflow-hidden"
              style={{ borderColor: "var(--p)", background: "var(--white)" }}>
              <span className="flex items-center px-4 text-sm font-bold border-r select-none"
                style={{ background: "var(--p2)", color: "var(--p)", borderColor: "var(--p)" }}>
                TND
              </span>
              <input type="number" min={1} step={0.5} placeholder="0.00"
                value={data.price || ""}
                onChange={e => set("price", parseFloat(e.target.value) || 0)}
                className="w-32 h-full px-4 text-lg font-bold bg-transparent outline-none"
                style={{ color: "var(--t1)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--t3)" }}>
              Free chapters in your curriculum act as previews for paid students.
            </p>
          </div>
        </Card>
      )}

      <Card title="Publishing" sub="Choose when students can access your course">
        <div className="grid grid-cols-2 gap-3">
          {([
            { val: true,  icon: Globe, label: "Publish Now",   desc: "Live immediately after creation" },
            { val: false, icon: Lock,  label: "Save as Draft", desc: "Publish manually when ready"    },
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
// MAIN
// ════════════════════════════════════════════════════════════════════════════════
const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: "Course Info",  sub: "Define your course identity and category"  },
  2: { title: "Curriculum",   sub: "Build sections and chapters"               },
  3: { title: "Settings",     sub: "Difficulty level and duration"             },
  4: { title: "Pricing",      sub: "Monetize and publish your course"          },
}

function SuccessScreen() {
  useEffect(() => {
    const colors = ["#8e78fb", "#fb923c", "#22d3ee", "#f472b6", "#a78bfa", "#ffffff"]
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min
    const duration = 3500
    const end = Date.now() + duration

    const interval = window.setInterval(() => {
      const timeLeft = end - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 60 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--p)", boxShadow: "0 12px 40px rgba(142,120,251,.5)", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </div>

      <div className="text-center" style={{ animation: "fadeUp .5s .2s ease both" }}>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--t1)" }}>Course Published!</h2>
        <p className="text-sm" style={{ color: "var(--t3)" }}>Redirecting to your courses…</p>
      </div>
    </div>
  )
}

export function CreateCourseForm() {
  const router = useRouter()
  const [step, setStep]                 = useState(1)
  const [error, setError]               = useState("")
  const [success, setSuccess]           = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [done]                          = useState<Set<number>>(new Set())
  const [data, setData] = useState<FormData>({
    title: "", slug: "", description: "", thumbnail: "",
    category: "", level: "", duration: 0,
    sections: [], priceType: "free", price: 0, isPublished: true,
  })

  const set = (field: keyof FormData, value: any) =>
    field === "title"
      ? setData(p => ({ ...p, title: value, slug: slugify(value) }))
      : setData(p => ({ ...p, [field]: value }))

  // returns null if ok, or an error string explaining what's missing
  const step2Blocker = (): string | null => {
    if (data.sections.length === 0) return "Add at least one section to continue"
    const unnamedIdx = data.sections.findIndex(s => !s.title.trim())
    if (unnamedIdx !== -1) return `Section ${unnamedIdx + 1} is missing a title — name it in the header`
    if (!data.sections.some(s => s.chapters.length > 0)) return "Add at least one chapter to a section"
    const emptyChapterSec = data.sections.find(s => s.chapters.some(c => !c.title.trim()))
    if (emptyChapterSec) return `A chapter in "${emptyChapterSec.title}" is missing a title`
    return null
  }

  const canContinue = () => {
    switch (step) {
      case 1: return !!(data.title.trim() && data.description.trim() && data.category)
      case 2: return step2Blocker() === null
      case 3: return !!(data.level && data.duration > 0)
      case 4: return data.priceType === "free" || (data.priceType === "paid" && data.price > 0)
      default: return false
    }
  }

  const goNext = () => { if (canContinue()) { done.add(step); setStep(s => s + 1) } }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      // ── Mock: simulate course creation steps ──────────────────────────────
      setSubmitStatus("Creating course…")
      await new Promise(r => setTimeout(r, 600))

      for (let si = 0; si < data.sections.length; si++) {
        setSubmitStatus(`Section ${si + 1} / ${data.sections.length}…`)
        await new Promise(r => setTimeout(r, 200))
        for (let ci = 0; ci < data.sections[si].chapters.length; ci++) {
          setSubmitStatus(`Chapter ${ci + 1}/${data.sections[si].chapters.length} in section ${si + 1}…`)
          await new Promise(r => setTimeout(r, 150))
        }
      }

      const mockId = `mock_${Date.now()}`
      const totalChapters = data.sections.reduce((n, s) => n + s.chapters.length, 0)

      localStorage.setItem("chabaqa_last_course", JSON.stringify({
        id: mockId,
        title: data.title,
        thumbnail: data.thumbnail,
        level: data.level,
        duration: data.duration,
        priceType: data.priceType,
        price: data.price,
        isPublished: data.isPublished,
        sectionsCount: data.sections.length,
        chaptersCount: totalChapters,
      }))

      setSuccess(true)
      setTimeout(() => router.push("/creator/courses"), 2800)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false); setSubmitStatus("")
    }
  }

  if (success) {
    return <SuccessScreen />
  }

  const isCurriculum = step === 2

  return (
    <div className="flex flex-1 h-full overflow-hidden" style={{ minHeight: 0 }}>

      {/* ═══ FIXED SIDEBAR ═══════════════════════════════════════════════════ */}
      <Sidebar step={step} data={data} done={done} />

      {/* ═══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* top breadcrumb bar */}
        <div className="px-8 py-4 border-b shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button type="button" onClick={() => router.push("/creator/courses")}
                className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
                style={{ color: "var(--t3)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Courses
              </button>
              <ChevronRight className="w-3 h-3" style={{ color: "var(--bd)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--t2)" }}>New Course</span>
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
        <div className={`flex-1 overflow-y-auto ${isCurriculum ? "p-6" : "px-8 py-7"}`}>
          {step === 1 && <StepInfo       data={data} set={set} />}
          {step === 2 && <StepCurriculum data={data} set={set} />}
          {step === 3 && <StepSettings   data={data} set={set} />}
          {step === 4 && <StepPricing    data={data} set={set} />}
        </div>

        {/* sticky bottom nav bar */}
        <div className="shrink-0 border-t" style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
          {/* error banner — always visible above the buttons */}
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

          {!canContinue() && step < STEPS.length && !error && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f59e0b" }} />
              <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>
                {step === 2 ? step2Blocker() : "Fill in all required fields to continue"}
              </p>
            </div>
          )}
          {(canContinue() || step === STEPS.length) && !error && <div />}

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
                {submitStatus || "Creating…"}
              </>
            ) : step === STEPS.length ? (
              <>{data.isPublished ? "Publish Course" : "Save as Draft"} <Check className="w-4 h-4" /></>
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
