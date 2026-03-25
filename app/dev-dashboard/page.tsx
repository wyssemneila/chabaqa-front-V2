"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import {
  Users, Shield, Megaphone, BarChart3, DollarSign, Settings,
  HeadphonesIcon, TrendingUp, Activity, Zap, Calendar, BookOpen,
  ExternalLink, Plus, Home, Building2, ChevronLeft,
  MessageSquare, Video, Bell,
} from "lucide-react";
import {
  DashboardSection,
  StatCard,
} from "@/app/(community)/[creator]/[feature]/(loggedUser)/dashboard/components";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const B = {
  bg:        "#fafafe",
  surface:   "#ffffff",
  surface2:  "#f5f3ff",
  border:    "#e5e7eb",
  text1:     "#111827",
  text2:     "#6b7280",
  text3:     "#9ca3af",
  accent:    "#8e78fb",
  accentDark:"#6c52f0",
  accentBg:  "#ede9ff",
  green:     "#059669",
  greenBg:   "#d1fae5",
  amber:     "#d97706",
  amberBg:   "#fef3c7",
  red:       "#dc2626",
  redBg:     "#fee2e2",
  cyan:      "#0891b2",
  cyanBg:    "#cffafe",
  orange:    "#ea580c",
  orangeBg:  "#ffedd5",
  pink:      "#db2777",
  pinkBg:    "#fce7f3",
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { title: "Main", items: [
    { label: "Overview",      icon: Home,        active: true },
    { label: "Community",     icon: Building2                 },
    { label: "Members",       icon: Users                     },
    { label: "Analytics",     icon: BarChart3                 },
  ]},
  { title: "Content", items: [
    { label: "Courses",       icon: BookOpen                  },
    { label: "Challenges",    icon: Zap                       },
    { label: "Sessions",      icon: Calendar                  },
    { label: "Events",        icon: Activity                  },
  ]},
  { title: "Revenue", items: [
    { label: "Subscriptions", icon: DollarSign                },
    { label: "Payouts",       icon: TrendingUp                },
  ]},
  { title: "Marketing", items: [
    { label: "Campaigns",     icon: Megaphone                 },
    { label: "Affiliates",    icon: Users                     },
  ]},
  { title: "Settings", items: [
    { label: "Team & Roles",  icon: Shield                    },
    { label: "Integrations",  icon: Settings, badge: "Soon"  },
  ]},
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Icon-rail pattern: expanded = 220px (icon + label), collapsed = 60px (icon only, centered)
function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const T_ICON  = "280ms cubic-bezier(.4,0,.2,1)";
  const T_LABEL = "200ms cubic-bezier(.4,0,.2,1)";

  // Shared label fade style
  const labelStyle = {
    overflow: "hidden" as const,
    whiteSpace: "nowrap" as const,
    opacity: isOpen ? 1 : 0,
    maxWidth: isOpen ? 160 : 0,
    transition: `opacity ${T_LABEL}, max-width ${T_LABEL}`,
  };

  return (
    <div className="flex h-full flex-col" style={{ background: B.surface }}>

      {/* Brand header */}
      <div className="flex items-center border-b"
        style={{
          padding: isOpen ? "20px 16px 16px" : "20px 0 16px",
          justifyContent: isOpen ? "flex-start" : "center",
          gap: isOpen ? 10 : 0,
          borderColor: B.border,
          transition: `padding ${T_ICON}, gap ${T_ICON}`,
        }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)` }}>
          <span className="text-[12px] font-black text-white">C</span>
        </div>
        <div style={labelStyle}>
          <p className="text-[13px] font-bold" style={{ color: B.text1 }}>Motion Masters</p>
          <p className="text-[11px]" style={{ color: B.text3 }}>Creator workspace</p>
        </div>
      </div>

      {/* Create button */}
      <div style={{
        padding: isOpen ? "12px 12px 8px" : "12px 8px 8px",
        transition: `padding ${T_ICON}`,
      }}>
        <button
          className="w-full flex items-center justify-center py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
          style={{
            gap: isOpen ? 6 : 0,
            background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)`,
            boxShadow: "0 4px 14px rgba(142,120,251,.35)",
          }}>
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span style={labelStyle}>Create Community</span>
        </button>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-1">
        {NAV.map((section) => (
          <div key={section.title} className="pt-3 pb-1">

            {/* Section title — fades out when collapsed */}
            <div style={{
              overflow: "hidden",
              maxHeight: isOpen ? 24 : 0,
              opacity: isOpen ? 1 : 0,
              transition: `max-height ${T_LABEL}, opacity ${T_LABEL}`,
            }}>
              <p className="text-[10px] font-bold tracking-[.08em] uppercase px-4 pb-1.5" style={{ color: B.text3 }}>
                {section.title}
              </p>
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = (item as any).active === true;
              return (
                <a key={item.label} href="#" onClick={(e) => e.preventDefault()}
                  className="flex items-center rounded-xl mx-2 transition-colors duration-150"
                  style={{
                    padding: isOpen ? "7px 12px" : "7px 0",
                    justifyContent: isOpen ? "flex-start" : "center",
                    gap: isOpen ? 10 : 0,
                    background: isActive ? B.accentBg : "transparent",
                    color: isActive ? B.accent : B.text2,
                    fontWeight: isActive ? 600 : 400,
                    transition: `padding ${T_ICON}, gap ${T_ICON}, background 150ms`,
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = B.surface2; e.currentTarget.style.color = B.text1; }}}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.text2; }}}>
                  <Icon
                    className="h-[15px] w-[15px] shrink-0"
                    style={{ opacity: isActive ? 1 : 0.6, color: isActive ? B.accent : "currentColor" }}
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px]" style={labelStyle}>{item.label}</span>
                  {(item as any).badge && isOpen && (
                    <span className="text-[9px] font-bold tracking-[.06em] px-1.5 py-0.5 rounded-full border ml-auto"
                      style={{ background: B.surface2, color: B.text3, borderColor: B.border }}>
                      {(item as any).badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${B.border}`, padding: "6px 8px" }}>
        {[{ label: "Help & Support", icon: HeadphonesIcon }, { label: "My Profile", icon: Users }].map(({ label, icon: Icon }) => (
          <a key={label} href="#" onClick={(e) => e.preventDefault()}
            className="flex items-center rounded-xl transition-colors duration-150"
            style={{
              padding: isOpen ? "7px 12px" : "7px 0",
              justifyContent: isOpen ? "flex-start" : "center",
              gap: isOpen ? 10 : 0,
              color: B.text2,
              transition: `padding ${T_ICON}, gap ${T_ICON}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = B.surface2; e.currentTarget.style.color = B.text1; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.text2; }}>
            <Icon className="h-[15px] w-[15px] shrink-0" style={{ opacity: 0.55 }} strokeWidth={1.5} />
            <span className="text-[13px] font-semibold" style={labelStyle}>{label}</span>
          </a>
        ))}

        {/* ─── Collapse / Expand toggle — lives on the sidebar ─── */}
        <button
          onClick={onToggle}
          className="flex items-center rounded-xl w-full mt-1 transition-all duration-150"
          style={{
            padding: isOpen ? "7px 12px" : "7px 0",
            justifyContent: isOpen ? "flex-start" : "center",
            gap: isOpen ? 8 : 0,
            color: B.text3,
            transition: `padding ${T_ICON}, gap ${T_ICON}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = B.surface2; e.currentTarget.style.color = B.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.text3; }}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {/* Arrow icon flips direction */}
          <ChevronLeft
            className="h-4 w-4 shrink-0 transition-transform duration-300"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(180deg)" }}
            strokeWidth={2}
          />
          <span className="text-[12px] font-medium" style={labelStyle}>
            Collapse
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Launch banner ────────────────────────────────────────────────────────────
function LaunchBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 mb-7 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      style={{ background: "linear-gradient(135deg, #1a1827 0%, #2d2b45 100%)" }}>
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: B.accent, opacity: 0.12, filter: "blur(40px)" }} />
      <div className="absolute -bottom-16 right-32 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: B.accentDark, opacity: 0.08, filter: "blur(30px)" }} />
      <div className="flex-1 relative z-10">
        <p className="text-[11px] font-bold tracking-[.07em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Getting started</p>
        <h3 className="text-[15px] font-black text-white mb-1">Launch your community in 3 steps</h3>
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>Complete these to reach your first students</p>
      </div>
      <div className="flex flex-wrap gap-2 relative z-10">
        {[
          { label: "Create community", done: true },
          { label: "Add first course",  done: true },
          { label: "Share invite link", done: false },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
            style={{
              background: step.done ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)",
              border: `1px solid ${step.done ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.18)"}`,
              color: step.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
              textDecoration: step.done ? "line-through" : "none",
            }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold"
              style={{ background: step.done ? "#22c55e" : "rgba(255,255,255,0.12)", color: "white" }}>
              {step.done ? "✓" : ""}
            </span>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Performing Content ───────────────────────────────────────────────────
const TOP_CONTENT = [
  { Icon: BookOpen, name: "موشن غرافيك و أنيماشين",       type: "Course",    enrollments: 23, completion: 78, revenue: "395.95 TND", trend: 12,  typeColor: B.cyan,   typeBg: B.cyanBg   },
  { Icon: Zap,      name: "تحدي الـ ٧ أيام — Rigging",   type: "Challenge", enrollments: 8,  completion: 62, revenue: "—",          trend: 100, typeColor: B.orange, typeBg: B.orangeBg },
  { Icon: Video,    name: "Live Q&A: Animation Tips",      type: "Session",   enrollments: 15, completion: 91, revenue: "—",          trend: -5,  typeColor: B.pink,   typeBg: B.pinkBg   },
];

function TopContentCard() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: B.surface, borderColor: B.border }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${B.border}` }}>
        <p className="text-[13px] font-bold" style={{ color: B.text1 }}>Top Performing Content</p>
        <p className="text-[11px] mt-0.5" style={{ color: B.text3 }}>Your best content by engagement</p>
      </div>
      <div>
        {TOP_CONTENT.map((item, i) => {
          const Icon = item.Icon;
          return (
            <div key={i}
              className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 cursor-pointer"
              style={{ borderBottom: i < TOP_CONTENT.length - 1 ? `1px solid ${B.border}` : "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = B.surface2; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.typeBg }}>
                <Icon className="h-5 w-5" style={{ color: item.typeColor }} strokeWidth={1.5} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-semibold truncate" style={{ color: B.text1 }}>{item.name}</p>
                  <span className="text-[9px] font-bold tracking-[.05em] px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: item.typeBg, color: item.typeColor }}>{item.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: B.text3 }}>
                    <Users className="h-3 w-3" strokeWidth={1.5} /> {item.enrollments}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: B.text3 }}>
                    <Activity className="h-3 w-3" strokeWidth={1.5} /> {item.completion}%
                  </span>
                  {item.revenue !== "—" && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: B.green }}>
                      <DollarSign className="h-3 w-3" strokeWidth={1.5} /> {item.revenue}
                    </span>
                  )}
                </div>
              </div>
              {/* Trend */}
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: item.trend >= 0 ? B.greenBg : B.redBg, color: item.trend >= 0 ? B.green : B.red }}>
                {item.trend >= 0 ? "▲" : "▼"} {Math.abs(item.trend)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Content Management ───────────────────────────────────────────────────────
const CONTENT_TABS = ["Courses", "Challenges", "Sessions"] as const;
type CTab = typeof CONTENT_TABS[number];

const TAB_META: Record<CTab, { icon: typeof BookOpen; color: string; bg: string; emptyMsg: string; cta: string }> = {
  Courses:    { icon: BookOpen, color: B.cyan,   bg: B.cyanBg,   emptyMsg: "No courses yet. Create your first course to share knowledge with your community.", cta: "Create Course"    },
  Challenges: { icon: Zap,      color: B.orange, bg: B.orangeBg, emptyMsg: "No challenges yet. Create a challenge to engage your community.", cta: "Create Challenge" },
  Sessions:   { icon: Video,    color: B.pink,   bg: B.pinkBg,   emptyMsg: "No sessions yet. Schedule your first live session.", cta: "Create Session"   },
};

// Mock content cards data
const MOCK_CARDS: Record<CTab, { banner: string; title: string; enrolled: number }[]> = {
  Courses: [
    {
      banner: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      title: "موشن غرافيك و أنيماشين",
      enrolled: 12,
    },
  ],
  Challenges: [
    {
      banner: "linear-gradient(135deg, #1a1827 0%, #f97316 80%, #ea580c 100%)",
      title: "تحدي الـ ٧ أيام — Rigging Animation",
      enrolled: 8,
    },
  ],
  Sessions: [],
};

function ContentCard({ banner, title, enrolled }: { banner: string; title: string; enrolled: number }) {
  return (
    <div className="rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer"
      style={{ background: B.surface, borderColor: B.border }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(142,120,251,.14)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "#c4b8fd"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = B.border; }}>
      {/* Banner */}
      <div className="w-full aspect-video flex items-center justify-center relative overflow-hidden"
        style={{ background: banner }}>
        <span className="text-white/20 text-[11px] font-medium">Cover Image</span>
      </div>
      {/* Body */}
      <div className="p-4">
        <p className="text-[14px] font-bold mb-3 leading-snug" style={{ color: B.text1 }}>{title}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: B.text3 }}>
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
            {enrolled} enrolled
          </span>
          <button className="px-4 py-1.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 shadow-[0_3px_10px_rgba(142,120,251,.3)]"
            style={{ background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)` }}>
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentManagement() {
  const [activeTab, setActiveTab] = useState<CTab>("Courses");
  const meta = TAB_META[activeTab];
  const cards = MOCK_CARDS[activeTab];
  const EmptyIcon = meta.icon;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: B.surface, borderColor: B.border }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${B.border}` }}>
        <h3 className="text-[18px] font-black mb-0.5" style={{ color: B.text1 }}>Content Management</h3>
        <p className="text-[13px]" style={{ color: B.text2 }}>Manage your courses, challenges and sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${B.border}` }}>
        {CONTENT_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const tc = TAB_META[tab];
          const TabIcon = tc.icon;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
              style={{
                background: isActive ? tc.bg : "transparent",
                color: isActive ? tc.color : B.text2,
                border: `1.5px solid ${isActive ? tc.color + "50" : B.border}`,
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = B.surface2; e.currentTarget.style.color = B.text1; }}}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.text2; }}}>
              <TabIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: meta.bg }}>
              <EmptyIcon className="h-7 w-7" style={{ color: meta.color }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[15px] font-bold mb-1" style={{ color: B.text1 }}>
                No {activeTab.toLowerCase()} yet
              </p>
              <p className="text-[13px] max-w-sm" style={{ color: B.text2 }}>{meta.emptyMsg}</p>
            </div>
            <button className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_4px_14px_rgba(142,120,251,.3)]"
              style={{ background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)` }}>
              {meta.cta}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, i) => <ContentCard key={i} {...card} />)}
            {/* Add new card */}
            <button className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 aspect-[4/3] transition-all duration-200 hover:border-[#c4b8fd] hover:bg-[#ede9ff] group"
              style={{ borderColor: B.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: B.surface2 }}>
                <Plus className="h-5 w-5 transition-colors" style={{ color: B.text3 }} />
              </div>
              <span className="text-[12px] font-semibold" style={{ color: B.text3 }}>
                Add {activeTab.slice(0, -1)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Communities ──────────────────────────────────────────────────────────────
function CommunitiesCard() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: B.surface, borderColor: B.border }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${B.border}` }}>
        <p className="text-[13px] font-bold" style={{ color: B.text1 }}>Your Communities</p>
        <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:border-[#c4b8fd] hover:text-[#8e78fb] hover:bg-[#ede9ff]"
          style={{ borderColor: B.border, color: B.text2 }}>
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-300 cursor-pointer"
          style={{ background: B.surface2, borderColor: B.border }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(142,120,251,.13)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#c4b8fd"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = B.border; }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: B.text1 }}>🎬</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[14px] font-bold" style={{ color: B.text1 }}>Motion Masters</p>
              <span className="text-[9px] font-black tracking-[.06em] px-2 py-0.5 rounded-full"
                style={{ background: B.accentBg, color: B.accent }}>VERIFIED</span>
            </div>
            <p className="text-[12px] truncate" style={{ color: B.text3 }}>
              تعلّم الأنيميشن من الصفر · 23 members · Art · Free
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="text-[12px] font-semibold px-3 py-1.5 border rounded-xl transition-all hover:border-[#c4b8fd] hover:text-[#8e78fb]"
              style={{ borderColor: B.border, color: B.text2 }}>View</button>
            <button className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90 shadow-[0_4px_14px_rgba(142,120,251,.3)]"
              style={{ background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)` }}>Customize</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DevDashboardPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen" style={{ background: B.bg }}>

      {/* Dev badge */}
      <div className="fixed top-3 right-3 z-50 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
        style={{ background: B.amber, boxShadow: "0 4px 12px rgba(217,119,6,.4)" }}>
        Dev Preview
      </div>

      {/* Sidebar — icon rail: 220px expanded, 60px collapsed */}
      <aside
        className="hidden lg:block sticky top-0 h-screen shrink-0"
        style={{
          width: sidebarOpen ? 220 : 60,
          transition: "width 280ms cubic-bezier(.4,0,.2,1)",
          borderRight: `1px solid ${B.border}`,
          overflow: "hidden",
        }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 px-5 lg:px-6"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${B.border}` }}>

          <div className="flex-1">
            <h1 className="text-[15px] font-black" style={{ color: B.text1 }}>Creator Dashboard</h1>
            <p className="text-[11px] mt-px" style={{ color: B.text3 }}>{today}</p>
          </div>

          <div className="flex items-center gap-2">
            <LangToggle size="sm" />
            <ThemeToggle size="sm" />
            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shrink-0"
              style={{ borderColor: B.border, color: B.text2 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c4b8fd"; e.currentTarget.style.color = B.accent; e.currentTarget.style.background = B.accentBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.text2; e.currentTarget.style.background = "transparent"; }}>
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: B.accent }} />
            </button>

            {/* View community */}
            <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-[12px] font-semibold border transition-all hover:border-[#c4b8fd] hover:text-[#8e78fb] hover:bg-[#ede9ff]"
              style={{ borderColor: B.border, color: B.text2 }}>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} /> View Community
            </button>

            {/* New content */}
            <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_4px_14px_rgba(142,120,251,.35)]"
              style={{ background: `linear-gradient(135deg, ${B.accent} 0%, ${B.accentDark} 100%)` }}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New Content
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-7">

          <LaunchBanner />

          {/* KPIs */}
          <DashboardSection title="Performance Overview" className="mb-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Total Members"    value="23"      icon={Users}       trend={{ value: 0 }}    description="All time"         iconBg={B.accentBg}  iconColor={B.accent}  />
              <StatCard title="Total Courses"    value="1"       icon={BookOpen}    trend={{ value: 0 }}    description="Published"        iconBg={B.cyanBg}    iconColor={B.cyan}    />
              <StatCard title="Total Challenges" value="1"       icon={Zap}         trend={{ value: 100 }}  description="Active"           iconBg={B.orangeBg}  iconColor={B.orange}  />
              <StatCard title="Total Sessions"   value="0"       icon={Calendar}    description="No sessions yet"                          iconBg="#f3f4f6"     iconColor={B.text3}   />
              <StatCard title="Total Revenue"    value="395.95"  icon={DollarSign}  trend={{ value: 246 }}  description="TND · this month" iconBg={B.greenBg}   iconColor={B.green}   />
              <StatCard title="Avg. Engagement"  value="99%"     icon={Activity}    trend={{ value: -4 }}   description="vs last month"    iconBg={B.accentBg}  iconColor={B.accent}  />
            </div>
          </DashboardSection>

          {/* Top content + Recent activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7">
            <TopContentCard />
            <div className="rounded-2xl border overflow-hidden" style={{ background: B.surface, borderColor: B.border }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${B.border}` }}>
                <p className="text-[13px] font-bold" style={{ color: B.text1 }}>Recent Activity</p>
                <span className="text-[11px]" style={{ color: B.text3 }}>Latest events</span>
              </div>
              {[
                { Icon: Zap,      type: "Challenge", name: "rigging animation — تحدي الـ ٧ أيام", time: "14 days ago", color: B.orange, bg: B.orangeBg },
                { Icon: BookOpen, type: "Course",    name: "موشن غرافيك و أنيماشين",              time: "20 days ago", color: B.cyan,   bg: B.cyanBg   },
                { Icon: Users,    type: "Member",    name: "New member joined your community",     time: "25 days ago", color: B.accent, bg: B.accentBg },
              ].map((item, i, arr) => {
                const Icon = item.Icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 transition-colors duration-150"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${B.border}` : "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = B.surface2; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.bg }}>
                      <Icon className="h-4 w-4" style={{ color: item.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-[.06em]" style={{ color: item.color }}>{item.type}</span>
                        <span className="text-[11px]" style={{ color: B.text3 }}>{item.time}</span>
                      </div>
                      <p className="text-[13px] font-medium truncate" style={{ color: B.text1 }}>{item.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Management */}
          <div className="mb-7">
            <ContentManagement />
          </div>

          {/* Communities */}
          <CommunitiesCard />

        </main>
      </div>
    </div>
  );
}
