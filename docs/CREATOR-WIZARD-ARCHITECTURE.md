# Chabaqa Creator Wizard — Architecture Reference

> Use this document every time you build a new creator feature (challenge, product, community, etc.).  
> All creation wizards must follow this exact structure.

---

## 1. File Structure

```
app/(dashboard)/creator/<feature>/create/page.tsx      ← thin page wrapper only
components/<feature>/create-<feature>-form.tsx         ← all logic lives here
```

### `page.tsx` — always the same 6 lines
```tsx
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { Create<Feature>Form } from '@/components/<feature>/create-<feature>-form'

export default function Create<Feature>Page() {
  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex h-screen overflow-hidden" style={{ background:'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col h-screen overflow-hidden">
          <DashTopbar title="Create <Feature>" subtitle="..." />
          <main className="flex-1 flex flex-col overflow-hidden" style={{ animation:'dashFadeUp .4s ease both' }}>
            <Create<Feature>Form />
          </main>
        </div>
      </div>
    </>
  )
}
```

---

## 2. The 4-Step Rule

Every wizard has **exactly 4 steps**. **Pricing is always step 4.**

| Step | Name | Rule |
|------|------|------|
| 1 | **Info** | FIXED — same fields for every feature |
| 2 | **[Custom]** | Feature-specific main content |
| 3 | **[Custom]** | Feature-specific secondary content |
| 4 | **Pricing** | FIXED — always pricing + publish toggle |

### Step 1 — Info (identical fields across ALL features)
- Title (required)
- Description (required, 1000 char limit shown)
- **Category** chips — same list for all (Technology, Business, Design, Marketing, Education, Health, Music, Arts, Sports, Other)
- Thumbnail / Banner upload (16:9, JPG/PNG/WebP, max 3 MB)

### Step 4 — Pricing (identical structure across ALL features)
- Free / Paid toggle cards
- Price input in TND (only shown when Paid)
- Publish Now / Save as Draft toggle cards

### Steps 2 & 3 — Custom examples
| Feature | Step 2 | Step 3 |
|---------|--------|--------|
| Course  | Curriculum (sections & chapters) | Settings (level, duration) |
| Session | Details (duration, type, requirements) | Availability (schedule, slots) |
| Event   | Format (online/offline/hybrid + location) | Schedule (date, time, capacity) |
| Challenge *(future)* | Rules & Tasks | Rewards |
| Product *(future)* | Product Details | Variants & Stock |

---

## 3. STEPS Array

```tsx
const STEPS = [
  { id: 1, label: "Info",      icon: BookOpen,   desc: "Title, category & thumbnail" },
  { id: 2, label: "[Custom]",  icon: <Icon>,     desc: "..."                         },
  { id: 3, label: "[Custom]",  icon: <Icon>,     desc: "..."                         },
  { id: 4, label: "Pricing",   icon: DollarSign, desc: "Free, paid & publish"        },
] as const
```

---

## 4. FormData Interface

```tsx
interface FormData {
  // ── Step 1 (always these exact fields) ──────────────────────
  title:       string
  description: string
  category:    string
  thumbnail:   string   // or banner: string for events

  // ── Steps 2 & 3 (custom per feature) ────────────────────────
  // ... feature-specific fields ...

  // ── Step 4 (always these exact fields) ──────────────────────
  priceType:   "free" | "paid"
  price:       number
  isPublished: boolean
}
```

---

## 5. STEP_META

```tsx
const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: "Info",      sub: "Define your <feature> identity and category" },
  2: { title: "[Custom]",  sub: "..."                                         },
  3: { title: "[Custom]",  sub: "..."                                         },
  4: { title: "Pricing",   sub: "Monetize and publish your <feature>"         },
}
```

---

## 6. STEP_BLOCKER

```tsx
const STEP_BLOCKER: Record<number, (d: FormData) => string> = {
  1: d => !d.title.trim()       ? "Add a title to continue"
        : !d.description.trim() ? "Add a description to continue"
        : !d.category           ? "Select a category to continue"
        : "",
  2: d => /* custom validation */ "",
  3: d => /* custom validation */ "",
  4: d => d.priceType === "paid" && d.price <= 0
        ? "Set a price to continue"
        : "",
}
```

---

## 7. Sidebar Component

The sidebar is **always 272px wide**, fixed left, never scrolls with main content.

### Sections (top → bottom):

