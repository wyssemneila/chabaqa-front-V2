import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Calendar, Package, RefreshCw, Tag } from "lucide-react"

interface ProductDetailsProps {
  product: any
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const fileTypes = [...new Set(product.files?.map((f: any) => f.type) || [])] as string[]
  
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Product Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 pb-5 sm:space-y-4 sm:pb-6">
        {/* Category */}
        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Category:</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-right xs:text-right">
            {product.category}
          </span>
        </div>

        {/* File Types */}
        <div className="flex flex-col xs:flex-row xs:justify-between gap-2 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground xs:shrink-0">
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>File Types:</span>
          </div>
          <div className="flex flex-wrap gap-1 xs:justify-end">
            {fileTypes.length > 0 ? (
              fileTypes.map((type, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="h-5 border-slate-300 bg-slate-50 px-2 py-0.5 text-xs"
                >
                  {type.toUpperCase()}
                </Badge>
              ))
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground italic">
                No files
              </span>
            )}
          </div>
        </div>

        {/* Published Date */}
        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Published:</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-right xs:text-right">
            {new Date(product.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        {/* Version */}
        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Version:</span>
          </div>
          <span className="text-xs sm:text-sm font-medium font-mono bg-gray-100 px-2 py-0.5 rounded text-right xs:text-right">
            {product.version || "1.0.0"}
          </span>
        </div>

        {/* Updates */}
        <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Updates:</span>
          </div>
          <div className="text-right xs:text-right">
            <span className="text-xs sm:text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              ✓ Free lifetime updates
            </span>
          </div>
        </div>

        {/* Additional Stats */}
        {(product.downloadCount || product.sales) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-col xs:flex-row gap-3 xs:gap-6">
              {product.downloadCount && (
                <div className="text-center xs:text-left">
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    {product.downloadCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Downloads</div>
                </div>
              )}
              {product.sales && (
                <div className="text-center xs:text-left">
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    {product.sales.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
