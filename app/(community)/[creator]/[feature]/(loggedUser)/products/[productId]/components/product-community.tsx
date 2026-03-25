"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Sparkles } from "lucide-react"

interface ProductCommunityProps {
  productTitle?: string
}

export default function ProductCommunity({ productTitle }: ProductCommunityProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          <CardTitle className="text-base sm:text-lg">Community</CardTitle>
        </div>
        <CardDescription className="mt-1 text-sm sm:mt-2 sm:text-base">
          Discussions and community activity for this product.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-5 sm:pb-6">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center sm:p-7">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground sm:text-base">
            Community discussion is coming soon
          </p>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Reviews are now available in the <span className="font-medium">Review</span> tab.
            {productTitle ? ` Live discussions for ${productTitle} will appear here.` : " Live discussions will appear here."}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Early access section
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
