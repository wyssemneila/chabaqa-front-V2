"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, ChevronRight,
  UploadCloud, FileText, Globe, Lock, DollarSign, Package,
  Plus, Trash2, X, Users, Star, ImageIcon, Paperclip,
  FileArchive, Film, Music, Code, PenTool, File,
  Tag, ShieldCheck, Layers, GripVertical,
} from "lucide-react"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 9)
const fmtSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024, sizes = ["B","KB","MB","GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ─── types ────────────────────────────────────────────────────────────────────
interface ProductFile {
  id: string; name: string; description: string
  file: File | null; size: number; ext: string
}

interface PricingTier {
  id: string; name: string; price: number
  description: string; features: string[]
  isPopular: boolean
}

interface FormData {
  // Step 1 — Info
  title: string; description: string; category: string; thumbnail: string
  // Step 2 — Files
  files: ProductFile[]; previewImages: string[]
  // Step 3 — Details
  version: string; requirements: string
  whatIncluded: string[]; license: "personal" | "commercial" | "extended"
  // Step 4 — Pricing
  priceType: "free" | "paid"; price: number
  hasTiers: boolean; tiers: PricingTier[]
  isPublished: boolean
}

// ─── constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Technology","Business","Design","Marketing","Education","Health","Music","Arts","Sports","Other"]

const LICENSES = [
  { id: "personal"   as const, label: "Personal",   desc: "For personal use only — no resale",              color: "var(--cyan)"   },
  { id: "commercial" as const, label: "Commercial",  desc: "Use in client & commercial projects",            color: "var(--p)"      },
  { id: "extended"   as const, label: "Extended",    desc: "Unlimited use including resale & redistribution", color: "var(--orange)" },
]

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  zip: FileArchive, rar: FileArchive, "7z": FileArchive, tar: FileArchive,
  mp4: Film, mov: Film, avi: Film, mkv: Film,
  mp3: Music, wav: Music, ogg: Music,
  js: Code, ts: Code, jsx: Code, tsx: Code, py: Code, html: Code, css: Code, json: Code,
  fig: PenTool, sketch: PenTool, xd: PenTool, psd: PenTool, ai: PenTool,
  pdf: FileText, doc: FileText, docx: FileText, txt: FileText,
  jpg: ImageIcon, jpeg: ImageIcon, png: ImageIcon, svg: ImageIcon, webp: ImageIcon,
}
const getFileIcon = (ext: string) => FILE_TYPE_ICONS[ext.toLowerCase()] ?? File

const STEPS_DEF = [
  { id:1, label:"Info",     icon:FileText,  desc:"Title, category & thumbnail"   },
  { id:2, label:"Files",    icon:Package,   desc:"Upload your digital files"      },
  { id:3, label:"Details",  icon:Layers,    desc:"License, version & inclusions"  },
  { id:4, label:"Pricing",  icon:DollarSign,desc:"Free, paid & variations"        },
] as const

const STEP_META: Record<number,{ title:string; sub:string }> = {
  1: { title:"Product Info",    sub:"What buyers will see when browsing"          },
  2: { title:"Product Files",   sub:"Upload the digital files buyers will receive" },
  3: { title:"Details",         sub:"License, version and what's included"        },
  4: { title:"Pricing",         sub:"Set your price and optional tier variations"  },
}

// ─── shared styles ─────────────────────────────────────────────────────────────
const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"
const inp  = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

