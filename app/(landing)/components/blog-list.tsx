"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { getAllBlogPosts } from "@/lib/blog-content"
import { localizeHref } from "@/lib/i18n/client"
import type { BlogPost } from "@/lib/blog-content"

const POSTS_PER_PAGE = 6

function getCategoryColor(cat: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Community: { bg: "rgba(142,120,251,.12)", text: "#8e78fb", border: "rgba(142,120,251,.25)" },
    Courses: { bg: "rgba(255,155,40,.12)", text: "#e07d00", border: "rgba(255,155,40,.25)" },
    Coaching: { bg: "rgba(71,199,234,.12)", text: "#0891b2", border: "rgba(71,199,234,.25)" },
    Engagement: { bg: "rgba(246,88,135,.12)", text: "#e11d48", border: "rgba(246,88,135,.25)" },
    Marketing: { bg: "rgba(16,185,129,.12)", text: "#059669", border: "rgba(16,185,129,.25)" },
    Products: { bg: "rgba(59,130,246,.12)", text: "#2563eb", border: "rgba(59,130,246,.25)" },
  }
  return map[cat] ?? { bg: "rgba(142,120,251,.12)", text: "#8e78fb", border: "rgba(142,120,251,.25)" }
}

function BlogCardThumbnail({ category }: { category: string }) {
  const aspectStyle: React.CSSProperties = { width: "100%", aspectRatio: "16/10", position: "relative" }

  if (category === "Community") {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(142,120,251,.08) 0%,rgba(108,82,240,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(142,120,251,.06)" }} />
        <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(108,82,240,.05)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(142,120,251,.15) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#8e78fb,#6c52f0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(142,120,251,.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(142,120,251,.06)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>comm</div>
      </div>
    )
  }

  if (category === "Courses") {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(255,155,40,.08) 0%,rgba(255,120,0,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,155,40,.06)" }} />
        <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255,120,0,.05)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,155,40,.18) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#ff9b28,#e07d00)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(255,155,40,.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(255,155,40,.07)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>learn</div>
      </div>
    )
  }

  if (category === "Coaching") {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(71,199,234,.08) 0%,rgba(8,145,178,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(71,199,234,.06)" }} />
        <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(8,145,178,.05)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(71,199,234,.18) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#47c7ea,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(71,199,234,.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(71,199,234,.07)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>coach</div>
      </div>
    )
  }

  if (category === "Engagement") {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(246,88,135,.08) 0%,rgba(225,29,72,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(246,88,135,.06)" }} />
        <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(225,29,72,.05)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(246,88,135,.18) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#f65887,#e11d48)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(246,88,135,.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(246,88,135,.07)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>habit</div>
      </div>
    )
  }

  if (category === "Marketing") {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(16,185,129,.08) 0%,rgba(5,150,105,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(16,185,129,.06)" }} />
        <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(5,150,105,.05)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(16,185,129,.18) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(16,185,129,.35)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(16,185,129,.07)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>email</div>
      </div>
    )
  }

  // Products (default)
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(59,130,246,.08) 0%,rgba(37,99,235,.04) 100%)", ...aspectStyle, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(59,130,246,.06)" }} />
      <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(37,99,235,.05)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(59,130,246,.18) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(59,130,246,.35)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "48px", fontWeight: 900, color: "rgba(59,130,246,.07)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>prod</div>
    </div>
  )
}

