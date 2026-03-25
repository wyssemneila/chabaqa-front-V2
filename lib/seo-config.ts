/**
 * SEO Configuration for Chabaqa Platform
 * Centralized SEO settings including keywords, metadata, and structured data
 */

export const seoConfig = {
  // Base configuration
  siteName: "Chabaqa",
  siteUrl: "https://chabaqa.io",
  defaultTitle: "Chabaqa Official Site | All-in-One Community Platform for Creators",
  defaultDescription:
    "Official Chabaqa platform for creators to build and monetize communities with courses, challenges, coaching sessions, events, and digital products.",
  
  // Brand variations for search optimization
  brandVariations: [
    "Chabaqa",
    "Shabqa",
    "Chabka",
    "Shabka",
    "Chabqa",
    "شبكة" // Arabic
  ],
  
  // Core keywords - English
  coreKeywords: [
    "community platform",
    "creator platform",
    "online courses",
    "community building",
    "creator monetization",
    "coaching platform",
    "membership site",
    "course creation",
    "challenges platform",
    "virtual events",
    "creator economy",
    "digital products",
    "community management",
    "online learning platform",
    "creator tools"
  ],
  
  // Arabic transliteration keywords for SEO
  transliterationKeywords: [
    "chabaqa",
    "shabqa",
    "chabka",
    "shabka",
    "chabqa",
    "shabqa platform",
    "chabka community",
    "shabka online courses",
    "chabaqa tunisia",
    "shabqa tunisie"
  ],
  
  // Location-based keywords
  locationKeywords: [
    "community platform tunisia",
    "online courses tunisia",
    "creator platform mena",
    "arabic community platform",
    "tunisian startup",
    "north africa creator platform",
    "middle east community platform"
  ],
  
  // Long-tail keywords
  longTailKeywords: [
    "all in one community platform",
    "best platform for online courses",
    "how to monetize community",
    "create online community",
    "sell courses online",
    "coaching platform with calendar",
    "challenge platform creators",
    "membership site builder",
    "community engagement tools",
    "creator business platform",
    "build engaged community",
    "monetize creator business"
  ],
  
  // Social media handles
  social: {
    twitter: "@chabaqa",
    x: "https://twitter.com/chabaqa",
    facebook: "https://facebook.com/chabaqa",
    linkedin: "https://linkedin.com/company/chabaqa",
    instagram: "https://instagram.com/chabaqa",
  },
  
  // Contact information
  contact: {
    email: "contactchabaqa@gmail.com",
    supportEmail: "contactchabaqa@gmail.com"
  },
  
  // Geographic information
  geo: {
    region: "TN",
    placename: "Tunisia",
    position: "36.8065;10.1815",
    icbm: "36.8065, 10.1815"
  },
  
  // Language support
  languages: {
    default: "en",
    supported: ["en", "ar"],
    locales: {
      en: "en_US",
      ar: "ar_TN"
    }
  },
  
  // Open Graph default image
  ogImage: {
    url: "/og-image.jpg",
    width: 1200,
    height: 630,
    alt: "Chabaqa - Community Platform for Creators"
  },
  
  // Organization structured data
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chabaqa",
    alternateName: ["Shabqa", "Chabka", "Shabka", "شبقة"],
    url: "https://chabaqa.io",
    logo: {
      "@type": "ImageObject",
      url: "https://chabaqa.io/logo.png",
      width: 250,
      height: 60
    },
    description: "All-in-one community platform for creators to build, engage, and monetize their communities",
    foundingDate: "2023",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "TN",
        addressLocality: "Tunisia"
      }
    },
    sameAs: [
      "https://twitter.com/chabaqa",
      "https://facebook.com/chabaqa",
      "https://linkedin.com/company/chabaqa",
      "https://instagram.com/chabaqa"
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: "contactchabaqa@gmail.com",
        availableLanguage: ["English", "Arabic"]
      }
    ]
  }
}

/**
 * Generate comprehensive keywords array for a page
 */
export function generateKeywords(additionalKeywords: string[] = []): string[] {
  return [
    ...seoConfig.coreKeywords,
    ...seoConfig.transliterationKeywords,
    ...seoConfig.locationKeywords,
    ...additionalKeywords
  ]
}

/**
 * Generate Open Graph metadata
 */
export function generateOGMetadata(
  title: string,
  description: string,
  url: string,
  image?: { url: string; width: number; height: number; alt: string }
) {
  return {
    title,
    description,
    url,
    siteName: seoConfig.siteName,
    type: "website" as const,
    locale: seoConfig.languages.locales.en,
    alternateLocale: [seoConfig.languages.locales.ar],
    images: [image || seoConfig.ogImage]
  }
}

/**
 * Generate Twitter metadata
 */
export function generateTwitterMetadata(
  title: string,
  description: string,
  image?: string
) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [image || seoConfig.ogImage.url],
    creator: seoConfig.social.twitter,
    site: seoConfig.social.twitter
  }
}

/**
 * Generate alternate language links
 */
export function generateAlternateLanguages(path: string = "") {
  const baseUrl = seoConfig.siteUrl
  return {
    canonical: `${baseUrl}${path}`,
    languages: {
      'en': `${baseUrl}${path}`,
      'ar': `${baseUrl}/ar${path}`
    }
  }
}

/**
 * Generate robots metadata
 */
export function generateRobotsMetadata(index: boolean = true, follow: boolean = true) {
  return {
    index,
    follow,
    nocache: false,
    googleBot: {
      index,
      follow,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    }
  }
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.siteName,
    alternateName: seoConfig.brandVariations,
    url: seoConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    inLanguage: seoConfig.languages.supported
  }
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}
