import type { ComponentType } from "react"
import { AlertCircle, ArrowRight, Bell, Building, Lock, Mail, MessageSquare, Plus, SearchX, ShieldAlert, UserPlus } from "lucide-react"
import { launchIcons } from "@/components/icons/launch-icons"

export type CreatorIcon = ComponentType<{ className?: string }>

export interface CreatorEmptyStateAction {
  label: string
  href: string
  icon?: CreatorIcon
}

export interface CreatorEmptyStateDefinition {
  icon: CreatorIcon
  title: string
  description: string
  action?: CreatorEmptyStateAction
  tips?: string[]
}

const CREATOR_EMPTY_STATE_DEFINITION_MAP = {
  communities: {
    icon: launchIcons.community,
    title: "No communities yet",
    description: "Communities are the home for your audience. Create one to start sharing content and growing your business.",
    action: { label: "Create Your First Community", href: "/creator/communities/create", icon: Plus },
    tips: ["Start with one clear audience", "Add logo and cover images before inviting members"],
  },
  courses: {
    icon: launchIcons.course,
    title: "No courses yet",
    description: "Courses let you package and sell your knowledge. Start from a mini-course template and edit it quickly.",
    action: { label: "Use Mini Course Template", href: "/creator/courses/new?template=mini-course", icon: Plus },
    tips: ["Start with a simple first lesson", "Keep the first course focused on one outcome"],
  },
  challenges: {
    icon: launchIcons.challenge,
    title: "No challenges yet",
    description: "Challenges help your community stay engaged and accountable. Start with a 7-day challenge template.",
    action: { label: "Use 7-Day Template", href: "/creator/challenges/new?template=7-day-challenge", icon: Plus },
    tips: ["Use one daily action", "Set a clear start and end date"],
  },
  sessions: {
    icon: launchIcons.session,
    title: "No sessions yet",
    description: "Sessions let you offer live or scheduled 1-on-1 calls. Start with a 1:1 call template.",
    action: { label: "Use 1:1 Call Template", href: "/creator/sessions/new?template=one-to-one-call", icon: Plus },
    tips: ["Set availability before publishing", "Use a clear session outcome"],
  },
  events: {
    icon: launchIcons.event,
    title: "No events yet",
    description: "Events bring your community together. Start with an online webinar template.",
    action: { label: "Use Webinar Template", href: "/creator/events/new?template=online-webinar", icon: Plus },
    tips: ["Add date, time, and access details", "Promote events with a pinned post"],
  },
  products: {
    icon: launchIcons.product,
    title: "No products yet",
    description: "Sell digital products directly to your community. Start with a digital download template.",
    action: { label: "Use Digital Download Template", href: "/creator/products/new?template=digital-download", icon: Plus },
    tips: ["Templates, guides, and toolkits are good first products", "Show exactly what buyers receive"],
  },
  posts: {
    icon: launchIcons.post,
    title: "No posts yet",
    description: "Posts keep your community informed and engaged. Share your first update.",
    action: { label: "Write a Post", href: "/creator/posts?create=1", icon: Plus },
    tips: ["Use posts for updates, announcements, and quick wins", "Pin the most useful post for new members"],
  },
  subscriptions: {
    icon: launchIcons.pricing,
    title: "No subscriptions yet",
    description: "Recurring subscriptions give you predictable revenue. Create a plan for your community members.",
    action: { label: "Create Plan", href: "/creator/monetization/subscriptions", icon: Plus },
    tips: ["Keep pricing simple at launch", "Explain what members get every month"],
  },
  payouts: {
    icon: launchIcons.payout,
    title: "No payouts yet",
    description: "Your payout history will appear here once you have earnings to withdraw.",
    action: { label: "View Revenue", href: "/creator/monetization/subscriptions", icon: ArrowRight },
    tips: ["Configure payout details before launch", "Review payout status after paid sales"],
  },
  notifications: {
    icon: Bell,
    title: "All caught up",
    description: "You have no new notifications. Check back later for updates.",
    action: { label: "Go to Dashboard", href: "/creator/dashboard", icon: ArrowRight },
    tips: ["Important payment and access updates appear here"],
  },
  analytics: {
    icon: launchIcons.activity,
    title: "No analytics data yet",
    description: "Analytics will populate once your community has activity. Start by publishing content.",
    action: { label: "Create Content", href: "/creator/courses", icon: ArrowRight },
    tips: ["Views and completion data appear after members engage"],
  },
  team: {
    icon: UserPlus,
    title: "No team members yet",
    description: "Invite collaborators to help manage your community. Assign roles and permissions.",
    action: { label: "Invite Member", href: "/creator/team", icon: Plus },
    tips: ["Give collaborators the least access they need"],
  },
  emails: {
    icon: Mail,
    title: "No email campaigns yet",
    description: "Reach your community directly with email campaigns. Start with an announcement template.",
    action: { label: "Use Announcement Template", href: "/creator/marketing/emails?template=announcement", icon: Plus },
    tips: ["Use email for launches, reminders, and important updates"],
  },
  affiliates: {
    icon: launchIcons.audience,
    title: "No affiliates yet",
    description: "Let others promote your content and earn commissions. Set up your affiliate program.",
    action: { label: "Set Up Affiliates", href: "/creator/marketing/affiliates", icon: Plus },
    tips: ["Start with a small trusted partner list"],
  },
  messages: {
    icon: MessageSquare,
    title: "No messages yet",
    description: "Direct messages from your community will appear here.",
    tips: ["Respond promptly to build trust"],
  },
  integrations: {
    icon: launchIcons.protection,
    title: "No integrations connected",
    description: "Connect tools when you need automation, analytics, or external workflows.",
    action: { label: "Browse Integrations", href: "/creator/integrations", icon: ArrowRight },
    tips: ["Add integrations only when they remove repeated manual work"],
  },
  manualPayments: {
    icon: launchIcons.payout,
    title: "No manual payments yet",
    description: "Manual payment requests and offline confirmations will appear here.",
    action: { label: "Open Monetization", href: "/creator/monetization", icon: ArrowRight },
    tips: ["Use manual payment review for exceptional cases only"],
  },
  noResults: {
    icon: SearchX,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
    tips: ["Check spelling", "Try broader search terms"],
  },
  noPermission: {
    icon: ShieldAlert,
    title: "Access restricted",
    description: "You don’t have permission to view this section. Contact your community owner to request access.",
    tips: ["Your current role may not include access to this feature"],
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We couldn’t load this content. Please try again.",
  },
  noCommunity: {
    icon: Building,
    title: "No community selected",
    description: "Select or create a community to start managing your content.",
    action: { label: "Create Community", href: "/creator/communities/create", icon: Plus },
  },
} satisfies Record<string, CreatorEmptyStateDefinition>

export type CreatorEmptyStateModule = keyof typeof CREATOR_EMPTY_STATE_DEFINITION_MAP

export const CREATOR_EMPTY_STATE_DEFINITIONS: Record<CreatorEmptyStateModule, CreatorEmptyStateDefinition> = CREATOR_EMPTY_STATE_DEFINITION_MAP

export function getCreatorEmptyStateDefinition(module: CreatorEmptyStateModule): CreatorEmptyStateDefinition {
  return CREATOR_EMPTY_STATE_DEFINITIONS[module]
}
