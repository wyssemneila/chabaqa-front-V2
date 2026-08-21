"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LogOut, User as UserIcon, Plus, LayoutDashboard } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LangToggle } from "@/components/lang-toggle"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfileHandle } from "@/lib/profile-handle"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { ProfileMenu } from "@/components/profile-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const t = useTranslations("nav")
  const { user: authUser, loading, logout } = useAuth()
  const isAuthenticated = !!authUser
  const profileHandle = getUserProfileHandle(authUser)
  const withLocale = (href: string) => localizeHref(pathname, href)

  const NAV_LINKS = [
    { href: "/#features", label: t("features") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/explore", label: t("explore") },
    { href: "/blogs", label: t("blog") },
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError("")

    try {
      await logout()
    } catch (error) {
      setError("Logout failed")
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const ids = ["features", "pricing", "about", "faq"]
    const observers: IntersectionObserver[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.35 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isMenuOpen])

  return (
    <div ref={menuRef}>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--bd)] shadow-sm"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href={withLocale("/")} aria-label="Chabaqa — go to homepage" className="flex-shrink-0">
          <Image src="/Logos/PNG/frensh1.png" alt="Chabaqa" width={140} height={44} className="h-11 w-auto" priority />
        </Link>

        {/* Desktop links */}
        <div role="menubar" className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={withLocale(link.href)}
              role="menuitem"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeSection === link.href.replace("#", "").split("/").pop()
                  ? "text-[var(--p)] bg-[var(--p2)]"
                  : "text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--p2)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {loading ? null : !isAuthenticated ? (
            <>
              <Link
                href={withLocale("/signin")}
                className="hidden md:inline-flex items-center h-8 px-3 rounded-lg text-[12px] font-semibold text-[var(--t2)] border border-[var(--bd)] bg-[var(--white)] hover:border-[var(--p3)] hover:text-[var(--p)] transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href={withLocale("/dashboard/create-community")}
                className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-[var(--p)] hover:bg-[var(--p-dark)] transition-colors shadow-[0_4px_12px_rgba(142,120,251,.35)]"
              >
                {t("start")}
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <Link
                href={withLocale("/dashboard/create-community")}
                aria-label="Create Community"
                title="Create Community"
                className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--bd)] text-[var(--t2)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Link>
              {authUser?.role === "creator" && (
                <Link
                  href={withLocale("/creator/dashboard")}
                  aria-label="Creator Dashboard"
                  title="Creator Dashboard"
                  className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--bd)] text-[var(--t2)] hover:text-[var(--p)] hover:border-[var(--p3)] transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}
              <ProfileMenu
                user={authUser}
                profileHandle={profileHandle}
                withLocale={withLocale}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </>
          )}
          {/* Burger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--bd)] bg-[var(--white)] text-[var(--t2)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="22" height="22" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="22" height="22" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Error message */}
      {error && (
        <div className="fixed top-16 inset-x-0 z-40 bg-red-100 border-b border-red-400 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        role="menu"
        aria-hidden={!isMenuOpen}
        className={`md:hidden fixed inset-x-0 top-16 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--bd)] flex flex-col px-6 py-4 gap-2 transition-all duration-300 ${
          isMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={withLocale(link.href)}
            role="menuitem"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={() => setIsMenuOpen(false)}
            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeSection === link.href.replace("#", "").split("/").pop()
                ? "text-[var(--p)] bg-[var(--p2)]"
                : "text-[var(--t2)] hover:bg-[var(--p2)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--bd)]">
          <LangToggle size="sm" />
          <ThemeToggle size="sm" />
          <div className="flex-1 flex gap-2">
          {loading ? null : !isAuthenticated ? (
            <>
              <Link
                href={withLocale("/signin")}
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex-1 flex items-center justify-center h-9 rounded-xl text-[13px] font-semibold text-[var(--t2)] border border-[var(--bd)] bg-[var(--white)]"
              >
                {t("login")}
              </Link>
              <Link
                href={withLocale("/dashboard/create-community")}
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex-1 flex items-center justify-center h-9 rounded-xl text-[13px] font-semibold text-white bg-[var(--p)]"
              >
                {t("start")} →
              </Link>
            </>
          ) : (
            <>
              <Link
                href={withLocale(`/profile/${profileHandle}`)}
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-[var(--t2)] border border-[var(--bd)] bg-[var(--white)]"
              >
                <UserIcon className="w-4 h-4" />
                @{profileHandle}
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsMenuOpen(false)
                }}
                tabIndex={isMenuOpen ? 0 : -1}
                disabled={isLoggingOut}
                className="flex-1 flex items-center justify-center h-10 rounded-xl text-sm font-semibold text-white bg-[var(--p)] disabled:opacity-70"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
