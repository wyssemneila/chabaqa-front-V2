"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { ProductDetailsTab } from "./product-details-tab"
import { ProductFilesTab } from "./product-files-tab"
import { ProductPricingTab } from "./product-pricing-tab"
import { ProductPreviewTab } from "./product-preview-tab"

export function ProductTabs() {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        <ProductDetailsTab />
      </TabsContent>

      <TabsContent value="files" className="mt-6">
        <ProductFilesTab />
      </TabsContent>

      <TabsContent value="pricing" className="mt-6">
        <ProductPricingTab />
      </TabsContent>

      <TabsContent value="preview" className="mt-6">
        <ProductPreviewTab />
      </TabsContent>
    </Tabs>
  )
}