#### A. Banner / Thumbnail Preview
```tsx
<aside className="w-[272px] shrink-0 flex flex-col border-r overflow-y-auto"
  style={{ background: "var(--white)", borderColor: "var(--bd)" }}>

  <div className="p-5 border-b" style={{ borderColor: "var(--bd)" }}>
    {/* 16:9 image preview with dashed placeholder */}
    <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center mb-3"
      style={{ background: "var(--bg)", border: "1.5px dashed var(--bd)" }}>
      {data.thumbnail
        ? <img src={data.thumbnail} className="w-full h-full object-cover" />
        : <ImageIcon className="w-6 h-6 opacity-40" style={{ color: "var(--t3)" }} />
      }
    </div>

    {/* Live title */}
    <p className="text-[13px] font-bold leading-snug"
      style={{ color: data.title ? "var(--t1)" : "var(--t3)" }}>
      {data.title || "Untitled <Feature>"}
    </p>

    {/* Category chip (shown once selected) */}
    {data.category && (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block"
        style={{ background: "var(--p2)", color: "var(--p)" }}>
        {data.category}
      </span>
    )}
  </div>
```

#### B. Progress + Stats (always 3 columns, no borders)
```tsx
  <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--bd)" }}>
    {/* Progress bar */}
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

    {/* 3-column stats — always exactly 3 items */}
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Stat1", value: ... },
        { label: "Stat2", value: ... },
        { label: "Stat3", value: ... },
      ].map(s => (
        <div key={s.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--bg)" }}>
          <p className="text-[16px] font-bold leading-none" style={{ color: "var(--p)" }}>{s.value}</p>
          <p className="text-[9px] mt-0.5" style={{ color: "var(--t3)" }}>{s.label}</p>
        </div>
      ))}
    </div>
  </div>
```

#### C. Step Navigation List
```tsx
  <nav className="flex-1 p-4 space-y-1">
    {STEPS.map(s => {
      const isDone   = done.has(s.id) && step > s.id
      const isActive = step === s.id
      return (
        <div key={s.id}
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 select-none"
          style={{ background: isActive ? "var(--p2)" : "transparent" }}>

          {/* Icon container — rounded-lg, NO border, NO left accent */}
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: isDone ? "var(--p)" : isActive ? "var(--p)" : "var(--bg)" }}>
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
```

**Step icon rules:**
| State | Background | Icon color |
|-------|-----------|-----------|
| Active | `var(--p)` | `#fff` |
| Done | `var(--p)` | `#fff` (Check icon) |
| Inactive | `var(--bg)` | `var(--t3)` |

---