function Field({ label, required, hint, children }: { label:string; required?:boolean; hint?:string; children:React.ReactNode }) {
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
  const ref = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const handle = (file:File) => { if (file.type.startsWith("image/")) onChange(URL.createObjectURL(file)) }
  return (
    <div>
      <input type="file" accept="image/*" ref={ref} className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handle(f) }} />
      {!value ? (
        <div className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{ border:"2px dashed var(--bd)", background:"var(--bg)", minHeight:180 }}
          onClick={() => ref.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) handle(f) }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:"var(--p)" }}>
            <UploadCloud className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold mb-1" style={{ color:"var(--t1)" }}>Upload cover image</p>
            <p className="text-xs" style={{ color:"var(--t3)" }}>JPG, PNG, WebP · 16:9 · Max 3 MB</p>
          </div>
          <button type="button" className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
            style={{ background:"var(--p)", color:"#fff" }}
            onClick={e => { e.stopPropagation(); ref.current?.click() }}>Browse Files</button>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
          style={{ border:"2px solid var(--bd)" }}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onClick={() => ref.current?.click()}>
          <img src={value} alt="Product thumbnail preview" loading="lazy" className="w-full aspect-video object-cover block" />
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(0,0,0,.55)" }}>
              <button type="button" className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
                style={{ background:"var(--p)", color:"#fff" }}
                onClick={e => { e.stopPropagation(); ref.current?.click() }}>Change</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════
