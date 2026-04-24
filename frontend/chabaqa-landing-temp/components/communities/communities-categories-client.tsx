"use client"

import type React from "react"

interface CommunitiesCategoriesClientProps {
  category: string
  children: React.ReactNode
}

export function CommunitiesCategoriesClient({ category, children }: CommunitiesCategoriesClientProps) {
  const handleCategoryClick = () => {
    // Scroll to search section and trigger category filter
    const searchSection = document.getElementById("communities-search")
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" })

      // Trigger category selection after scroll
      setTimeout(() => {
        const categorySelect = document.querySelector("select[value]") as HTMLSelectElement
        if (categorySelect) {
          categorySelect.value = category
          categorySelect.dispatchEvent(new Event("change", { bubbles: true }))
        }
      }, 500)
    }
  }

  return <div onClick={handleCategoryClick}>{children}</div>
}
