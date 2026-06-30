import {
  Activity,
  BadgeCheck,
  Banknote,
  BookOpen,
  CalendarCheck,
  CheckSquare,
  CreditCard,
  Crown,
  GraduationCap,
  ImageUp,
  Megaphone,
  Package,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"

export type LaunchIcon = LucideIcon

export const launchIcons = {
  activity: Activity,
  audience: Users,
  branding: BadgeCheck,
  challenge: Crown,
  checklist: CheckSquare,
  community: Store,
  cover: ImageUp,
  course: GraduationCap,
  event: CalendarCheck,
  launch: Rocket,
  payout: CreditCard,
  post: Megaphone,
  pricing: Banknote,
  product: Package,
  protection: ShieldCheck,
  session: BookOpen,
  style: Palette,
  success: BadgeCheck,
  sparkle: Sparkles,
} as const

export type LaunchIconName = keyof typeof launchIcons
