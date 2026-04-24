import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Check, AlertCircle } from "lucide-react"

interface ProductLicenseProps {
  product: any
}

export default function ProductLicense({ product }: ProductLicenseProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-lg sm:text-xl">License Terms</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
          Usage rights and restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-5 sm:pb-6">
        <div className="space-y-4 sm:space-y-6">
          {product.licenseTerms ? (
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p className="mb-0">{product.licenseTerms}</p>
            </div>
          ) : (
            <>
              {/* License Type */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Standard License
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-0">
                  This digital product is licensed for personal use only.
                </p>
              </div>

              {/* License Points */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-sm sm:text-base font-medium text-foreground mb-2 sm:mb-3">
                  What you can do:
                </h4>
                <ul className="space-y-2 sm:space-y-2.5">
                  <li className="text-sm sm:text-base text-muted-foreground leading-relaxed flex items-start gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                    </div>
                    <span className="flex-1">Use the product in your personal projects</span>
                  </li>
                  <li className="text-sm sm:text-base text-muted-foreground leading-relaxed flex items-start gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                    </div>
                    <span className="flex-1">Make modifications for personal use</span>
                  </li>
                </ul>
              </div>

              {/* Restrictions */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-sm sm:text-base font-medium text-foreground mb-2 sm:mb-3">
                  Restrictions:
                </h4>
                <ul className="space-y-2 sm:space-y-2.5">
                  <li className="text-sm sm:text-base text-muted-foreground leading-relaxed flex items-start gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                    </div>
                    <span className="flex-1">Redistribution or resale is prohibited</span>
                  </li>
                  <li className="text-sm sm:text-base text-muted-foreground leading-relaxed flex items-start gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                    </div>
                    <span className="flex-1">Commercial use requires additional license</span>
                  </li>
                </ul>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed mb-0 font-medium">
                  💡 Need commercial licensing? Contact the creator directly for business usage options.
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
