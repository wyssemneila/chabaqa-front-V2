"use client"

import Link from "next/link"
import {
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  Mail,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CREATOR_CREATE_TEMPLATES } from "@/lib/creator-content/templates"

const CREATE_ITEMS = [
  { label: "Course", href: "/creator/courses/new", icon: BookOpen },
  { label: "Challenge", href: "/creator/challenges/new", icon: Zap },
  { label: "Session", href: "/creator/sessions/new", icon: Calendar },
  { label: "Event", href: "/creator/events/new", icon: Star },
  { label: "Product", href: "/creator/products/new", icon: ShoppingBag },
  { label: "Post", href: "/creator/posts?create=1", icon: FileText },
  { label: "Email Campaign", href: "/creator/marketing/emails", icon: Mail },
]

const TEMPLATE_GROUPS = [
  { label: "Course templates", items: CREATOR_CREATE_TEMPLATES.course },
  { label: "Challenge templates", items: CREATOR_CREATE_TEMPLATES.challenge },
  { label: "Product templates", items: CREATOR_CREATE_TEMPLATES.product },
  { label: "Event templates", items: CREATOR_CREATE_TEMPLATES.event },
  { label: "Session templates", items: CREATOR_CREATE_TEMPLATES.session },
  { label: "Campaign templates", items: CREATOR_CREATE_TEMPLATES.campaign },
]

const DUPLICATE_SHORTCUTS = [
  { label: "Duplicate campaign", href: "/creator/marketing/emails", icon: FileText },
  { label: "Find course to copy", href: "/creator/courses", icon: BookOpen },
  { label: "Find challenge to copy", href: "/creator/challenges", icon: Zap },
  { label: "Find product to copy", href: "/creator/products", icon: ShoppingBag },
]

export function CreateContentMenu({
  disabled = false,
  disabledReason,
  recommendedHref,
  className,
}: {
  disabled?: boolean
  disabledReason?: string
  recommendedHref?: string
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled} className={cn(className)} title={disabled ? disabledReason || "Select a community first" : undefined}>
          <Plus className="h-4 w-4 mr-2" />
          Create
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{disabled ? (disabledReason || "Select a community first") : "Create content"}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/creator/ai/create">
            <Sparkles className="h-4 w-4" />
            Create with AI
            <span className="ml-auto text-[10px] text-primary">Cofounder</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {CREATE_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
                {recommendedHref === item.href && <span className="ml-auto text-[10px] text-primary">Recommended</span>}
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Start from template</DropdownMenuLabel>
        {TEMPLATE_GROUPS.map((group) => (
          <DropdownMenuSub key={group.label}>
            <DropdownMenuSubTrigger>{group.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              {group.items.map((template) => (
                <DropdownMenuItem key={template.href} asChild>
                  <Link href={template.href}>
                    <span className="flex min-w-0 flex-col">
                      <span>{template.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{template.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Repeat faster</DropdownMenuLabel>
        {DUPLICATE_SHORTCUTS.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