function BlogCard({ post, t, locale, pathname }: { post: BlogPost; t: ReturnType<typeof useTranslations<"landing.blogs">>; locale: string; pathname: string }) {
  const catColor = getCategoryColor(post.category)
  const isAr = locale === "ar"
  const title = isAr ? (post.arTitle ?? post.title) : post.title
  const excerpt = isAr ? (post.arExcerpt ?? post.excerpt) : post.excerpt
  const dateStr = new Date(post.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })
  const initials = post.author.name.split(" ").map((n: string) => n[0]).join("")
  const href = localizeHref(pathname, `/blogs/${post.id}`)

  return (
    <article
      className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
      style={{ border: "1px solid var(--bd)", background: "var(--white)", boxShadow: "0 8px 40px rgba(142,120,251,.08)" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateY(-4px)"
        el.style.boxShadow = "0 16px 48px rgba(142,120,251,.15)"
        el.style.borderColor = "var(--p3)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ""
        el.style.boxShadow = "0 8px 40px rgba(142,120,251,.08)"
        el.style.borderColor = "var(--bd)"
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative" }}>
        <BlogCardThumbnail category={post.category} />
        {/* Category badge */}
        <div style={{ position: "absolute", top: "12px", insetInlineStart: "12px" }}>
          <span style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            background: catColor.bg,
            color: catColor.text,
            border: `1px solid ${catColor.border}`,
            backdropFilter: "blur(8px)",
          }}>
            {post.category}
          </span>
        </div>
        {post.featured && (
          <div style={{ position: "absolute", top: "12px", insetInlineEnd: "12px" }}>
            <span style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              background: "linear-gradient(135deg,#8e78fb,#6c52f0)",
              color: "white",
            }}>
              {t("featured")}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        <h3
          className="group-hover:text-[var(--p)] transition-colors"
          style={{
            fontWeight: 700,
            color: "var(--t1)",
            fontSize: "15px",
            lineHeight: "1.4",
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h3>
        <p style={{
          fontSize: "13px",
          color: "var(--t2)",
          lineHeight: "1.6",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: "16px",
        }}>
          {excerpt}
        </p>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "linear-gradient(135deg,#8e78fb,#6c52f0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "10px" }}>{initials}</span>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <time dateTime={post.date}>{dateStr}</time>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: "11px", color: "var(--t3)" }}>{post.readTime}</span>
          </div>
        </div>

        {/* Read more */}
        <Link
          href={href}
          aria-label={`${t("readMore")}: ${title}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--p)",
            textDecoration: "none",
          }}
        >
          {t("readMore")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export function BlogList() {
  const t = useTranslations("landing.blogs")
  const locale = useLocale()
  const pathname = usePathname()

  const allBlogPosts = getAllBlogPosts()

  const categories = [
    { key: "All", label: t("catAll") },
    { key: "Community", label: t("catCommunity") },
    { key: "Courses", label: t("catCourses") },
    { key: "Coaching", label: t("catCoaching") },
    { key: "Engagement", label: t("catEngagement") },
    { key: "Marketing", label: t("catMarketing") },
    { key: "Products", label: t("catProducts") },
  ]

  const [selectedCategory, setSelectedCategory] = useState("All")
  const [displayCount, setDisplayCount] = useState(POSTS_PER_PAGE)

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return allBlogPosts
    return allBlogPosts.filter((p) => p.category === selectedCategory)
  }, [selectedCategory, allBlogPosts])

  const displayedPosts = filteredPosts.slice(0, displayCount)
  const hasMorePosts = displayCount < filteredPosts.length

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setDisplayCount(POSTS_PER_PAGE)
  }

  return (
    <div style={{ background: "var(--bg,#fafafe)" }}>
      {/* ── Hero Section ── */}
      <section
        aria-label="Blog hero"
        style={{ position: "relative", overflow: "hidden", paddingTop: "128px", paddingBottom: "80px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        {/* Dot grid */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)",
          }}
        />
        {/* Color blobs */}
        <div aria-hidden="true" style={{ position: "absolute", top: "-80px", insetInlineStart: "10%", width: "320px", height: "320px", borderRadius: "50%", background: "var(--p)", filter: "blur(60px)", opacity: 0.15, animation: "blobMove 8s ease-in-out infinite", zIndex: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: "-60px", insetInlineEnd: "15%", width: "280px", height: "280px", borderRadius: "50%", background: "var(--cyan,#47c7ea)", filter: "blur(60px)", opacity: 0.12, animation: "blobMove 10s ease-in-out infinite reverse", zIndex: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "30%", insetInlineStart: "60%", width: "200px", height: "200px", borderRadius: "50%", background: "var(--orange,#ff9b28)", filter: "blur(60px)", opacity: 0.1, animation: "blobMove 12s ease-in-out infinite", zIndex: 0 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "720px", margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 16px", borderRadius: "999px",
              background: "linear-gradient(135deg,var(--p2,#ede9ff) 0%,#ede9ff 50%,var(--p2,#ede9ff) 100%)",
              border: "1px solid var(--p3,#c4b8fd)",
              fontSize: "12px", fontWeight: 700,
              color: "var(--p,#8e78fb)",
              letterSpacing: ".06em", textTransform: "uppercase",
              marginBottom: "20px",
              animation: "badgeShimmer 3s ease infinite",
              backgroundSize: "200% 100%",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            {t("heroEyebrow")}
          </div>

          <h1
            style={{
              fontSize: "clamp(36px,5vw,64px)",
              fontWeight: 900,
              color: "var(--t1,#111827)",
              lineHeight: 1.1,
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            {t("heroTitle")}{" "}
            <span style={{ color: "var(--p,#8e78fb)" }}>{t("heroTitleAccent")}</span>
          </h1>

          <p style={{ fontSize: "18px", color: "var(--t2,#6b7280)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto" }}>
            {t("heroSub")}
          </p>
        </div>
      </section>

      {/* ── Category Filter ── */}
      <nav aria-label="Blog category filter" style={{ padding: "0 24px 32px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", maxWidth: "720px" }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .2s",
                  border: isActive ? "1px solid transparent" : "1px solid var(--bd,#e5e7eb)",
                  background: isActive ? "linear-gradient(135deg,#8e78fb,#6c52f0)" : "var(--white,#fff)",
                  color: isActive ? "white" : "var(--t2,#6b7280)",
                  boxShadow: isActive ? "0 4px 16px rgba(142,120,251,.3)" : "none",
                }}
                aria-pressed={isActive}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Posts Grid ── */}
      <section aria-label="Blog posts" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
        {displayedPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ color: "var(--t2)", fontSize: "16px", marginBottom: "12px" }}>{t("noResults")}</p>
            <button
              onClick={() => handleCategoryChange("All")}
              style={{ color: "var(--p)", fontWeight: 600, fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}
            >
              {t("viewAll")}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                gap: "24px",
              }}
            >
              {displayedPosts.map((post) => (
                <BlogCard key={post.id} post={post} t={t} locale={locale} pathname={pathname} />
              ))}
            </div>

            {/* Count + Load More */}
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <p style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "16px" }}>
                {t("showing")} {displayedPosts.length} {t("of")} {filteredPosts.length} {t("posts")}
              </p>
              {hasMorePosts && (
                <button
                  onClick={() => setDisplayCount((c) => c + POSTS_PER_PAGE)}
                  style={{
                    padding: "12px 32px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: "var(--p,#8e78fb)",
                    color: "white",
                    border: "none",
                    boxShadow: "0 8px 30px rgba(142,120,251,.35)",
                    transition: "all .2s",
                  }}
                >
                  {t("loadMore")}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
