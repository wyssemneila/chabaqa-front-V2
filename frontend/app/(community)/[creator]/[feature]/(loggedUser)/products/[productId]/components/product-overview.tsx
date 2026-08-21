import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductOverviewProps {
  product: any
}

export default function ProductOverview({ product }: ProductOverviewProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <CardTitle className="text-lg sm:text-xl">About This Product</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-5 sm:pb-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Product Description */}
          <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p className="mb-0">{product.description}</p>
          </div>

          {/* Key Features Section */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                Key Features
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {product.features.map((feature: string, index: number) => (
                  <li 
                    key={index} 
                    className="text-sm sm:text-base text-muted-foreground leading-relaxed flex items-start"
                  >
                    <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 shrink-0" />
                    <span className="flex-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How To Use Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
              How To Use
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-0">
              After purchase, you&apos;ll gain instant access to all files. Simply download them to your device and
              follow the included documentation to get started.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
