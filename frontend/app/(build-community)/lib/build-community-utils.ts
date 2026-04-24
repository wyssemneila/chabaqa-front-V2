export interface CommunityFormData {
  name: string
  bio: string
  status: "public" | "private"
  joinFee: "free" | "paid"
  customFee: string
  socialLinks: {
    instagram: string
    twitter: string
    facebook: string
    youtube: string
    linkedin: string
  }
}

export interface CommunityValidationResult {
  isValid: boolean
  errors: {
    field: string
    message: string
  }[]
}

export function validateCommunityForm(data: CommunityFormData, currentStep: number): CommunityValidationResult {
  const errors: { field: string; message: string }[] = []

  switch (currentStep) {
    case 1:
      if (!data.name.trim()) {
        errors.push({ field: "name", message: "Community name is required" })
      }
      if (data.name.length > 100) {
        errors.push({ field: "name", message: "Community name must be less than 100 characters" })
      }
      if (data.bio.length > 500) {
        errors.push({ field: "bio", message: "Bio must be less than 500 characters" })
      }
      break

    case 2:
      if (!["public", "private"].includes(data.status)) {
        errors.push({ field: "status", message: "Please select a valid community status" })
      }
      if (!["free", "paid"].includes(data.joinFee)) {
        errors.push({ field: "joinFee", message: "Please select a valid join fee option" })
      }
      if (data.joinFee === "paid" && !data.customFee.trim()) {
        errors.push({ field: "customFee", message: "Custom fee is required for paid communities" })
      }
      if (data.joinFee === "paid" && data.customFee && !/^\$?\d+(\.\d{2})?$/.test(data.customFee)) {
        errors.push({ field: "customFee", message: "Please enter a valid amount (e.g., $10 or 10.00)" })
      }
      break

    case 3:
      // Validation optionnelle pour les liens sociaux
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      
      Object.entries(data.socialLinks).forEach(([platform, url]) => {
        if (url && !urlPattern.test(url) && !url.startsWith("@") && !url.includes(platform)) {
          errors.push({ 
            field: `socialLinks.${platform}`, 
            message: `Please enter a valid ${platform} URL or username` 
          })
        }
      })
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function formatSocialLink(platform: string, input: string): string {
  if (!input.trim()) return ""

  const baseUrls: Record<string, string> = {
    instagram: "https://instagram.com/",
    twitter: "https://twitter.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    linkedin: "https://linkedin.com/company/",
  }

  // Si c'est déjà une URL complète, la retourner telle quelle
  if (input.startsWith("http")) {
    return input
  }

  // Si ça commence par @, l'enlever
  const cleanInput = input.startsWith("@") ? input.slice(1) : input

  // Si c'est juste un nom d'utilisateur, construire l'URL complète
  if (baseUrls[platform]) {
    return baseUrls[platform] + cleanInput
  }

  return input
}

export const communityCategories = [
  { id: "tech", name: "Technology", icon: "💻" },
  { id: "art", name: "Art & Design", icon: "🎨" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "fitness", name: "Fitness & Health", icon: "💪" },
  { id: "cooking", name: "Cooking", icon: "👨‍🍳" },
  { id: "travel", name: "Travel", icon: "✈️" },
  { id: "books", name: "Books & Literature", icon: "📚" },
  { id: "gaming", name: "Gaming", icon: "🎮" },
  { id: "photography", name: "Photography", icon: "📸" },
  { id: "business", name: "Business & Startups", icon: "💼" },
] as const

export type CommunityCategory = typeof communityCategories[number]["id"]
