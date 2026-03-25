import { Skeleton } from "@/components/ui/skeleton"

export default function BuildCommunityLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Formulaire à gauche */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-1 w-12 mb-8" />
              
              {/* Steps skeleton */}
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    {step < 3 && <Skeleton className="w-12 h-1 mx-2 rounded-full" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content skeleton */}
            <div className="space-y-6 mb-8">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>

            {/* Navigation skeleton */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          {/* Grille de communautés à droite */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 11 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`border-0 ${
                  index === 1 ? "row-span-2 col-span-1 h-48" : "aspect-square"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
