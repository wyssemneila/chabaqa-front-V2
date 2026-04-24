import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { ShoppingBag, Plus } from "lucide-react"

export function EmptyProducts({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <EnhancedCard className="text-center py-12">
      <CardContent>
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-6">
          {hasSearchQuery ? "Try adjusting your search terms" : "Add your first product to get started"}
        </p>
        <Button asChild>
          <Link href="/creator/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </CardContent>
    </EnhancedCard>
  )
}