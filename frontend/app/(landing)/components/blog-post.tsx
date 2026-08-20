"use client"

import { useState, useEffect, useRef } from "react"
import DOMPurify from "isomorphic-dompurify"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import type { BlogPost as BlogPostType } from "@/lib/blog-content"
import { getRelatedBlogPosts } from "@/lib/blog-content"
import { localizeHref } from "@/lib/i18n/client"
import "../blogs/blog-styles.css"

interface TocItem {
  id: string
  text: string
  level: number
}

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

interface BlogPostProps {
  post: BlogPostType
}

export function BlogPost({ post }: BlogPostProps) {
  const t = useTranslations("landing.blogs")
  const locale = useLocale()
  const pathname = usePathname()
  const isAr = locale === "ar"

  const title = isAr ? (post.arTitle ?? post.title) : post.title
  const content = isAr ? (post.arContent ?? post.content) : post.content
  const excerpt = isAr ? (post.arExcerpt ?? post.excerpt) : post.excerpt
  const catColor = getCategoryColor(post.category)
  const dateStr = new Date(post.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })
  const initials = post.author.name.split(" ").map((n: string) => n[0]).join("")
  const relatedPosts = getRelatedBlogPosts(post, 3)

  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Extract TOC
  useEffect(() => {
    if (!contentRef.current) return
    const headings = contentRef.current.querySelectorAll("h2, h3")
    const items: TocItem[] = []
    headings.forEach((el, i) => {
      if (!el.id) el.id = `heading-${i}`
      items.push({ id: el.id, text: el.textContent ?? "", level: el.tagName === "H2" ? 2 : 3 })
    })
    setTocItems(items)
  }, [content])

  // IntersectionObserver for active TOC item
  useEffect(() => {
    if (tocItems.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [tocItems])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const blogsHref = localizeHref(pathname, "/blogs")

  return (
    <article>
      {/* ── Hero Header ── */}
      <header
        style={{ position: "relative", overflow: "hidden", paddingTop: "96px", paddingBottom: "48px", paddingLeft: "24px", paddingRight: "24px" }}
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
        <div aria-hidden="true" style={{ position: "absolute", top: "-80px", insetInlineStart: "5%", width: "300px", height: "300px", borderRadius: "50%", background: "var(--p,#8e78fb)", filter: "blur(60px)", opacity: 0.13, animation: "blobMove 8s ease-in-out infinite", zIndex: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: "-60px", insetInlineEnd: "10%", width: "260px", height: "260px", borderRadius: "50%", background: "var(--cyan,#47c7ea)", filter: "blur(60px)", opacity: 0.1, animation: "blobMove 10s ease-in-out infinite reverse", zIndex: 0 }} />

        {/* Back link */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto 24px" }}>
          <Link
            href={blogsHref}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--p,#8e78fb)", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("backToBlog")}
          </Link>
        </div>

        {/* Centered content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          {/* Category badge */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              background: catColor.bg,
              color: catColor.text,
              border: `1px solid ${catColor.border}`,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(24px,4vw,42px)",
              fontWeight: 900,
              color: "var(--t1,#111827)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
            }}
          >
            {title}
          </h1>

          {/* Meta row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--t2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <time dateTime={post.date}>{dateStr}</time>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--t2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {post.readTime}
            </span>
            <button
              onClick={handleShare}
              aria-label={t("share")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "999px",
                border: "1px solid var(--bd)", background: "var(--white,#fff)",
                color: "var(--p)", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all .2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
              {copied ? t("linkCopied") : t("share")}
            </button>
          </div>

          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg,#8e78fb,#6c52f0)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>{initials}</span>
            </div>
            <div style={{ textAlign: isAr ? "right" : "left" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>{post.author.name}</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>{post.author.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Two-column Layout ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px 64px", display: "flex", gap: "48px", alignItems: "flex-start" }}>
        {/* Sidebar TOC — desktop only */}
        <aside
          aria-label={t("toc")}
          className="hidden lg:block"
          style={{ width: "220px", flexShrink: 0, position: "sticky", top: "96px" }}
        >
          <nav>
            <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--p)", marginBottom: "12px" }}>
              {t("toc")}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tocItems.map((item) => (
                <li key={item.id} style={{ marginBottom: "4px" }}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: isAr ? "right" : "left",
                      padding: item.level === 2 ? "4px 8px" : "3px 8px 3px 20px",
                      borderRadius: "6px",
                      fontSize: item.level === 2 ? "12px" : "11px",
                      fontWeight: activeId === item.id ? 700 : 500,
                      color: activeId === item.id ? "var(--p)" : "var(--t3)",
                      background: activeId === item.id ? "var(--p2,#ede9ff)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "all .15s",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Article */}
          <div
            ref={contentRef}
            className="blog-content"
            style={{ maxWidth: "680px" }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--bd)", margin: "48px 0" }} />

          {/* Author Card */}
          <section aria-label={t("aboutAuthor")} style={{
            borderRadius: "20px",
            background: "linear-gradient(135deg,var(--p2,#ede9ff) 0%,var(--white,#fff) 100%)",
            border: "1px solid var(--p3,#c4b8fd)",
            padding: "28px",
            marginBottom: "48px",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--p)", marginBottom: "16px" }}>
              {t("aboutAuthor")}
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "linear-gradient(135deg,#8e78fb,#6c52f0)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                boxShadow: "0 4px 16px rgba(142,120,251,.3)",
              }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>{initials}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--t1)", marginBottom: "2px" }}>{post.author.name}</div>
                <div style={{ fontSize: "12px", color: "var(--p)", fontWeight: 600, marginBottom: "8px" }}>{post.author.role}</div>
                <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.6, margin: 0 }}>{post.author.bio}</p>
              </div>
            </div>
          </section>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section aria-label={t("relatedPosts")} style={{ marginBottom: "48px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--t1)", marginBottom: "20px" }}>{t("relatedPosts")}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "16px" }}>
                {relatedPosts.map((related) => {
                  const relTitle = isAr ? (related.arTitle ?? related.title) : related.title
                  const relColor = getCategoryColor(related.category)
                  const relHref = localizeHref(pathname, `/blogs/${related.id}`)
                  return (
                    <Link
                      key={related.id}
                      href={relHref}
                      style={{ textDecoration: "none", display: "block", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--bd)", background: "var(--white)", transition: "all .2s" }}
                    >
                      <div style={{ height: "80px", background: `linear-gradient(135deg,${relColor.bg},transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: relColor.text, textTransform: "uppercase", letterSpacing: ".06em" }}>{related.category}</span>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{relTitle}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* CTA Block */}
          <section
            aria-label={t("postCta")}
            style={{
              borderRadius: "24px",
              background: "linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)",
              padding: "40px 32px",
              textAlign: "center",
              boxShadow: "0 16px 48px rgba(142,120,251,.35)",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 900, color: "white", marginBottom: "8px" }}>{t("postCta")}</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,.85)", marginBottom: "24px" }}>{t("postCtaSub")}</p>
            <Link
              href={localizeHref(pathname, "/signup")}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                borderRadius: "14px",
                background: "white",
                color: "#8e78fb",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,.12)",
              }}
            >
              {t("getStarted")}
            </Link>
          </section>
        </div>
      </div>
    </article>
  )
}
