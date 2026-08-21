"use client"

import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CreatorAdvancedSectionProps {
  title: string
  description?: string
  status?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CreatorAdvancedSection({
  title,
  description,
  status = "Optional",
  defaultOpen = false,
  children,
}: CreatorAdvancedSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border bg-white">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <Badge variant="outline" className="rounded-md">{status}</Badge>
          </div>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform group-data-[state=open]:rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

