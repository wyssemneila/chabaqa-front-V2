"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ArrowLeft, Save } from "lucide-react"
import { useProductForm } from "./product-form-context"

export function ProductHeader() {
  const { isSaving, handleSave, formData } = useProductForm()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Manage Product</h1>
          <p className="text-muted-foreground mt-1">
            {formData.isPublished ? (
              <Badge className="bg-green-500 text-white">Published</Badge>
            ) : (
              <Badge variant="outline">Draft</Badge>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}