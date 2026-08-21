import { Card } from "@/components/ui/card"
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Code2,
  Compass,
  FileText,
  Flag,
  Globe,
  HeartHandshake,
  Layers,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessageSquareText,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CSSProperties, ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import type { CommunityThemeTokens } from "@/lib/community-theme"

interface CommunityOverviewProps {
  community: {
    name: string
    type?: string
    category: string
    longDescription?: string
  }
  overviewContent?: PageContent["overview"] | null
  settingsFeatures?: string[]
  themeTokens?: CommunityThemeTokens
}

type OverviewDisplayItem = {
  title: string
  description?: string
  iconComponent?: LucideIcon
  iconEmoji?: string
  color: string
  iconStyle?: CSSProperties
}

const iconLibrary: Record<string, LucideIcon> = {
  community: Users,
  users: Users,
  members: Users,
  audience: Users,
  chat: MessageSquare,
  message: MessageSquareText,
  discussion: MessageSquareText,
  forum: MessageSquareText,
  qna: MessageSquareText,
  mentorship: HeartHandshake,
  networking: HeartHandshake,
  support: HeartHandshake,
  video: Video,
  webinar: Video,
  live: Video,
  course: BookOpen,
  learning: BookOpen,
  library: BookOpen,
  resources: FileText,
  docs: FileText,
  templates: ClipboardList,
  growth: TrendingUp,
  analytics: BarChart3,
  metrics: Activity,
  strategy: Lightbulb,
  ideas: Lightbulb,
  innovation: Lightbulb,
  rocket: Rocket,
  launch: Rocket,
  code: Code2,
  tech: MonitorSmartphone,
  product: ShoppingBag,
  shop: ShoppingBag,
  ecommerce: ShoppingBag,
  marketing: Megaphone,
  megaphone: Megaphone,
  publicity: Megaphone,
  branding: Compass,
  global: Globe,
  world: Globe,
  international: Globe,
  target: Target,
  objective: Target,
  plan: ClipboardList,
  roadmap: Flag,
  layers: Layers,
  design: Layers,
  portfolio: Briefcase,
  shield: ShieldCheck,
  security: ShieldCheck,
  compliance: ShieldCheck,
  zap: Zap,
  energy: Zap,
}

function IconBadge({
  Icon,
  gradient,
  style,
}: {
  Icon: LucideIcon
  gradient: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm ring-1 ring-white/40 group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none [mask-image:radial-gradient(circle_at_30%_20%,white,transparent_70%)] opacity-75" />
      <div className="absolute inset-[1px] rounded-[11px] bg-white/10 backdrop-blur-[1px]" />
      <div className="relative z-10 flex w-full h-full items-center justify-center">
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </div>
    </div>
  )
}

