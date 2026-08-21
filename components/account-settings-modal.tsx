"use client"

import { useEffect, useState } from "react"
import {
  X, User as UserIcon, Shield, Bell, CreditCard, Upload, Trash2,
  Globe, Instagram, Twitter, Youtube, Linkedin, Link2, Plus, ChevronDown,
  Loader2, Check, AlertTriangle, PartyPopper, LogOut, MapPin, Eye, EyeOff, ArrowRight,
} from "lucide-react"

/* Sections keyed for tab nav */
type Tab = "profile" | "security" | "notifications" | "billing"

const TABS: { id: Tab; label: string; icon: any; color: string; soft: string }[] = [
  { id: "profile",       label: "Profile",       icon: UserIcon,   color: "var(--p)",      soft: "var(--p2)"  },
  { id: "security",      label: "Security",      icon: Shield,     color: "var(--pink)",   soft: "var(--pk2)" },
  { id: "notifications", label: "Notifications", icon: Bell,       color: "var(--cyan)",   soft: "var(--c2)"  },
  { id: "billing",       label: "Billing",       icon: CreditCard, color: "var(--orange)", soft: "var(--o2)"  },
]

interface Props {
  open: boolean
  onClose: () => void
  user: any
}

export function AccountSettingsModal({ open, onClose, user }: Props) {
  const [tab, setTab] = useState<Tab>("profile")
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">("idle")
  const [saveMsg, setSaveMsg] = useState("")

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const triggerSave = async (msg: string) => {
    setSaveMsg(msg)
    setSaveState("loading")
    await new Promise((r) => setTimeout(r, 700))
    setSaveState("success")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,.55)" }}
         onClick={onClose}>
      <div className="w-full max-w-4xl h-[85vh] rounded-2xl flex overflow-hidden"
           style={{ background: "var(--white)", animation: "settingsIn .25s ease" }}
           onClick={(e) => e.stopPropagation()}>

        {/* Left tabs rail */}
        <aside className="w-56 flex-shrink-0 flex flex-col border-r"
               style={{ background: "var(--bg)", borderColor: "var(--bd)" }}>
          <div className="p-5 border-b" style={{ borderColor: "var(--bd)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Account</p>
            <p className="text-[15px] font-semibold mt-0.5" style={{ color: "var(--t1)" }}>Settings</p>
          </div>
          <nav className="p-2 space-y-1">
            {TABS.map((T) => {
              const active = tab === T.id
              const Icon = T.icon
              return (
                <button key={T.id} onClick={() => setTab(T.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-colors"
                        style={{
                          background: active ? T.soft : "transparent",
                          color: active ? T.color : "var(--t2)",
                        }}>
                  <Icon size={14} style={{ color: T.color }} />
                  {T.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 py-4 border-b"
                  style={{ borderColor: "var(--bd)" }}>
            <h2 className="text-[16px] font-semibold" style={{ color: "var(--t1)" }}>
              {TABS.find((T) => T.id === tab)?.label}
            </h2>
            <button onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg)", color: "var(--t3)" }}>
              <X size={14} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "profile"       && <ProfileSection user={user} onSave={triggerSave} />}
            {tab === "security"      && <SecuritySection onSave={triggerSave} />}
            {tab === "notifications" && <NotificationsSection onSave={triggerSave} />}
            {tab === "billing"       && <BillingSection onSave={triggerSave} />}
          </div>
        </div>
      </div>

      {saveState === "loading" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center"
             style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="rounded-2xl px-6 py-5 flex items-center gap-3"
               style={{ background: "var(--white)" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--p)" }} />
            <span className="text-[14px] font-medium" style={{ color: "var(--t1)" }}>Saving…</span>
          </div>
        </div>
      )}
      {saveState === "success" && (
        <SuccessPopup message={saveMsg} onClose={() => setSaveState("idle")} />
      )}

      <style jsx>{`
        @keyframes settingsIn {
          0%   { transform: scale(.96); opacity: 0 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  )
}

/* ─── PROFILE ────────────────────────────────────────────────── */

function ProfileSection({ user, onSave }: { user: any; onSave: (m: string) => void }) {
  const [avatar, setAvatar]   = useState<string>(user?.avatar || "")
  const [firstName, setFirst] = useState<string>(user?.firstName || user?.name?.split(" ")[0] || "")
  const [lastName,  setLast]  = useState<string>(user?.lastName  || user?.name?.split(" ").slice(1).join(" ") || "")
  const [bio, setBio]         = useState<string>(user?.bio || "")
  const [country, setCountry] = useState<string>(user?.country || "")
  const [socials, setSocials] = useState({
    instagram: "", twitter: "", youtube: "", linkedin: "", website: "",
  })

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setAvatar(String(r.result))
    r.readAsDataURL(f)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-[26px] font-bold flex-shrink-0"
             style={{ background: "var(--p2)", color: "var(--p)" }}>
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : (firstName?.[0] || user?.name?.[0] || "U").toUpperCase()}
        </div>
        <div>
          <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--t1)" }}>Profile picture</p>
          <label className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1.5"
                 style={{ background: "var(--p2)", color: "var(--p)" }}>
            <Upload size={12} /> Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
          {avatar && (
            <button onClick={() => setAvatar("")}
                    className="ml-2 text-[12px] font-medium" style={{ color: "#ef4444" }}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="First name">
          <TextInput value={firstName} onChange={setFirst} />
        </Field>
        <Field label="Last name">
          <TextInput value={lastName} onChange={setLast} />
        </Field>
      </div>

      <Field label="Bio" hint={`${bio.length}/160`}>
        <textarea value={bio} maxLength={160} rows={3}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short line about you…"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none resize-none focus:border-[var(--p)]"
                  style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--t1)" }} />
      </Field>

      <Field label="Location / country">
        <div className="flex items-center rounded-xl border overflow-hidden"
             style={{ background: "var(--bg)", borderColor: "var(--bd)" }}>
          <MapPin size={14} className="ml-3" style={{ color: "var(--t3)" }} />
          <input value={country} onChange={(e) => setCountry(e.target.value)}
                 placeholder="e.g. Tunis, Tunisia"
                 className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none"
                 style={{ color: "var(--t1)" }} />
        </div>
      </Field>

      {/* Socials */}
      <div>
        <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--t1)" }}>Social links</p>
        <div className="space-y-2">
          <SocialInput icon={Instagram} platform="Instagram" value={socials.instagram}
                       onChange={(v) => setSocials({ ...socials, instagram: v })} placeholder="@username" />
          <SocialInput icon={Twitter}   platform="X / Twitter" value={socials.twitter}
                       onChange={(v) => setSocials({ ...socials, twitter: v })} placeholder="@username" />
          <SocialInput icon={Youtube}   platform="YouTube" value={socials.youtube}
                       onChange={(v) => setSocials({ ...socials, youtube: v })} placeholder="channel URL" />
          <SocialInput icon={Linkedin}  platform="LinkedIn" value={socials.linkedin}
                       onChange={(v) => setSocials({ ...socials, linkedin: v })} placeholder="profile URL" />
          <SocialInput icon={Link2}     platform="Website"  value={socials.website}
                       onChange={(v) => setSocials({ ...socials, website: v })} placeholder="https://…" />
        </div>
      </div>

      <SaveBar onSave={() => onSave("Your profile is saved. Looking sharp!")} />
    </div>
  )
}

function SocialInput({ icon: Icon, platform, value, onChange, placeholder }:
  { icon: any; platform: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center rounded-xl border overflow-hidden"
         style={{ background: "var(--bg)", borderColor: "var(--bd)" }}>
      <div className="w-11 h-10 flex items-center justify-center flex-shrink-0"
           style={{ color: "var(--t2)" }}>
        <Icon size={14} />
      </div>
      <span className="text-[11px] font-medium pr-2 min-w-[80px]" style={{ color: "var(--t3)" }}>{platform}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
             className="flex-1 px-2 py-2.5 text-[13px] bg-transparent outline-none"
             style={{ color: "var(--t1)" }} />
    </div>
  )
}

/* ─── SECURITY ────────────────────────────────────────────────── */

function SecuritySection({ onSave }: { onSave: (m: string) => void }) {
  const [email, setEmail] = useState("")
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Email */}
      <SectionCard title="Email address" hint="Used for login and notifications.">
        <Field label="New email">
          <TextInput value={email} onChange={setEmail} placeholder="you@domain.com" type="email" />
        </Field>
        <SaveBar onSave={() => onSave("Email updated. Verify the link we sent.")} label="Update email" />
      </SectionCard>

      {/* Password */}
      <SectionCard title="Password" hint="Use at least 8 characters — mix of letters, numbers, symbols.">
        <Field label="Current password">
          <PasswordInput value={currentPw} onChange={setCurrentPw} show={showPw} onToggle={() => setShowPw(!showPw)} />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="New password">
            <PasswordInput value={newPw} onChange={setNewPw} show={showPw} onToggle={() => setShowPw(!showPw)} />
          </Field>
          <Field label="Confirm new">
            <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showPw} onToggle={() => setShowPw(!showPw)} />
          </Field>
        </div>
        <SaveBar onSave={() => onSave("Password changed. Stay safe out there!")} label="Change password" />
      </SectionCard>

      {/* Sessions */}
      <SectionCard title="Active sessions" hint="Log out of every browser, phone or tablet you've signed in on.">
        <button onClick={() => onSave("You're signed out everywhere.")}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-left text-[13px] font-semibold hover:bg-[var(--bg)]"
                style={{ borderColor: "var(--bd)", color: "var(--t1)" }}>
          <LogOut size={14} style={{ color: "var(--pink)" }} />
          Log out of all devices
          <ArrowRight size={12} className="ml-auto" style={{ color: "var(--t3)" }} />
        </button>
      </SectionCard>

      {/* Danger zone */}
      <div className="rounded-2xl border p-5"
           style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "#fee2e2", color: "#dc2626" }}>
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: "#991b1b" }}>Delete account</p>
            <p className="text-[12px]" style={{ color: "#b91c1c" }}>
              Permanently erase your account, all your communities and content. This cannot be undone.
            </p>
          </div>
        </div>
        <button onClick={() => setDeleteOpen(true)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: "#dc2626" }}>
          Delete my account
        </button>
      </div>

      {deleteOpen && <DeleteFlow onClose={() => setDeleteOpen(false)} />}
    </div>
  )
}

function DeleteFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,.55)" }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 relative"
           style={{ background: "var(--white)" }}
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg)", color: "var(--t3)" }}>
          <X size={14} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold" style={{ color: "var(--t3)" }}>Step {step} of 2</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bd)" }}>
            <div className="h-full transition-all" style={{ background: "#dc2626", width: step === 1 ? "50%" : "100%" }} />
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} style={{ color: "#dc2626" }} />
              <h3 className="text-[16px] font-semibold" style={{ color: "var(--t1)" }}>Sorry to see you go</h3>
            </div>
            <p className="text-[13px] mb-4" style={{ color: "var(--t2)" }}>
              Before you delete your account, would you tell us why? It helps us make Chabaqa better.
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional — a few words is enough"
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none resize-none focus:border-[var(--p)]"
                      style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--t1)" }} />

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                      style={{ color: "var(--t2)" }}>
                Cancel
              </button>
              <button onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5"
                      style={{ background: "#dc2626" }}>
                Next <ArrowRight size={13} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} style={{ color: "#dc2626" }} />
              <h3 className="text-[16px] font-semibold" style={{ color: "var(--t1)" }}>Confirm with your password</h3>
            </div>
            <p className="text-[13px] mb-4" style={{ color: "var(--t2)" }}>
              This will <b>permanently delete</b> your account, communities and content. There's no undo.
            </p>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="Enter your password"
                     className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
                     style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--t1)" }} />
            </Field>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                      style={{ color: "var(--t2)" }}>
                Back
              </button>
              <button disabled={!password}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-40"
                      style={{ background: "#dc2626" }}>
                <Trash2 size={13} /> Delete forever
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── NOTIFICATIONS ────────────────────────────────────────────────── */

const MOCK_COMMUNITIES = [
  { id: "1", name: "Skoolers",          avatar: "" },
  { id: "2", name: "chabaqa testing",   avatar: "" },
  { id: "3", name: "NextGen AI",        avatar: "" },
  { id: "4", name: "AI Creator Profits",avatar: "" },
  { id: "5", name: "Communauté IA",     avatar: "" },
]

function NotificationsSection({ onSave }: { onSave: (m: string) => void }) {
  const [app, setApp] = useState({
    newFollower: true, likes: true, kaching: true, affiliate: true,
  })
  const [openCommunity, setOpenCommunity] = useState<string | null>(null)
  const [commPrefs, setCommPrefs] = useState<Record<string, any>>(() =>
    Object.fromEntries(MOCK_COMMUNITIES.map((c) => [c.id, {
      weeklyDigest: true, dailyNotifs: true, adminBroadcast: true, eventReminder: true,
    }]))
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionCard title="App notifications" hint="What Chabaqa sends you directly.">
        <ToggleRow icon={UserIcon} title="New follower"     color="#22c55e" softColor="#dcfce7"
                   checked={app.newFollower} onChange={(v) => setApp({ ...app, newFollower: v })} />
        <ToggleRow icon={UserIcon} title="Likes & mentions" color="#22c55e" softColor="#dcfce7"
                   checked={app.likes} onChange={(v) => setApp({ ...app, likes: v })} />
        <ToggleRow icon={UserIcon} title="Ka-ching (sales)" color="#22c55e" softColor="#dcfce7"
                   checked={app.kaching} onChange={(v) => setApp({ ...app, kaching: v })} />
        <ToggleRow icon={UserIcon} title="Affiliate referral" color="#22c55e" softColor="#dcfce7"
                   checked={app.affiliate} onChange={(v) => setApp({ ...app, affiliate: v })} />
      </SectionCard>

      <SectionCard title="Community notifications" hint="Fine-tune per community you've joined.">
        <div className="space-y-2">
          {MOCK_COMMUNITIES.map((c) => {
            const open = openCommunity === c.id
            const p = commPrefs[c.id]
            return (
              <div key={c.id} className="rounded-xl border overflow-hidden"
                   style={{ borderColor: "var(--bd)" }}>
                <button onClick={() => setOpenCommunity(open ? null : c.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
                       style={{ background: "var(--p2)", color: "var(--p)" }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: "var(--t1)" }}>{c.name}</span>
                  <ChevronDown size={14} style={{ color: "var(--t3)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-1 space-y-1" style={{ background: "var(--bg)" }}>
                    <MiniToggle title="Weekly digest email"       checked={p.weeklyDigest}    onChange={(v) => setCommPrefs({ ...commPrefs, [c.id]: { ...p, weeklyDigest: v } })} />
                    <MiniToggle title="Daily notifications email" checked={p.dailyNotifs}     onChange={(v) => setCommPrefs({ ...commPrefs, [c.id]: { ...p, dailyNotifs: v } })} />
                    <MiniToggle title="Admin broadcast email"     checked={p.adminBroadcast} onChange={(v) => setCommPrefs({ ...commPrefs, [c.id]: { ...p, adminBroadcast: v } })} />
                    <MiniToggle title="Event reminders"           checked={p.eventReminder}  onChange={(v) => setCommPrefs({ ...commPrefs, [c.id]: { ...p, eventReminder: v } })} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SaveBar onSave={() => onSave("Notification preferences saved.")} />
    </div>
  )
}

function MiniToggle({ title, checked, onChange }:
  { title: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px]" style={{ color: "var(--t2)" }}>{title}</span>
      <button onClick={() => onChange(!checked)}
              className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: checked ? "var(--p)" : "var(--bd)" }}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </button>
    </div>
  )
}

/* ─── BILLING (user side) ────────────────────────────────────────────────── */

function BillingSection({ onSave }: { onSave: (m: string) => void }) {
  const [card] = useState({ brand: "VISA", last4: "4242", exp: "09/28" })
  const history = [
    { id: "INV-2026-08", date: "Aug 12, 2026", amount: 29, item: "Skoolers · Monthly" },
    { id: "INV-2026-07", date: "Jul 12, 2026", amount: 29, item: "Skoolers · Monthly" },
    { id: "INV-2026-06", date: "Jun 12, 2026", amount: 49, item: "AI Creator Profits · Monthly" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionCard title="Payment method" hint="Used for community subscriptions and purchases.">
        <div className="rounded-xl p-4 relative overflow-hidden"
             style={{ background: "linear-gradient(135deg, #1a1730 0%, #3d3570 100%)" }}>
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20" style={{ background: "#fff" }} />
          <p className="text-white text-[11px] uppercase tracking-wider opacity-70">{card.brand}</p>
          <p className="text-white text-[15px] font-mono mt-3 tracking-wider">•••• •••• •••• {card.last4}</p>
          <p className="text-white text-[10px] mt-2 opacity-80">Exp {card.exp}</p>
        </div>
        <button onClick={() => onSave("Payment method updated.")}
                className="w-full px-3 py-2.5 rounded-xl text-[12px] font-semibold border flex items-center justify-center gap-1.5 mt-3"
                style={{ borderColor: "var(--bd)", color: "var(--t2)" }}>
          <CreditCard size={13} /> Update payment method
        </button>
      </SectionCard>

      <SectionCard title="Payment history" hint="Every charge from your account.">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--bd)" }}>
          {history.map((h, i) => (
            <div key={h.id} className="px-4 py-3 flex items-center gap-3"
                 style={{ borderTop: i > 0 ? "1px solid var(--bd)" : "none" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: "var(--t1)" }}>{h.item}</p>
                <p className="text-[11px]" style={{ color: "var(--t3)" }}>{h.date} · {h.id}</p>
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--t1)" }}>${h.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ─── ATOMS ────────────────────────────────────────────────── */

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 space-y-3"
         style={{ background: "var(--white)", borderColor: "var(--bd)" }}>
      <div>
        <p className="text-[13px] font-semibold" style={{ color: "var(--t1)" }}>{title}</p>
        {hint && <p className="text-[12px] mt-0.5" style={{ color: "var(--t3)" }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-medium" style={{ color: "var(--t2)" }}>{label}</label>
        {hint && <span className="text-[11px]" style={{ color: "var(--t3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = "text" }:
  { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
           className="w-full px-3 py-2.5 rounded-xl text-[13px] border outline-none focus:border-[var(--p)]"
           style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--t1)" }} />
  )
}

function PasswordInput({ value, onChange, show, onToggle }:
  { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center rounded-xl border overflow-hidden"
         style={{ background: "var(--bg)", borderColor: "var(--bd)" }}>
      <input type={show ? "text" : "password"} value={value}
             onChange={(e) => onChange(e.target.value)}
             className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none"
             style={{ color: "var(--t1)" }} />
      <button onClick={onToggle}
              className="px-3 h-full flex items-center" style={{ color: "var(--t3)" }}>
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

function ToggleRow({ icon: Icon, title, checked, onChange, color = "var(--p)", softColor = "var(--p2)" }:
  { icon: any; title: string; checked: boolean; onChange: (v: boolean) => void; color?: string; softColor?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: checked ? softColor : "var(--bg)", color: checked ? color : "var(--t3)" }}>
        <Icon size={14} />
      </div>
      <p className="flex-1 text-[13px] font-medium" style={{ color: "var(--t1)" }}>{title}</p>
      <button onClick={() => onChange(!checked)}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: checked ? color : "var(--bd)" }}>
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  )
}

function SaveBar({ onSave, label = "Save changes" }: { onSave: () => void; label?: string }) {
  return (
    <div className="flex justify-end pt-3 border-t" style={{ borderColor: "var(--bd)" }}>
      <button onClick={onSave}
              className="mt-3 px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, var(--p) 0%, #a08cff 100%)",
                boxShadow: "0 8px 20px -8px var(--p)",
              }}>
        {label}
      </button>
    </div>
  )
}

function SuccessPopup({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,.4)" }}
         onClick={onClose}>
      <div className="rounded-2xl p-6 text-center flex flex-col items-center"
           style={{ background: "var(--white)", width: 380, minHeight: 260, animation: "popIn .25s ease" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center flex-shrink-0"
             style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}>
          <PartyPopper size={28} color="#fff" />
        </div>
        <h3 className="text-[17px] font-semibold mb-1" style={{ color: "var(--t1)" }}>All set!</h3>
        <p className="text-[13px] flex-1 flex items-center" style={{ color: "var(--t2)" }}>{message}</p>
        <button onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl text-[13px] font-semibold text-white flex-shrink-0"
                style={{ background: "var(--p)" }}>
          Awesome
        </button>
      </div>
      <style jsx>{`
        @keyframes popIn {
          0%   { transform: scale(.9); opacity: 0 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
