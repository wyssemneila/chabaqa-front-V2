/**
 * Invitation email template presets.
 *
 * These are frontend-only presets that pre-fill the `personalMessage` field.
 * Placeholders `{name}` and `{community}` are replaced at render time.
 */

export type TemplateTone = "warm" | "formal" | "casual" | "hype" | "exclusive"

export interface InvitationTemplate {
  id: string
  label: string
  description: string
  tone: TemplateTone
  /** Lucide icon name (for display only) */
  iconName: string
  /** Message body with optional {name} and {community} placeholders */
  body: string
}

export const INVITATION_TEMPLATES: InvitationTemplate[] = [
  {
    id: "warm-welcome",
    label: "Warm Welcome",
    description: "Friendly and inviting tone",
    tone: "warm",
    iconName: "heart",
    body: `Hi {name},\n\nI'd love for you to join our community, {community}! It's a space where we share ideas, learn together, and support each other.\n\nI think you'd really enjoy being part of it. Looking forward to seeing you there!`,
  },
  {
    id: "exclusive-access",
    label: "Exclusive Access",
    description: "VIP / limited-access feel",
    tone: "exclusive",
    iconName: "sparkles",
    body: `Hi {name},\n\nYou've been selected to join {community} — an exclusive community for a curated group of people. This is a personal invite just for you.\n\nSpots are limited, so don't miss out. I'd be thrilled to have you on board.`,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Business-appropriate and polished",
    tone: "formal",
    iconName: "briefcase",
    body: `Dear {name},\n\nI'm reaching out to invite you to join {community}. Our community brings together professionals for meaningful collaboration and growth.\n\nI believe your expertise would be a valuable addition. I look forward to connecting with you there.`,
  },
  {
    id: "casual-hangout",
    label: "Casual Invite",
    description: "Relaxed and conversational",
    tone: "casual",
    iconName: "coffee",
    body: `Hey {name}! 👋\n\nJust wanted to let you know about {community} — it's a cool group where we hang out, share stuff, and have a good time.\n\nNo pressure, but I think you'd fit right in. Come check it out!`,
  },
  {
    id: "join-the-movement",
    label: "Join the Movement",
    description: "Energetic and motivational",
    tone: "hype",
    iconName: "rocket",
    body: `Hey {name}!\n\nSomething exciting is happening at {community} and I want YOU to be part of it. We're building something amazing together — a community of action-takers and dreamers.\n\nDon't sit this one out. Join us and let's make an impact!`,
  },
]

export const TONE_COLORS: Record<TemplateTone, string> = {
  warm: "text-rose-500",
  formal: "text-slate-600",
  casual: "text-sky-500",
  hype: "text-orange-500",
  exclusive: "text-violet-500",
}

export const TONE_LABELS: Record<TemplateTone, string> = {
  warm: "Warm",
  formal: "Formal",
  casual: "Casual",
  hype: "Energetic",
  exclusive: "Exclusive",
}

/**
 * Replace template placeholders with actual values.
 */
export function fillTemplate(
  body: string,
  vars: { name?: string; community?: string },
): string {
  let result = body
  if (vars.name) {
    result = result.replace(/\{name\}/g, vars.name)
  } else {
    result = result.replace(/\{name\}/g, "there")
  }
  if (vars.community) {
    result = result.replace(/\{community\}/g, vars.community)
  } else {
    result = result.replace(/\{community\}/g, "our community")
  }
  return result
}
