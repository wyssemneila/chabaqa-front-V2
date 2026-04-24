import { CommunitiesCategoriesClient } from "@/components/communities/communities-categories-client"
import { Dumbbell, GraduationCap, Code, Briefcase, Palette, Heart } from "lucide-react"

const categoryIcons = {
  "Fitness & Health": Dumbbell,
  "Education & Learning": GraduationCap,
  Technology: Code,
  "Business & Entrepreneurship": Briefcase,
  "Creative Arts": Palette,
  "Personal Development": Heart,
}

interface Community {
  id: number
  category: string
}

interface CommunitiesCategoriesProps {
  communities: Community[]
}

export function CommunitiesCategories({ communities }: CommunitiesCategoriesProps) {
  // Count communities per category
  const categoryCounts = communities.reduce(
    (acc, community) => {
      acc[community.category] = (acc[community.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const categories = Object.entries(categoryCounts)
    .filter(([category]) => category !== "All")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) // Show only top 6 categories

  return (
    <section className="py-6 bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse by Interest</h3>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {categories.map(([category, count]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Heart
            return (
              <CommunitiesCategoriesClient key={category} category={category}>
                <div className="group cursor-pointer hover:scale-105 transition-all duration-200 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md border border-gray-200 hover:border-chabaqa-primary/30">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-chabaqa-primary" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-chabaqa-primary transition-colors">
                      {category.replace(" & ", " ")}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                </div>
              </CommunitiesCategoriesClient>
            )
          })}
        </div>
      </div>
    </section>
  )
}