function Sidebar({ wizardStep, data, done }: { wizardStep:number; data:FormData; done:Set<number> }) {
  const progress = Math.round(((wizardStep-1) / STEPS_DEF.length) * 100)
  const totalSize = data.files.reduce((acc, f) => acc + f.size, 0)

  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background:"var(--white)", borderColor:"var(--bd)" }}>

      {/* thumbnail + title */}
      <div className="p-5 border-b" style={{ borderColor:"var(--bd)" }}>
        <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background:"var(--bg)", border:"1.5px dashed var(--bd)" }}>
          {data.thumbnail
            ? <img src={data.thumbnail} alt="Product thumbnail preview" loading="lazy" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 opacity-40">
                <Package className="w-6 h-6" style={{ color:"var(--t3)" }} />
                <span className="text-[10px]" style={{ color:"var(--t3)" }}>No cover</span>
              </div>
          }
        </div>
        <p className="text-[13px] font-bold leading-snug"
          style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
          {data.title || "Untitled Product"}
        </p>
        {(data.category || data.license) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {data.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background:"var(--p2)", color:"var(--p)" }}>{data.category}</span>
            )}
            {data.license && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background:"var(--bg)", color:"var(--t3)" }}>{data.license}</span>
            )}
          </div>
        )}
      </div>

      {/* progress + stats */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor:"var(--bd)" }}>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:"var(--t3)" }}>Progress</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color:"var(--p)" }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"var(--bg)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${progress}%`, background:"var(--p)" }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"Files",  value: data.files.length || "—"                                          },
            { label:"Size",   value: totalSize > 0 ? fmtSize(totalSize) : "—"                          },
            { label:"Price",  value: data.priceType==="free" ? "Free" : data.price > 0 ? `${data.price}` : "—" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-2 py-2.5 text-center" style={{ background:"var(--bg)" }}>
              <p className="text-[16px] font-bold leading-none" style={{ color:"var(--p)" }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color:"var(--t3)" }}>{s.label}</p>
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
                <p className="text-[10px]" style={{ color:"var(--t3)" }}>{s.desc}</p>
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
function StepInfo({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  return (
    <div className="space-y-5">
      <Card title="Product Info" sub="What buyers will see when browsing your store">
        <div className="space-y-5">
          <Field label="Product Name" required>
            <Input placeholder="e.g. Complete UI Kit — Dark & Light"
              value={data.title} onChange={e => set("title", e.target.value)} className={inp} />
          </Field>
          <Field label="Description" required hint={`${data.description.length} / 1000`}>
            <Textarea placeholder="Describe what buyers get, what problems it solves, and who it's for…"
              value={data.description} onChange={e => set("description", e.target.value)} rows={4}
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
                    style={{ background:on?"var(--p)":"var(--white)", borderColor:on?"var(--p)":"var(--bd)", color:on?"#fff":"var(--t2)" }}>
                    {c}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      </Card>
      <Card title="Cover Image" sub="16:9 · JPG, PNG, WebP · Max 3 MB">
        <ThumbnailUpload value={data.thumbnail} onChange={v => set("thumbnail", v)} />
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — FILES
// ════════════════════════════════════════════════════════════════════════════════
function StepFiles({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  const dropRef    = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = (fileList: FileList) => {
    const newFiles: ProductFile[] = Array.from(fileList).map(f => ({
      id:   uid(),
      name: f.name,
      description: "",
      file: f,
      size: f.size,
      ext:  f.name.split(".").pop()?.toLowerCase() ?? "file",
    }))
    set("files", [...data.files, ...newFiles])
  }

  const updateDesc = (id:string, desc:string) =>
    set("files", data.files.map(f => f.id===id ? { ...f, description:desc } : f))

  const removeFile = (id:string) => set("files", data.files.filter(f => f.id!==id))

  const addPreview = (file:File) => {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    set("previewImages", [...data.previewImages, url])
  }
  const removePreview = (idx:number) =>
    set("previewImages", data.previewImages.filter((_,i) => i!==idx))

  return (
    <div className="space-y-5">
      <Card title="Product Files" sub="Upload the files buyers will receive after purchase">

        {/* drop zone */}
        <input type="file" multiple ref={dropRef} className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files) }} />

        <div className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all mb-5"
          style={{
            border: `2px dashed ${dragOver ? "var(--p)" : "var(--bd)"}`,
            background: dragOver ? "var(--p2)" : "var(--bg)",
            minHeight: 160,
          }}
          onClick={() => dropRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files) }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
            style={{ background: dragOver ? "var(--p)" : "var(--p2)" }}>
            <UploadCloud className="w-6 h-6" style={{ color: dragOver ? "#fff" : "var(--p)" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color:"var(--t1)" }}>
              {dragOver ? "Drop files here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs mt-0.5" style={{ color:"var(--t3)" }}>
              Any file type — ZIP, PDF, Figma, MP4, PSD, code…
            </p>
          </div>
          {!dragOver && (
            <button type="button" className="px-5 py-2 rounded-full text-sm font-bold cursor-pointer"
              style={{ background:"var(--p)", color:"#fff" }}
              onClick={e => { e.stopPropagation(); dropRef.current?.click() }}>
              Choose Files
            </button>
          )}
        </div>

        {/* file list */}
        {data.files.length > 0 && (
          <div className="space-y-2">
            {data.files.map(f => {
              const Icon = getFileIcon(f.ext)
              return (
                <div key={f.id} className="rounded-2xl border p-4 space-y-3"
                  style={{ background:"var(--bg)", borderColor:"var(--bd)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background:"var(--p2)" }}>
                      <Icon className="w-5 h-5" style={{ color:"var(--p)" }} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color:"var(--t1)" }}>{f.name}</p>
                      <p className="text-[11px]" style={{ color:"var(--t3)" }}>
                        {f.ext.toUpperCase()} · {fmtSize(f.size)}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(f.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 shrink-0"
                      style={{ background:"rgba(239,68,68,.08)", color:"#ef4444" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input placeholder="Short description of this file (optional)"
                    value={f.description}
                    onChange={e => updateDesc(f.id, e.target.value)}
                    className={inp} style={{ height:38 }} />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* preview images / screenshots */}
      <Card title="Preview Screenshots" sub="Show buyers what they get — optional but recommended">
        <input type="file" accept="image/*" multiple ref={previewRef} className="hidden"
          onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addPreview) }} />

        {data.previewImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {data.previewImages.map((src, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-video"
                style={{ background:"var(--bg)" }}>
                <img src={src} alt="Product thumbnail preview" loading="lazy" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePreview(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background:"rgba(0,0,0,.65)", color:"#fff" }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={() => previewRef.current?.click()}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold cursor-pointer transition-all border-2"
          style={{ borderColor:"var(--p3)", color:"var(--p)", background:"var(--p2)" }}>
          <Plus className="w-3.5 h-3.5" strokeWidth={1.7} />
          Add Screenshots
        </button>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — DETAILS
// ════════════════════════════════════════════════════════════════════════════════
function StepDetails({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  const [newItem, setNewItem] = useState("")

  const addItem = () => {
    const v = newItem.trim()
    if (!v) return
    set("whatIncluded", [...data.whatIncluded, v])
    setNewItem("")
  }
  const removeItem = (i:number) => set("whatIncluded", data.whatIncluded.filter((_,idx) => idx!==i))

  return (
    <div className="space-y-5">

      <Card title="What's Included" sub="List exactly what buyers receive">
        <div className="space-y-3">
          {data.whatIncluded.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background:"var(--bg)", border:"1px solid var(--bd)" }}>
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--p)" }} strokeWidth={1.7} />
              <p className="flex-1 text-[13px]" style={{ color:"var(--t1)" }}>{item}</p>
              <button type="button" onClick={() => removeItem(i)}
                className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                style={{ color:"var(--t3)" }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="e.g. 200+ UI Components in Figma"
              value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); addItem() } }}
              className={inp + " flex-1"} />
            <button type="button" onClick={addItem}
              className="h-11 px-4 rounded-xl text-[12px] font-bold cursor-pointer transition-all shrink-0"
              style={{ background:"var(--p)", color:"#fff" }}>
              Add
            </button>
          </div>
        </div>
      </Card>

      <Card title="License" sub="How buyers are allowed to use this product">
        <div className="grid grid-cols-3 gap-3">
          {LICENSES.map(l => {
            const on = data.license === l.id
            return (
              <button key={l.id} type="button" onClick={() => set("license", l.id)}
                className="flex flex-col gap-2.5 p-4 rounded-2xl border-2 cursor-pointer transition-all text-left"
                style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: on ? l.color : "var(--bg)" }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: on ? "#fff" : "var(--t3)" }} />
                </div>
                <div>
                  <p className="text-[12px] font-bold" style={{ color:on?"var(--p)":"var(--t1)" }}>{l.label}</p>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color:"var(--t3)" }}>{l.desc}</p>
                </div>
                {on && <Check className="w-3.5 h-3.5 self-end" style={{ color:"var(--p)" }} />}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card title="Version" sub="Current release">
          <Input placeholder="e.g. v1.0, v2.3.1"
            value={data.version} onChange={e => set("version", e.target.value)} className={inp} />
        </Card>
        <Card title="Requirements" sub="What buyers need to use this">
          <Input placeholder="e.g. Figma 2024+, Adobe CC"
            value={data.requirements} onChange={e => set("requirements", e.target.value)} className={inp} />
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// PRICING TIER EDITOR
// ════════════════════════════════════════════════════════════════════════════════
function TierEditor({ tier, onChange, onDelete }: {
  tier: PricingTier; onChange:(t:PricingTier)=>void; onDelete:()=>void
}) {
  const [newFeature, setNewFeature] = useState("")
  const set = (k:keyof PricingTier, v:any) => onChange({ ...tier, [k]:v })

  const addFeature = () => {
    const v = newFeature.trim()
    if (!v) return
    set("features", [...tier.features, v])
    setNewFeature("")
  }
  const removeFeature = (i:number) => set("features", tier.features.filter((_,idx) => idx!==i))

  return (
    <div className="rounded-2xl border-2 p-5 space-y-4 relative"
      style={{ borderColor: tier.isPopular ? "var(--p)" : "var(--bd)", background:"var(--white)" }}>

      {tier.isPopular && (
        <span className="absolute -top-3 left-4 text-[10px] font-black px-3 py-0.5 rounded-full text-white"
          style={{ background:"var(--p)" }}>MOST POPULAR</span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <Field label="Tier Name" required>
            <Input placeholder="e.g. Basic, Pro, Studio"
              value={tier.name} onChange={e => set("name", e.target.value)} className={inp} />
          </Field>
          <Field label="Price (TND)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold select-none"
                style={{ color:"var(--t3)" }}>TND</span>
              <Input type="number" min={0} placeholder="0"
                value={tier.price || ""}
                onChange={e => set("price", parseFloat(e.target.value)||0)}
                className={inp + " pl-12"} />
            </div>
          </Field>
        </div>
        <button type="button" onClick={onDelete}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70 shrink-0 mt-5"
          style={{ background:"rgba(239,68,68,.08)", color:"#ef4444" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Field label="Description" hint="What this tier offers">
        <Input placeholder="e.g. Perfect for individuals & freelancers"
          value={tier.description} onChange={e => set("description", e.target.value)} className={inp} />
      </Field>

      {/* Features */}
      <div>
        <p className={LBL} style={{ color:"var(--t3)" }}>What's included in this tier</p>
        <div className="space-y-1.5 mb-2">
          {tier.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background:"var(--bg)", border:"1px solid var(--bd)" }}>
              <Check className="w-3 h-3 shrink-0" style={{ color:"var(--p)" }} strokeWidth={1.7} />
              <p className="flex-1 text-[12px]" style={{ color:"var(--t1)" }}>{feat}</p>
              <button type="button" onClick={() => removeFeature(i)}
                className="cursor-pointer hover:opacity-60" style={{ color:"var(--t3)" }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="e.g. Commercial license, Source files"
            value={newFeature} onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); addFeature() } }}
            className={inp + " flex-1"} style={{ height:36 }} />
          <button type="button" onClick={addFeature}
            className="h-9 px-3 rounded-xl text-[11px] font-bold cursor-pointer shrink-0"
            style={{ background:"var(--p2)", color:"var(--p)", border:"1px solid var(--p3)" }}>
            Add
          </button>
        </div>
      </div>

      {/* Popular toggle */}
      <button type="button" onClick={() => set("isPopular", !tier.isPopular)}
        className="flex items-center gap-2 text-[12px] font-bold cursor-pointer transition-all"
        style={{ color: tier.isPopular ? "var(--p)" : "var(--t3)" }}>
        <div className="w-9 h-5 rounded-full relative transition-colors"
          style={{ background: tier.isPopular ? "var(--p)" : "var(--bd)" }}>
          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: tier.isPopular ? "19px" : "2px", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
        </div>
        Mark as most popular
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — PRICING
// ════════════════════════════════════════════════════════════════════════════════
function StepPricing({ data, set }: { data:FormData; set:(f:keyof FormData, v:any)=>void }) {
  const addTier = () => set("tiers", [...data.tiers, {
    id: uid(), name: "", price: 0, description: "", features: [], isPopular: false,
  }])
  const updateTier = (id:string, t:PricingTier) => set("tiers", data.tiers.map(x => x.id===id ? t : x))
  const deleteTier = (id:string) => set("tiers", data.tiers.filter(x => x.id!==id))

  return (
    <div className="space-y-5">

      {/* base pricing */}
      <Card title="Pricing Model" sub="You can change this after publishing">
        <div className="space-y-3">
          {([
            { id:"free" as const, icon:Users,       label:"Free",  sub:"Anyone can download — maximize reach",        color:"var(--cyan)"   },
            { id:"paid" as const, icon:DollarSign,  label:"Paid",  sub:"Set a price — earn from your digital work",  color:"var(--orange)" },
          ]).map(opt => {
            const on = data.priceType === opt.id
            return (
              <button key={opt.id} type="button" onClick={() => set("priceType", opt.id)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all text-left"
                style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:opt.color }}>
                  <opt.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color:on?"var(--p)":"var(--t1)" }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color:"var(--t3)" }}>{opt.sub}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p)":"transparent" }}>
                  {on && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {data.priceType === "paid" && !data.hasTiers && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 rounded-xl border-2 overflow-hidden"
              style={{ borderColor:"var(--p)", background:"var(--white)" }}>
              <span className="flex items-center px-4 text-sm font-bold border-r select-none"
                style={{ background:"var(--p2)", color:"var(--p)", borderColor:"var(--p)" }}>TND</span>
              <input type="number" min={1} step={0.5} placeholder="0.00"
                value={data.price || ""}
                onChange={e => set("price", parseFloat(e.target.value)||0)}
                className="w-32 h-full px-4 text-lg font-bold bg-transparent outline-none"
                style={{ color:"var(--t1)" }} />
            </div>
            <p className="text-xs" style={{ color:"var(--t3)" }}>Single price for all buyers</p>
          </div>
        )}
      </Card>

      {/* pricing variations toggle */}
      {data.priceType === "paid" && (
        <Card title="Pricing Variations" sub="Optional — offer multiple tiers with different inclusions">
          <button type="button" onClick={() => set("hasTiers", !data.hasTiers)}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border-2 cursor-pointer transition-all text-left mb-4"
            style={{ borderColor:data.hasTiers?"var(--p)":"var(--bd)", background:data.hasTiers?"var(--p2)":"var(--bg)" }}>
            <div className="w-9 h-5 rounded-full relative transition-colors shrink-0"
              style={{ background: data.hasTiers ? "var(--p)" : "var(--bd)" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: data.hasTiers ? "19px" : "2px", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
            </div>
            <div>
              <p className="text-[13px] font-bold" style={{ color:data.hasTiers?"var(--p)":"var(--t1)" }}>
                Enable Pricing Tiers
              </p>
              <p className="text-[11px]" style={{ color:"var(--t3)" }}>
                e.g. Basic $9 · Pro $29 · Studio $79
              </p>
            </div>
          </button>

          {data.hasTiers && (
            <div className="space-y-4">
              {data.tiers.map(t => (
                <TierEditor key={t.id} tier={t}
                  onChange={updated => updateTier(t.id, updated)}
                  onDelete={() => deleteTier(t.id)} />
              ))}
              <button type="button" onClick={addTier}
                className="w-full h-11 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2
                           text-[12px] font-bold cursor-pointer transition-all hover:opacity-80"
                style={{ borderColor:"var(--p3)", color:"var(--p)", background:"var(--p2)" }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> Add Pricing Tier
              </button>
            </div>
          )}
        </Card>
      )}

      {/* publish */}
      <Card title="Publishing" sub="When will buyers be able to download this product?">
        <div className="grid grid-cols-2 gap-3">
          {([
            { val:true,  icon:Globe, label:"Publish Now",   desc:"Live and downloadable immediately"  },
            { val:false, icon:Lock,  label:"Save as Draft", desc:"Publish manually when ready"         },
          ] as const).map(opt => {
            const on = data.isPublished === opt.val
            return (
              <button key={String(opt.val)} type="button" onClick={() => set("isPublished", opt.val)}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{ borderColor:on?"var(--p)":"var(--bd)", background:on?"var(--p2)":"var(--white)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:on?"var(--p)":"var(--bg)" }}>
                  <opt.icon className="w-4 h-4" style={{ color:on?"#fff":"var(--t3)" }} />
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
    let iv: number
    ;(async () => {
      const confetti = (await import('canvas-confetti')).default
      const colors   = ["#8e78fb","#fb923c","#22d3ee","#f472b6","#a78bfa","#ffffff"]
      const defaults = { startVelocity:30, spread:360, ticks:80, zIndex:9999, colors }
      const rand     = (a:number, b:number) => Math.random()*(b-a)+a
      const end      = Date.now() + 3500
      iv             = window.setInterval(() => {
        const left = end - Date.now()
        if (left<=0) return clearInterval(iv)
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
        <Package className="w-10 h-10 text-white" strokeWidth={1.7} />
      </div>
      <div className="text-center" style={{ animation:"fadeUpS .5s .2s ease both" }}>
        <h2 className="text-2xl font-bold mb-1" style={{ color:"var(--t1)" }}>Product Published!</h2>
        <p className="text-sm" style={{ color:"var(--t3)" }}>Redirecting to your products…</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN FORM
// ════════════════════════════════════════════════════════════════════════════════
export function CreateProductForm() {
  const router = useRouter()
  const [wizardStep,   setWizardStep]   = useState(1)
  const [error,        setError]        = useState("")
  const [success,      setSuccess]      = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [done]                          = useState<Set<number>>(new Set())

  const [data, setData] = useState<FormData>({
    title:"", description:"", category:"", thumbnail:"",
    files:[], previewImages:[],
    version:"", requirements:"", whatIncluded:[], license:"personal",
    priceType:"free", price:0, hasTiers:false, tiers:[], isPublished:true,
  })

  const set = (field:keyof FormData, value:any) => setData(p => ({ ...p, [field]:value }))

  const blocker = (): string => {
    if (wizardStep===1) {
      if (!data.title.trim())       return "Add a product name to continue"
      if (!data.description.trim()) return "Add a description to continue"
      if (!data.category)           return "Select a category to continue"
      return ""
    }
    if (wizardStep===2) {
      if (data.files.length===0) return "Upload at least one product file to continue"
      return ""
    }
    if (wizardStep===3) {
      if (data.whatIncluded.length===0) return "Add at least one item to what's included"
      return ""
    }
    if (wizardStep===4) {
      if (data.priceType==="paid" && !data.hasTiers && data.price<=0)
        return "Set a price to continue"
      if (data.priceType==="paid" && data.hasTiers) {
        if (data.tiers.length===0) return "Add at least one pricing tier"
        if (data.tiers.some(t => !t.name.trim() || t.price<=0))
          return "All tiers need a name and price"
      }
      return ""
    }
    return ""
  }

  const canContinue = () => blocker()===""
  const goNext      = () => { if (canContinue()) { done.add(wizardStep); setWizardStep(s=>s+1) } }

  const submit = async () => {
    setSubmitting(true); setError("")
    try {
      setSubmitStatus("Uploading files…");   await new Promise(r=>setTimeout(r,500))
      setSubmitStatus("Saving product…");    await new Promise(r=>setTimeout(r,400))
      setSubmitStatus("Publishing…");        await new Promise(r=>setTimeout(r,300))

      const products:any[] = JSON.parse(localStorage.getItem("chabaqa_products")??"[]")
      products.unshift({
        id:`prd_${Date.now()}`,
        ...data,
        files: data.files.map(f => ({ id:f.id, name:f.name, description:f.description, size:f.size, ext:f.ext })),
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem("chabaqa_products", JSON.stringify(products))
      setSuccess(true)
      setTimeout(() => router.push("/creator/products"), 2800)
    } catch(err:any) {
      setError(err.message||"Something went wrong.")
    } finally {
      setSubmitting(false); setSubmitStatus("")
    }
  }

  if (success) return <SuccessScreen />

  return (
    <div className="flex flex-1 h-full overflow-hidden" style={{ minHeight:0 }}>
      <Sidebar wizardStep={wizardStep} data={data} done={done} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ background:"var(--bg)" }}>

        {/* topbar */}
        <div className="px-8 py-4 border-b shrink-0 flex items-center justify-between"
          style={{ borderColor:"var(--bd)", background:"var(--white)" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <button type="button" onClick={() => router.push("/creator/products")}
                className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
                style={{ color:"var(--t3)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Products
              </button>
              <ChevronRight className="w-3 h-3" style={{ color:"var(--bd)" }} />
              <span className="text-xs font-medium" style={{ color:"var(--t2)" }}>New Product</span>
            </div>
            <h1 className="text-[15px] font-bold" style={{ color:"var(--t1)" }}>{STEP_META[wizardStep].title}</h1>
            <p className="text-[11px]" style={{ color:"var(--t3)" }}>{STEP_META[wizardStep].sub}</p>
          </div>
          <span className="text-[11px] font-bold tabular-nums px-3 py-1 rounded-full"
            style={{ background:"var(--p2)", color:"var(--p)" }}>
            {wizardStep} / {STEPS_DEF.length}
          </span>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {wizardStep===1 && <StepInfo    data={data} set={set} />}
          {wizardStep===2 && <StepFiles   data={data} set={set} />}
          {wizardStep===3 && <StepDetails data={data} set={set} />}
          {wizardStep===4 && <StepPricing data={data} set={set} />}
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
            {wizardStep>1
              ? <button type="button" onClick={() => setWizardStep(s=>s-1)}
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
              onClick={wizardStep===STEPS_DEF.length ? submit : goNext}
              disabled={!canContinue()||submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer
                         disabled:cursor-not-allowed transition-all"
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
                  {submitStatus||"Saving…"}
                </>
              ) : wizardStep===STEPS_DEF.length ? (
                <>{data.isPublished?"Publish Product":"Save as Draft"} <Check className="w-4 h-4"/></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4"/></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
