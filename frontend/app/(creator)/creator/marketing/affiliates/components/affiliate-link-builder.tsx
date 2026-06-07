"use client"

import React, { useMemo, useState } from "react"
import { Check, Copy, Link2, QrCode, Sparkles, Tag } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
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
  subtitle?: string
}

export interface PartnerOption {
  id: string
  label: string
  email?: string
}

export interface UTMOption {
  label: string
  utmSource: string
  utmMedium: string
}

export interface LinkBuilderSubmitPayload {
  partnerUserId?: string
  targetType: AffiliateTargetType
  targetId: string
  targetPath: string
  label?: string
  campaignName?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  tags?: string[]
}

const fallbackPresets: UTMOption[] = [
  { label: "Partner newsletter", utmSource: "partner_newsletter", utmMedium: "email" },
  { label: "Instagram story", utmSource: "instagram", utmMedium: "social" },
  { label: "Community share", utmSource: "community", utmMedium: "referral" },
]

export function AffiliateLinkBuilder({
  partners,
  targetsByType,
  onSubmit,
  createdCode,
  loading,
  baseUrl,
  copyToClipboard,
  utmPresets,
}: {
  partners: PartnerOption[]
  targetsByType: Record<AffiliateTargetType, TargetOption[]>
  onSubmit: (payload: LinkBuilderSubmitPayload) => Promise<void>
  createdCode?: string
  loading?: boolean
  baseUrl: string
  copyToClipboard?: (value: string) => Promise<void> | void
  utmPresets?: UTMOption[]
}) {
  const { toast } = useToast()
  const [partnerId, setPartnerId] = useState<string>("")
  const [targetType, setTargetType] = useState<AffiliateTargetType>("community")
  const [targetId, setTargetId] = useState<string>("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkLabel, setLinkLabel] = useState("")
  const [campaignName, setCampaignName] = useState("affiliate_launch")
  const [utmSource, setUtmSource] = useState("partner_newsletter")
  const [utmMedium, setUtmMedium] = useState("email")
  const [utmContent, setUtmContent] = useState("")
  const [tags, setTags] = useState("")

  const presets = utmPresets?.length ? utmPresets : fallbackPresets
  const targets = targetsByType[targetType] || []
  const selectedTarget = useMemo(() => targets.find((t) => t.id === targetId), [targetId, targets])
  const referralUrl = createdCode ? `${baseUrl.replace(/\/$/, "")}/r/${createdCode}` : ""
  const canCreate = Boolean(selectedTarget)

  const onPresetChange = (value: string) => {
    const preset = presets.find((item) => `${item.utmSource}:${item.utmMedium}` === value)
    if (!preset) return
    setUtmSource(preset.utmSource)
    setUtmMedium(preset.utmMedium)
  }

  const onCreate = async () => {
    if (!selectedTarget) return
    await onSubmit({
      partnerUserId: partnerId || undefined,
      targetType,
      targetId: selectedTarget.id,
      targetPath: selectedTarget.path,
      label: linkLabel.trim() || selectedTarget.label,
      campaignName: campaignName.trim() || undefined,
      utmSource: utmSource.trim() || undefined,
      utmMedium: utmMedium.trim() || undefined,
      utmCampaign: campaignName.trim() || undefined,
      utmContent: utmContent.trim() || undefined,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
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
    <Card className="border-[var(--bd)] bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-chabaqa-primary/20 bg-chabaqa-primary/5 px-3 py-1 text-xs font-semibold text-chabaqa-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tracked link studio
            </div>
            <CardTitle className="text-base text-[var(--t1)]">Create affiliate link</CardTitle>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--t2)]">
              Generate a partner-ready deep link with campaign labels and UTM attribution already attached.
            </p>
          </div>
          {referralUrl ? (
            <Button variant="outline" onClick={onCopy} aria-label="Copy affiliate link">
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.35fr]">
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select
              value={partnerId || "__none"}
              onValueChange={(value) => setPartnerId(value === "__none" ? "" : value)}
            >
              <SelectTrigger aria-label="Partner">
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Creator self-link</SelectItem>
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
                <Button variant="outline" className="w-full justify-start overflow-hidden" aria-label="Target item">
                  <Link2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedTarget?.label || "Pick a target"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(420px,calc(100vw-2rem))] p-0" align="start">
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
                            if (!linkLabel) setLinkLabel(target.label)
                            setPickerOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", target.id === targetId ? "opacity-100" : "opacity-0")} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{target.label}</span>
                            <span className="truncate text-xs text-[var(--t3)]">{target.path}</span>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="affiliate-link-label">Label</Label>
            <Input
              id="affiliate-link-label"
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
              placeholder="Launch link for alumni"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-campaign">Campaign</Label>
            <Input
              id="affiliate-campaign"
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              placeholder="affiliate_launch"
            />
          </div>
          <div className="space-y-2">
            <Label>UTM preset</Label>
            <Select value={`${utmSource}:${utmMedium}`} onValueChange={onPresetChange}>
              <SelectTrigger aria-label="UTM preset">
                <SelectValue placeholder="Choose preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={`${preset.utmSource}:${preset.utmMedium}`} value={`${preset.utmSource}:${preset.utmMedium}`}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-tags">Tags</Label>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t3)]" />
              <Input
                id="affiliate-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="pl-9"
                placeholder="alumni, warm"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="affiliate-utm-source">UTM source</Label>
            <Input id="affiliate-utm-source" value={utmSource} onChange={(event) => setUtmSource(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-utm-medium">UTM medium</Label>
            <Input id="affiliate-utm-medium" value={utmMedium} onChange={(event) => setUtmMedium(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-utm-content">UTM content</Label>
            <Input
              id="affiliate-utm-content"
              value={utmContent}
              onChange={(event) => setUtmContent(event.target.value)}
              placeholder="story-frame-1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[var(--bd)] bg-[var(--bg)]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--t1)]">{selectedTarget?.label || "No target selected"}</p>
            <p className="truncate text-xs text-[var(--t2)]">
              {selectedTarget?.path || "Choose a destination to generate a tracked affiliate URL."}
            </p>
          </div>
          <Button onClick={onCreate} disabled={!canCreate || loading} aria-label="Generate link" className="bg-chabaqa-primary hover:bg-chabaqa-primary/90">
            {loading ? "Generating..." : "Generate link"}
          </Button>
        </div>

        {referralUrl ? (
          <div className="grid gap-4 rounded-lg border border-[var(--bd)] bg-white p-4 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--t1)]">Generated link</p>
              <p className="mt-2 break-all rounded-md border border-[var(--bd)] bg-[var(--p2)]/40 px-3 py-2 font-mono text-xs text-[var(--t2)]">
                {referralUrl}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-3 rounded-md border border-[var(--bd)] bg-white p-3">
              <QrCode className="h-4 w-4 text-chabaqa-primary" />
              <QRCodeSVG value={referralUrl} size={92} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