## 8. Main Panel — Right Side

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb: ← Feature > New Feature          [x / 4]   │  ← px-8 py-4 border-b white bg
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Step content (px-8 py-7, overflow-y-auto)             │  ← flex-1 scrollable
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Back]     ⚠ blocker message      [Continue →]         │  ← border-t white bg px-8 py-4
└─────────────────────────────────────────────────────────┘
```

### Topbar (step header)
```tsx
<div className="shrink-0 flex items-center justify-between px-8 py-4 border-b"
  style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
  <div>
    {/* breadcrumb */}
    <div className="flex items-center gap-2 mb-0.5">
      <button onClick={() => router.push("/creator/<feature>")}
        className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity flex items-center gap-1"
        style={{ color: "var(--t3)" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> <Feature>s
      </button>
      <ChevronRight className="w-3 h-3" style={{ color: "var(--bd)" }} />
      <span className="text-xs font-medium" style={{ color: "var(--t2)" }}>New <Feature></span>
    </div>
    <h1 className="text-[15px] font-bold" style={{ color: "var(--t1)" }}>{STEP_META[step].title}</h1>
    <p className="text-[11px]" style={{ color: "var(--t3)" }}>{STEP_META[step].sub}</p>
  </div>
  {/* step counter pill */}
  <span className="text-[11px] font-bold tabular-nums px-3 py-1 rounded-full"
    style={{ background: "var(--p2)", color: "var(--p)" }}>
    {step} / {STEPS.length}
  </span>
</div>
```

### Bottom Nav Bar
```tsx
<div className="shrink-0 border-t" style={{ borderColor: "var(--bd)", background: "var(--white)" }}>
  {/* Error banner */}
  {error && (
    <div className="px-8 py-3 flex items-start gap-2.5 border-b"
      style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
      <p className="text-[13px] font-medium flex-1" style={{ color: "#b83232" }}>{error}</p>
      <button onClick={() => setError("")}
        className="text-[12px] font-bold underline cursor-pointer" style={{ color: "#dc2626" }}>
        Dismiss
      </button>
    </div>
  )}

  <div className="px-8 py-4 flex items-center justify-between">
    {/* Back button */}
    {step > 1
      ? <button onClick={() => setStep(s => s - 1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
          style={{ border: "2px solid var(--bd)", color: "var(--t2)", background: "transparent" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--p2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      : <div />
    }

    {/* Blocker warning (center) */}
    {!canContinue() && !error && (
      <div className="flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
        <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>{blocker()}</p>
      </div>
    )}
    {canContinue() && !error && <div />}

    {/* Continue / Submit */}
    <button onClick={step === STEPS.length ? submit : goNext}
      disabled={!canContinue() || submitting}
      className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer
                 disabled:cursor-not-allowed transition-all"
      style={{
        background: canContinue() && !submitting ? "var(--p)" : "var(--p3)",
        opacity:    canContinue() && !submitting ? 1 : 0.45,
        boxShadow:  canContinue() && !submitting ? "0 4px 16px rgba(142,120,251,.4)" : "none",
      }}>
      {submitting ? <>spinner Creating…</>
        : step === STEPS.length ? <>{data.isPublished ? "Publish" : "Save as Draft"} <Check className="w-4 h-4" /></>
        : <>Continue <ArrowRight className="w-4 h-4" /></>
      }
    </button>
  </div>
</div>
```

---

## 9. Shared UI Helpers (copy these into every form)

```tsx
const LBL = "block text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 select-none"

const inp = [
  "w-full h-11 px-4 rounded-xl border-2 text-sm transition-colors duration-150",
  "border-[var(--bd)] bg-[var(--white)] text-[var(--t1)] placeholder:text-[var(--t3)]",
  "focus:outline-none focus:border-[var(--p)] focus:ring-0",
].join(" ")

function Field({ label, required, hint, children }) {
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

function Card({ title, sub, children }) {
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
```

---

## 10. Design Tokens Reference

| Token | Usage |
|-------|-------|
| `var(--p)` | Primary brand purple — active states, filled icons, progress bar, CTA buttons |
| `var(--p2)` | Primary light — active step bg, category chip bg, card hover bg |
| `var(--p3)` | Primary extra-light — dashed borders, inactive step icon bg tint |
| `var(--bg)` | Page background — inactive icon bg, stats card bg, input bg |
| `var(--white)` | Card / sidebar / panel background |
| `var(--bd)` | All borders (inputs, cards, dividers) |
| `var(--t1)` | Primary text — titles, values |
| `var(--t2)` | Secondary text — descriptions, labels |
| `var(--t3)` | Muted text — placeholders, hints, inactive nav labels |
| `var(--orange)` | Warning / in-person format accent |
| `var(--cyan)` | Info / hybrid format accent |
| `var(--pink)` | VIP / special accent |

---

## 11. Category Chips (identical across all features)

```tsx
const CATEGORIES = [
  "Technology","Business","Design","Marketing",
  "Education","Health","Music","Arts","Sports","Other"
]

// Render pattern (Step 1 of every wizard):
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
            color:       on ? "#fff"      : "var(--t2)",
          }}>
          {c}
        </button>
      )
    })}
  </div>
</Field>
```

---

## 12. Success Screen (identical across all features)

```tsx
function SuccessScreen() {
  useEffect(() => {
    const colors   = ["#8e78fb","#fb923c","#22d3ee","#f472b6","#a78bfa","#ffffff"]
    const defaults = { startVelocity:30, spread:360, ticks:80, zIndex:9999, colors }
    const rand     = (a,b) => Math.random()*(b-a)+a
    const end      = Date.now() + 3500
    const iv       = window.setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) return clearInterval(iv)
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
        <h2 className="text-2xl font-bold mb-1" style={{ color:"var(--t1)" }}><Feature> Created!</h2>
        <p className="text-sm" style={{ color:"var(--t3)" }}>Redirecting to your <feature>s…</p>
      </div>
    </div>
  )
}
```

---

## 13. Checklist — Before Starting a New Wizard

- [ ] Create `app/(dashboard)/creator/<feature>/create/page.tsx` (thin wrapper)
- [ ] Create `components/<feature>/create-<feature>-form.tsx`
- [ ] Step 1 has: title, description, category chips, thumbnail upload
- [ ] Step 4 has: pricing model + price input + publish toggle
- [ ] Steps 2 & 3 are the feature-specific content
- [ ] STEPS array has exactly 4 items
- [ ] STEP_BLOCKER defined for all 4 steps
- [ ] Sidebar: 272px, 3-col stats, rounded-lg icons, var(--p) colors
- [ ] Progress = `Math.round(((step - 1) / STEPS.length) * 100)`
- [ ] SuccessScreen with confetti + redirect after 2.8s
- [ ] Page listed in DashSidebar nav with correct route
