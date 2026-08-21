"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { User as UserIcon, Settings, LifeBuoy, Plus, Compass, LogOut, ChevronDown } from "lucide-react"

interface Props {
  user: any
  profileHandle: string
  withLocale: (href: string) => string
  onLogout: () => void
  isLoggingOut: boolean
}

export function ProfileMenu({ user, profileHandle, withLocale, onLogout, isLoggingOut }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const initial = (user?.name?.[0] || profileHandle?.[0] || "U").toUpperCase()

  return (
    <>
      <div ref={ref} className="relative hidden md:block">
        <button onClick={() => setOpen(!open)}
                aria-label="Account menu"
                aria-expanded={open}
                className="flex items-center gap-2 h-10 pl-1.5 pr-2.5 rounded-xl border transition-colors hover:border-[var(--p3)]"
                style={{ background: "var(--white)", borderColor: "var(--bd)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0 overflow-hidden"
               style={{ background: "var(--p2)", color: "var(--p)" }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : initial}
          </div>
          <ChevronDown size={13} style={{ color: "var(--t3)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border overflow-hidden shadow-lg"
               style={{ background: "var(--white)", borderColor: "var(--bd)", animation: "menuIn .15s ease" }}>
            {/* User card */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--bd)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold flex-shrink-0 overflow-hidden"
                   style={{ background: "var(--p2)", color: "var(--p)" }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : initial}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--t1)" }}>
                  {user?.name || profileHandle}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--t3)" }}>
                  @{profileHandle}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <MenuLink href={withLocale(`/profile/${profileHandle}`)}
                        icon={UserIcon} label="Profile" onClick={() => setOpen(false)} />
              <MenuLink href={withLocale("/profile?edit=notifications")}
                        icon={Settings} label="Settings" onClick={() => setOpen(false)} />
              <MenuLink href={withLocale("/help")} icon={LifeBuoy} label="Help center" onClick={() => setOpen(false)} />
            </div>

            <div className="h-px" style={{ background: "var(--bd)" }} />

            <div className="p-1.5">
              <MenuLink href={withLocale("/dashboard/create-community")}
                        icon={Plus} label="Create community" onClick={() => setOpen(false)} accent />
              <MenuLink href={withLocale("/explore")}
                        icon={Compass} label="Discover communities" onClick={() => setOpen(false)} />
            </div>

            <div className="h-px" style={{ background: "var(--bd)" }} />

            <div className="p-1.5">
              <MenuButton icon={LogOut} label={isLoggingOut ? "Logging out…" : "Log out"}
                          onClick={() => { setOpen(false); onLogout() }} destructive />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes menuIn {
          0%   { transform: translateY(-4px); opacity: 0 }
          100% { transform: translateY(0);     opacity: 1 }
        }
      `}</style>
    </>
  )
}

function MenuLink({ href, icon: Icon, label, onClick, accent }:
  { href: string; icon: any; label: string; onClick?: () => void; accent?: boolean }) {
  return (
    <Link href={href} onClick={onClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{
            color: accent ? "var(--p)" : "var(--t1)",
            background: "transparent",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
      <Icon size={14} style={{ color: accent ? "var(--p)" : "var(--t2)" }} />
      {label}
    </Link>
  )
}

function MenuButton({ icon: Icon, label, onClick, destructive }:
  { icon: any; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={onClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors"
            style={{
              color: destructive ? "#dc2626" : "var(--t1)",
              background: "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = destructive ? "#fef2f2" : "var(--bg)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
      <Icon size={14} style={{ color: destructive ? "#dc2626" : "var(--t2)" }} />
      {label}
    </button>
  )
}