export function CommunityOverview({
  community,
  overviewContent,
  settingsFeatures = [],
  themeTokens,
}: CommunityOverviewProps) {
  const resolveFeatureIcon = (feature: string): LucideIcon => {
    const lowered = feature.toLowerCase()
    const match = Object.entries(iconLibrary).find(([keyword]) => lowered.includes(keyword))
    return match?.[1] || Lightbulb
  }

  const getFallbackItems = (): OverviewDisplayItem[] => {
    const baseItems = [
      {
        iconComponent: MessageSquareText,
        title: "Access to exclusive community discussions and forums",
        color: "from-blue-500 to-blue-600",
      },
      {
        iconComponent: Video,
        title: "Weekly live Q&A sessions with industry experts",
        color: "from-purple-500 to-purple-600",
      },
      {
        iconComponent: BookOpen,
        title: "Premium resources, templates, and learning materials",
        color: "from-green-500 to-green-600",
      },
      {
        iconComponent: HeartHandshake,
        title: "Networking opportunities with like-minded professionals",
        color: "from-pink-500 to-pink-600",
      },
    ]

    const categorySpecificItems: Record<string, OverviewDisplayItem[]> = {
      marketing: [
        {
          iconComponent: TrendingUp,
          title: "Advanced email marketing strategies and automation workflows",
          color: "from-orange-500 to-orange-600",
        },
        {
          iconComponent: Lightbulb,
          title: "Growth hacking tactics backed by real case studies",
          color: "from-yellow-500 to-yellow-600",
        },
        {
          iconComponent: FileText,
          title: "Content marketing frameworks and editorial calendars",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Award,
          title: "Campaign analytics and performance optimization insights",
          color: "from-green-500 to-green-600",
        },
      ],
      tech: [
        {
          iconComponent: CheckCircle,
          title: "Comprehensive code reviews with senior developers",
          color: "from-indigo-500 to-indigo-600",
        },
        {
          iconComponent: BookOpen,
          title: "Technical tutorials covering modern frameworks and tools",
          color: "from-cyan-500 to-cyan-600",
        },
        {
          iconComponent: Users,
          title: "Collaborative hackathons and coding challenges",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Award,
          title: "Career growth workshops and mentorship programs",
          color: "from-pink-500 to-pink-600",
        },
      ],
      design: [
        {
          iconComponent: MessageSquareText,
          title: "Weekly design critique sessions for portfolio improvement",
          color: "from-pink-500 to-pink-600",
        },
        {
          iconComponent: BookOpen,
          title: "UI/UX resources including design systems and component libraries",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Video,
          title: "Live workshops on design tools (Figma, Adobe XD, Sketch)",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Award,
          title: "Portfolio reviews and career advancement guidance",
          color: "from-green-500 to-green-600",
        },
      ],
      business: [
        {
          iconComponent: TrendingUp,
          title: "Strategic business planning and growth frameworks",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: FileText,
          title: "Financial planning templates and investment resources",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Exclusive networking events with successful entrepreneurs",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Lightbulb,
          title: "Proven growth hacking and scaling strategies",
          color: "from-orange-500 to-orange-600",
        },
      ],
      fitness: [
        {
          iconComponent: Award,
          title: "Personalized workout plans and training programs",
          color: "from-red-500 to-red-600",
        },
        {
          iconComponent: Video,
          title: "Live workout sessions and form correction guidance",
          color: "from-orange-500 to-orange-600",
        },
        {
          iconComponent: BookOpen,
          title: "Nutrition guides and meal planning templates",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Accountability groups and challenge competitions",
          color: "from-blue-500 to-blue-600",
        },
      ],
      education: [
        {
          iconComponent: BookOpen,
          title: "Structured learning paths with curated content",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Video,
          title: "Interactive video lessons with expert instructors",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Award,
          title: "Certificates and credentials for course completion",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Study groups and peer learning opportunities",
          color: "from-orange-500 to-orange-600",
        },
      ],
    }

    const category = community.category.toLowerCase()
    return categorySpecificItems[category as keyof typeof categorySpecificItems] || baseItems
  }

  const dynamicCards: OverviewDisplayItem[] =
    overviewContent?.cards
      ?.filter((card) => card.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((card) => {
        const iconKey = card.icon?.toLowerCase?.().trim() ?? ""
        const resolvedIcon = iconKey ? iconLibrary[iconKey] : Lightbulb
        return {
          title: card.title,
          description: card.description,
          iconComponent: resolvedIcon,
          color: "from-[#8e78fb] to-[#f48fb1]",
          iconStyle: card.iconColor ? { background: card.iconColor } : undefined,
        }
      }) || []

  const settingsCards: OverviewDisplayItem[] = settingsFeatures
    .filter((feature) => typeof feature === "string" && feature.trim() !== "")
    .map((feature) => ({
      title: feature.trim(),
      description: "Included in your membership.",
      iconComponent: resolveFeatureIcon(feature),
      color: "from-[#8e78fb] to-[#f48fb1]",
    }))

  const dedupeItems = (items: OverviewDisplayItem[]) => {
    const seen = new Set<string>()
    const result: OverviewDisplayItem[] = []
    for (const item of items) {
      const key = item.title.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push(item)
    }
    return result
  }

  const overviewItems =
    settingsCards.length > 0
      ? dedupeItems(settingsCards)
      : dynamicCards.length > 0
        ? dedupeItems(dynamicCards)
        : getFallbackItems()

  return (
    <div className="mt-8 grid grid-cols-1 gap-3.5 sm:mt-10 sm:gap-5 md:grid-cols-2">
      {overviewItems.map((item, index) => {
        const IconComponent = item.iconComponent
        const borderColorMap: Record<string, string> = {
          "from-blue-500 to-blue-600": "border-blue-200 hover:border-blue-300",
          "from-purple-500 to-purple-600": "border-purple-200 hover:border-purple-300",
          "from-green-500 to-green-600": "border-green-200 hover:border-green-300",
          "from-pink-500 to-pink-600": "border-pink-200 hover:border-pink-300",
          "from-orange-500 to-orange-600": "border-orange-200 hover:border-orange-300",
          "from-yellow-500 to-yellow-600": "border-yellow-200 hover:border-yellow-300",
          "from-indigo-500 to-indigo-600": "border-indigo-200 hover:border-indigo-300",
          "from-cyan-500 to-cyan-600": "border-cyan-200 hover:border-cyan-300",
          "from-red-500 to-red-600": "border-red-200 hover:border-red-300",
          "from-[#8e78fb] to-[#f48fb1]": "border-purple-200 hover:border-pink-300",
        }
        const borderColor = borderColorMap[item.color] || "border-gray-200 hover:border-purple-200"
        const iconGradient = themeTokens ? "" : item.color
        const iconStyle: CSSProperties | undefined = themeTokens
          ? {
            background: `linear-gradient(135deg, ${themeTokens.primary} 0%, ${themeTokens.primary} 100%)`,
            color: themeTokens.primaryText,
            boxShadow: `0 6px 16px ${themeTokens.softPrimary}`,
          }
          : item.iconStyle
        
        return (
          <Card
            key={index}
            className={`group rounded-2xl border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${borderColor}`}
            style={
              themeTokens
                ? {
                  borderColor: themeTokens.mutedBorder,
                  backgroundColor: "#ffffff",
                }
                : undefined
            }
          >
            <div className="flex items-start gap-3 sm:gap-3.5">
              {IconComponent && (
                <IconBadge Icon={IconComponent} gradient={iconGradient} style={iconStyle} />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold leading-6 tracking-[-0.01em] text-gray-900 sm:text-[15px]">{item.title}</p>
                {item.description && (
                  <p className="mt-1.5 text-xs leading-5 text-gray-600 sm:text-[13px]">{item.description}</p>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
