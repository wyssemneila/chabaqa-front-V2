"use client"

import React, { useMemo, useState } from "react"
import { Check, Copy, Link2, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export type AffiliateTargetType = "community" | "course" | "product" | "event" | "challenge" | "session"

export interface TargetOption {
  id: string
  label: string
  path: string
}

export interface PartnerOption {
  id: string
  label: string
}

export interface LinkBuilderSubmitPayload {
  partnerUserId?: string
  targetType: AffiliateTargetType
  targetId: string
  targetPath: string
}

export function AffiliateLinkBuilder({
  partners,
  targetsByType,
  onSubmit,
  createdCode,
  loading,
  baseUrl,
  copyToClipboard,
}: {
  partners: PartnerOption[]
  targetsByType: Record<AffiliateTargetType, TargetOption[]>
  onSubmit: (payload: LinkBuilderSubmitPayload) => Promise<void>
  createdCode?: string
  loading?: boolean
  baseUrl: string
  copyToClipboard?: (value: string) => Promise<void> | void
}) {
  const { toast } = useToast()
  const [partnerId, setPartnerId] = useState<string>("")
  const [targetType, setTargetType] = useState<AffiliateTargetType>("community")
  const [targetId, setTargetId] = useState<string>("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const targets = targetsByType[targetType] || []
  const selectedTarget = useMemo(() => targets.find((t) => t.id === targetId), [targetId, targets])
  const referralUrl = createdCode ? `${baseUrl.replace(/\/$/, "")}/r/${createdCode}` : ""

  const canCreate = Boolean(selectedTarget)

  const onCreate = async () => {
    if (!selectedTarget) return
    await onSubmit({
      partnerUserId: partnerId || undefined,
      targetType,
      targetId: selectedTarget.id,
      targetPath: selectedTarget.path,
    })
  }

  const onCopy = async () => {
    if (!referralUrl) return
    if (copyToClipboard) {
      await copyToClipboard(referralUrl)
    } else {
      await navigator.clipboard.writeText(referralUrl)
    }
    setCopied(true)
    toast({ title: "Link copied", description: "Affiliate link copied to clipboard." })
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Link Builder</CardTitle>
        <CardDescription>Create a deep link and copy it in one click.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select
              value={partnerId || "__none"}
              onValueChange={(value) => setPartnerId(value === "__none" ? "" : value)}
            >
              <SelectTrigger aria-label="Partner">
                <SelectValue placeholder="Select partner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No partner override</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>{partner.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target type</Label>
            <Select value={targetType} onValueChange={(value) => {
              setTargetType(value as AffiliateTargetType)
              setTargetId("")
            }}>
              <SelectTrigger aria-label="Target type">
                <SelectValue placeholder="Select target type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
                <SelectItem value="session">Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target item</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" aria-label="Target item">
                  <Link2 className="mr-2 h-4 w-4" />
                  {selectedTarget?.label || "Pick a target"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[360px]" align="start">
                <Command>
                  <CommandInput placeholder={`Search ${targetType}s...`} />
                  <CommandList>
                    <CommandEmpty>No target found.</CommandEmpty>
                    <CommandGroup>
                      {targets.map((target) => (
                        <CommandItem
                          key={target.id}
                          value={`${target.label} ${target.path}`}
                          onSelect={() => {
                            setTargetId(target.id)
                            setPickerOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", target.id === targetId ? "opacity-100" : "opacity-0")} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{target.label}</span>
                            <span className="text-xs text-muted-foreground truncate">{target.path}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onCreate} disabled={!canCreate || loading} aria-label="Generate link">
            {loading ? "Generating..." : "Generate link"}
          </Button>
        </div>

        {referralUrl ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Generated link</p>
              <Button variant="secondary" onClick={onCopy} aria-label="Copy affiliate link">
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-2 break-all text-xs text-muted-foreground">{referralUrl}</p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-md border bg-background p-3">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <QRCodeSVG value={referralUrl} size={96} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
