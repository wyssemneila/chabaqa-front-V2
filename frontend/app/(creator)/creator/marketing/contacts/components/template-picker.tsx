"use client"

import { cn } from "@/lib/utils"
import {
  Heart,
  Sparkles,
  Briefcase,
  Coffee,
  Rocket,
} from "lucide-react"
import {
  INVITATION_TEMPLATES,
  TONE_COLORS,
  TONE_LABELS,
  type InvitationTemplate,
} from "@/lib/invitation-templates"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  sparkles: Sparkles,
  briefcase: Briefcase,
  coffee: Coffee,
  rocket: Rocket,
}

interface TemplatePickerProps {
  selectedId: string | null
  onSelect: (template: InvitationTemplate) => void
  className?: string
}

export function TemplatePicker({
  selectedId,
  onSelect,
  className,
}: TemplatePickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Choose a template
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {INVITATION_TEMPLATES.map((tpl) => {
          const Icon = ICON_MAP[tpl.iconName] || Heart
          const isSelected = selectedId === tpl.id
          const toneColor = TONE_COLORS[tpl.tone]

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl)}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all duration-150 min-w-[140px] max-w-[160px] shrink-0",
                "hover:shadow-sm hover:border-purple-300",
                isSelected
                  ? "ring-2 ring-purple-500 border-purple-400 bg-purple-50/60"
                  : "border-border/60 bg-card",
              )}
            >
              <Icon className={cn("w-4 h-4", toneColor)} />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-tight truncate w-full">
                  {tpl.label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {tpl.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-block text-[10px] font-medium uppercase tracking-wider",
                  toneColor,
                )}
              >
                {TONE_LABELS[tpl.tone]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
