import type { Community } from "@/lib/models";

export interface CommunitiesData {
  categories: string[];
  sortOptions: { value: string; label: string }[];
  communities: Community[];
}
export interface ExploreData {
  categories: string[];
  sortOptions: { value: string; label: string }[];
  communities: Explore[];
}
export const mockCredentials = {
  email: "creator@chabqa.com",
  password: "password123",
}


export const mockPosts = [
  {
    id: 1,
    communityId: 1,
    author: "Sarah Johnson",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "Just launched our new SEO masterclass! Who's excited to dive deep into keyword research strategies and advanced optimization techniques?",
    timestamp: "2 hours ago",
    likes: 45,
    comments: 12,
    views: 234,
    type: "announcement",
  },
  {
    id: 2,
    communityId: 1,
    author: "Mike Chen",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "Thanks to the strategies learned here, I increased my client's organic traffic by 150% in just 3 months! The community support has been incredible.",
    timestamp: "5 hours ago",
    likes: 78,
    comments: 23,
    views: 456,
    type: "success",
  },
  {
    id: 3,
    communityId: 2,
    author: "Emma Wilson",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "Just finished my latest UI design project! The feedback from this community has been invaluable in shaping my creative process.",
    timestamp: "1 day ago",
    likes: 92,
    comments: 18,
    views: 567,
    type: "showcase",
  },
  {
    id: 4,
    communityId: 2,
    author: "David Park",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "New design challenge is live! This week we're focusing on mobile-first design principles and accessibility standards.",
    timestamp: "2 days ago",
    likes: 67,
    comments: 31,
    views: 789,
    type: "challenge",
  },
  {
    id: 5,
    communityId: 3,
    author: "Alex Chen",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "Sharing a clean code review process that has improved our team's productivity by 40% while maintaining high quality standards.",
    timestamp: "3 hours ago",
    likes: 34,
    comments: 8,
    views: 123,
    type: "insight",
  },
  {
    id: 6,
    communityId: 3,
    author: "Lisa Zhang",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    content:
      "Minimalist approach to API design - less is more when it comes to developer experience and long-term maintainability.",
    timestamp: "1 day ago",
    likes: 56,
    comments: 14,
    views: 345,
    type: "tutorial",
  },
]

// communitiesData.ts
export type Explore = {
  id: string
  mongoId?: string
  type: "community" | "course" | "challenge" | "product" | "oneToOne" | "event"
  name: string
  slug: string
  creator: string
  creatorSlug?: string
  creatorAvatar: string
  description: string
  category: string
  members: number
  rating: number
  ratingCount?: number
  tags: string[]
  verified: boolean
  price: number
  priceType: "free" | "paid" | "monthly" | "yearly" | "hourly"
  image: string
  featured: boolean;
  link: string
  isMember?: boolean
  hasContentAccess?: boolean
  communityId?: string
  communityName?: string // Community name for non-community content types
  communitySlug?: string // Community slug for non-community content types
}

export const ExploreData: { 
  communities: Explore[]
  sortOptions: { value: string; label: string }[]
  categories: string[]
 } = {
  communities: [
  {
    id: "1",
    type: "community",
    name: "Email Marketing",
    slug: "email-marketing",
    description: "A community for professionals mastering email marketing strategies and campaigns.",
    category: "Marketing",
    image: "/banners-community/community-1-email-marketing.png",
    creator: "Mohamed Mostafa",
    creatorAvatar: "https://placehold.co/64x64?text=SJ",
    members: 5234,
    rating: 4.9,
    tags: ["Email", "Automation", "Campaigns"],
    price: 29,
    priceType: "monthly",
    verified: true,
    featured: true,
    link: "/communities/email-marketing"
  },
  {
    id: "2",
    type: "community",
    name: "Branding Community",
    slug: "branding-community",
    description: "A community for designers and marketers passionate about building strong brand identities.",
    category: "Design",
    image: "/banners-community/community-2-branding.png",
    creator: "Sarah Johnson",
    creatorAvatar: "https://placehold.co/64x64?text=SJ",
    members: 3456,
    rating: 4.8,
    tags: ["Branding", "Identity", "Strategy"],
    price: 0,
    priceType: "free",
    verified: true,
    featured: true,
    link: "/communities/branding-community"
  },
  {
    id: "3",
    type: "community",
    name: "Fitness Community",
    slug: "fitness-community",
    description: "A community for fitness enthusiasts to share workouts, nutrition tips, and motivation.",
    category: "Fitness",
    image: "/banners-community/community-3-fitness.png",
    creator: "Alex Chen",
    creatorAvatar: "https://placehold.co/64x64?text=AC",
    members: 2156,
    rating: 4.7,
    tags: ["Workout", "Health", "Motivation"],
    price: 15,
    priceType: "monthly",
    verified: true,
    featured: true,
    link: "/communities/fitness-community"
  },
  {
    id: "4",
    type: "community",
    name: "Website Vitrine",
    slug: "website-vitrine",
    description: "Design, SEO et conversion pour des sites vitrines simples et efficaces.",
    category: "Web Design",
    image: "/banners-community/community-4-dev.png",
    creator: "Soumaya Chen",
    creatorAvatar: "https://placehold.co/64x64?text=SC",
    members: 2156,
    rating: 4.7,
    tags: ["Showcase", "UX/UI", "SEO"],
    price: 15,
    priceType: "monthly",
    verified: true,
    featured: true,
    link: "/communities/website-vitrine"
  },

  // --- Courses ---
  {
    id: '5',
    type: "course",
    name: "Mastering React",
    slug: "mastering-react",
    description: "An in-depth React course covering hooks, state, and best practices.",
    category: "Development",
    image: "https://placehold.co/600x400?text=React+Course",
    creator: "Alice Johnson",
    creatorAvatar: "https://placehold.co/64x64?text=AJ",
    members: 340,
    rating: 4.7,
    tags: ["React", "Frontend", "JavaScript"],
    price: 99,
    priceType: "paid",
    verified: true,
    featured: false,
    link: "/courses/mastering-react"
  },
  {
    id: '6',
    type: "course",
    name: "UI/UX Essentials",
    slug: "uiux-essentials",
    description: "Learn the principles of modern UI and UX design with Figma.",
    category: "Design",
    image: "https://placehold.co/600x400?text=UIUX+Course",
    creator: "Mohamed Ali",
    creatorAvatar: "https://placehold.co/64x64?text=MA",
    members: 220,
    rating: 4.5,
    tags: ["UI", "UX", "Figma"],
    price: 59,
    priceType: "paid",
    verified: false,
    featured: false,
    link: "/courses/uiux-essentials"
  },

  // --- Challenges ---
  {
    id: '7',
    type: "challenge",
    name: "30 Days of JavaScript",
    slug: "30days-js",
    description: "Daily coding exercises to sharpen your JavaScript skills.",
    category: "Programming",
    image: "https://placehold.co/600x400?text=JS+Challenge",
    creator: "Sara Lee",
    creatorAvatar: "https://placehold.co/64x64?text=SL",
    members: 500,
    rating: 4.2,
    tags: ["JavaScript", "Frontend", "Coding"],
    price: 0,
    priceType: "free",
    verified: true,
    featured: false,
    link: "/challenges/30days-js"
  },
  {
    id: '8',
    type: "challenge",
    name: "UI Daily Challenge",
    slug: "ui-daily-challenge",
    description: "Design one UI element every day to boost your creativity.",
    category: "Design",
    image: "https://placehold.co/600x400?text=UI+Challenge",
    creator: "David Kim",
    creatorAvatar: "https://placehold.co/64x64?text=DK",
    members: 280,
    rating: 4.4,
    tags: ["UI", "Design", "Practice"],
    price: 0,
    priceType: "free",
    verified: false,
    featured: false,
    link: "/challenges/30days-js"

  },

  // --- Products ---
  {
    id: '9',
    type: "product",
    name: "IoT Smart Kit",
    slug: "iot-smart-kit",
    description: "A complete kit to build IoT prototypes with sensors and modules.",
    category: "Hardware",
    image: "https://placehold.co/600x400?text=IoT+Kit",
    creator: "TechStore",
    creatorAvatar: "https://placehold.co/64x64?text=TS",
    members: 0,
    rating: 4.9,
    tags: ["IoT", "Electronics", "Prototyping"],
    price: 199,
    priceType: "paid",
    verified: true,
    featured: false,
    link: "/challenges/30days-js"

  },
  {
    id: '10',
    type: "product",
    name: "UI Components Pack",
    slug: "ui-components-pack",
    description: "A premium set of reusable UI components for modern web apps.",
    category: "Design",
    image: "https://placehold.co/600x400?text=UI+Pack",
    creator: "DesignHub",
    creatorAvatar: "https://placehold.co/64x64?text=DH",
    members: 0,
    rating: 4.6,
    tags: ["UI", "Components", "Design"],
    price: 49,
    priceType: "paid",
    verified: true,
    featured: false,
    link: "/challenges/30days-js"

  },

  // --- One-to-One ---
  {
    id: '11',
    type: "oneToOne",
    name: "React Mentorship",
    slug: "react-mentorship",
    description: "1:1 mentorship sessions to help you become a React pro.",
    category: "Mentorship",
    image: "https://placehold.co/600x400?text=Mentorship",
    creator: "Mentor John",
    creatorAvatar: "https://placehold.co/64x64?text=MJ",
    members: 25,
    rating: 5.0,
    tags: ["React", "Mentorship", "Career"],
    price: 50,
    priceType: "hourly",
    verified: true,
    featured: false,
    link: "/challenges/30days-js"

  },
  {
    id: '12',
    type: "oneToOne",
    name: "UI Portfolio Review",
    slug: "ui-portfolio-review",
    description: "Get personalized feedback on your UI/UX portfolio.",
    category: "Design",
    image: "https://placehold.co/600x400?text=Portfolio+Review",
    creator: "Designer Lina",
    creatorAvatar: "https://placehold.co/64x64?text=DL",
    members: 15,
    rating: 4.8,
    tags: ["UI", "UX", "Review"],
    price: 30,
    priceType: "hourly",
    verified: false,
    featured: false,
    link: "/challenges/30days-js"

  },
  ],
  categories: [
    "All",
    "Fitness & Health",
    "Education & Learning",
    "Technology",
    "Business & Entrepreneurship",
    "Creative Arts",
    "Personal Development",
    "Cooking & Food",
    "Travel & Adventure",
    "Music & Entertainment",
  ],
  sortOptions: [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "members", label: "Most Members" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ],

}
export const communitiesData: CommunitiesData = {
  categories: [
    "All",
    "Fitness & Health",
    "Education & Learning",
    "Technology",
    "Business & Entrepreneurship",
    "Creative Arts",
    "Personal Development",
    "Cooking & Food",
    "Travel & Adventure",
    "Music & Entertainment",
  ],
  sortOptions: [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "members", label: "Most Members" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ],
  communities: [
  {
    id: "1",
    slug: "email-marketing",
    name: "Email Marketing",
    creator: "Mohamed Mostafa",
    creatorId: "1",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    description:
      "Master email marketing strategies to grow your audience and boost conversions. Join 5,000+ professionals optimizing their campaigns.",
    longDescription:
      "Welcome to the Email Marketing community, where digital professionals learn to craft high-converting campaigns. Our group provides exclusive courses, live workshops, ready-to-use templates, and direct guidance from email marketing experts. Whether you’re building funnels, automating campaigns, or scaling newsletters, you’ll find tools and peers here to help you succeed.",
    category: "Marketing",
    members: 5234,
    rating: 4.9,
    price: 29,
    priceType: "monthly",
    image: "/banners-community/community-1-email-marketing.png?height=400&width=600",
    coverImage: "/banners-community/community-1-email-marketing.png?height=300&width=800",
    tags: ["Email", "Automation", "Segmentation", "Deliverability", "A/B Testing", "Campaigns"],
    featured: true,
    verified: true,
    createdDate: "2024-01-15",
    updatedDate: "2024-03-01",
    settings: {
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      welcomeMessage: "Welcome to our professional email marketing community!",
      features: [
        "Live Workshops",
        "1-on-1 Mentoring",
        "Resource Library",
        "Private Discord",
        "Weekly Webinars",
        "Expert Q&A"
      ],
      benefits: [
        "Weekly live training sessions focused on email strategies",
        "Access to exclusive email templates and automation tools",
        "Direct feedback on your campaigns and funnels",
        "Networking with 5000+ professional marketers",
        "Monthly case study reviews and best practices",
        "Priority support and consultation opportunities"
      ],
      template: "modern",
      fontFamily: "inter",
      borderRadius: 12,
      backgroundStyle: "gradient",
      heroLayout: "centered",
      showStats: true,
      showFeatures: true,
      showTestimonials: true,
      showPosts: true,
      showFAQ: true,
      enableAnimations: true,
      enableParallax: false,
      logo: "/placeholder.svg?height=80&width=80",
      heroBackground: "/placeholder.svg?height=600&width=1200",
      gallery: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400"
      ],
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      socialLinks: {
        twitter: "https://twitter.com/community",
        instagram: "https://instagram.com/community",
        linkedin: "https://linkedin.com/company/community",
        discord: "https://discord.gg/community"
      },
      customSections: [
        {
          id: 1,
          type: "text",
          title: "About Our Community",
          content:
            "We’re a passionate group of email marketers dedicated to sharing proven strategies and growing together.",
          visible: true
        }
      ],
      metaTitle: "Email Marketing - Learn Campaign Strategies from Experts",
      metaDescription:
        "Join 5,000+ professionals mastering email marketing. Access exclusive courses, live workshops, templates, and expert guidance to boost conversions."
    },
    stats: {
      totalRevenue: 152460,
      monthlyGrowth: 12.5,
      engagementRate: 78,
      retentionRate: 89
    }
  },
  {
    id: "2",
    slug: "branding-community",
    name: "Branding Community",
    creator: "Sarah Johnson",
    creatorId: "1",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    description: "A dynamic community for brand strategists, designers, and marketers to craft impactful brands.",
    longDescription:
      "Welcome to the Branding Community, the go-to hub for professionals passionate about building and evolving strong brands. Whether you are a designer, strategist, or marketer, this space empowers you to collaborate, share your expertise, and refine your craft. Engage in brand workshops, participate in creative challenges, showcase case studies, and access resources to strengthen your portfolio. Our members include professionals from diverse industries who come together to exchange ideas, stay inspired, and elevate the art of branding.",
    category: "Design",
    members: 3456,
    rating: 4.8,
    price: 0,
    priceType: "free",
    image: "/banners-community/community-2-branding.png?height=400&width=600",
    coverImage: "/banners-community/community-2-branding.png?height=300&width=800",
    tags: ["Branding", "Identity", "UI/UX", "Marketing", "Typography", "Strategy"],
    featured: true,
    verified: true,
    createdDate: "2024-02-01",
    settings: {
      primaryColor: "#ec4899",
      secondaryColor: "#8b5cf6",
      welcomeMessage: "Welcome to the branding hub where creativity meets strategy!",
      features: [
        "Brand Strategy Workshops",
        "Portfolio Reviews",
        "Resource Sharing",
        "Collaboration Board",
        "Creative Masterclasses",
        "Inspiration Gallery"
      ],
      benefits: [
        "Weekly branding challenges with real-world case studies",
        "Portfolio feedback from experienced brand consultants",
        "Access to premium identity and design resources",
        "Opportunities to collaborate with industry peers",
        "Monthly workshops with top branding experts",
        "Showcase your work to agencies and clients"
      ],
      template: "creative",
      fontFamily: "poppins",
      borderRadius: 16,
      backgroundStyle: "pattern",
      heroLayout: "split",
      showStats: true,
      showFeatures: true,
      showTestimonials: false,
      showPosts: true,
      showFAQ: true,
      enableAnimations: true,
      enableParallax: true,
      logo: "/placeholder.svg?height=80&width=80",
      heroBackground: "/placeholder.svg?height=600&width=1200",
      gallery: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400"
      ],
      socialLinks: {
        instagram: "https://instagram.com/brandingcommunity",
        behance: "https://behance.net/brandinghub",
        linkedin: "https://linkedin.com/company/brandingcommunity"
      },
      customSections: [
        {
          id: 1,
          type: "text",
          title: "About Our Branding Community",
          content:
            "We bring together designers, marketers, and strategists to create impactful brands, share ideas, and inspire the next generation of branding professionals.",
          visible: true
        }
      ],
      metaTitle: "Branding Community - Build, Share, and Elevate Your Brand Identity",
      metaDescription:
        "Join thousands of professionals in the Branding Community. Access workshops, feedback sessions, and resources to master the art of brand identity and strategy."
    },
    stats: {
      totalRevenue: 0,
      monthlyGrowth: 9.1,
      engagementRate: 87,
      retentionRate: 93
    }
  },
  {
    id: "3",
    slug: "fitness-community",
    name: "Fitness Community",
    creator: "Alex Chen",
    creatorId: "2",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    description: "A supportive community for fitness enthusiasts focused on health, training, and motivation.",
    longDescription:
      "Welcome to the Fitness Community — a space for athletes, trainers, and everyday fitness lovers to grow stronger together. Here, we believe in the power of discipline, motivation, and shared goals. Join workout challenges, share nutrition tips, get support from trainers, and celebrate progress with like-minded people. Whether you’re into strength training, cardio, yoga, or overall wellness, our community offers the resources and inspiration to help you achieve your fitness journey.",
    category: "Fitness",
    members: 2156,
    rating: 4.7,
    price: 15,
    priceType: "monthly",
    image: "/banners-community/community-3-fitness.png?height=400&width=600",
    coverImage: "/banners-community/community-3-fitness.png?height=300&width=800",
    tags: ["Workout", "Nutrition", "Health", "Motivation", "Wellness"],
    featured: true,
    verified: true,
    createdDate: "2024-03-01",
    settings: {
      primaryColor: "#16a34a",
      secondaryColor: "#065f46",
      welcomeMessage: "Welcome to your daily source of fitness motivation and progress!",
      features: [
        "Workout Challenges",
        "Nutrition Guides",
        "Expert Coaching",
        "Progress Tracking",
        "Wellness Resources",
        "Motivational Talks"
      ],
      benefits: [
        "Daily workout plans and challenges",
        "Access to certified fitness trainers",
        "Nutrition and meal prep guides",
        "Community support and motivation",
        "Progress tracking tools and resources",
        "Exclusive wellness events and masterclasses"
      ],
      template: "active",
      fontFamily: "inter",
      borderRadius: 12,
      backgroundStyle: "gradient",
      heroLayout: "centered",
      showStats: true,
      showFeatures: true,
      showTestimonials: true,
      showPosts: true,
      showFAQ: true,
      enableAnimations: true,
      enableParallax: false,
      logo: "/placeholder.svg?height=80&width=80",
      heroBackground: "/placeholder.svg?height=600&width=1200",
      gallery: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400"
      ],
      socialLinks: {
        instagram: "https://instagram.com/fitnesscommunity",
        youtube: "https://youtube.com/fitnesscommunity",
        linkedin: "https://linkedin.com/company/fitnesscommunity"
      },
      customSections: [
        {
          id: 1,
          type: "text",
          title: "About Our Fitness Community",
          content:
            "We are a passionate group of fitness lovers dedicated to health, strength, and motivation. Together, we share workouts, nutrition tips, and success stories to keep each other moving forward.",
          visible: true
        }
      ],
      metaTitle: "Fitness Community - Training, Nutrition, and Motivation",
      metaDescription:
        "Join the Fitness Community to access workout plans, nutrition guides, coaching, and motivation. Connect with athletes, trainers, and enthusiasts on the same journey."
    },
    stats: {
      totalRevenue: 32340,
      monthlyGrowth: 7.5,
      engagementRate: 89,
      retentionRate: 91
    }
  },
  {
    id: "4",
    slug: "website-vitrine",
    name: "Website Vitrine",
    creator: "Soumaya Chen",
    creatorId: "2",
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    description: "A community for entrepreneurs and creators building elegant showcase websites that convert.",
    longDescription:
      "Welcome to Website Vitrine — a focused community for SMEs, creators, and agencies who want simple, elegant, and high-performing showcase websites. Share best practices in UX, copywriting, SEO, and no-code stacks; get feedback on your pages; and learn how to turn visitors into leads with clean design and clear offers. Whether you use WordPress, Next.js, or no-code builders, you’ll find frameworks, templates, and peers to help you ship faster and better.",
    category: "Web Design",
    members: 2156,
    rating: 4.7,
    price: 15,
    priceType: "monthly",
    image: "/banners-community/community-4-dev.png?height=400&width=600",
    coverImage: "/banners-community/community-4-dev.png?height=300&width=800",
    tags: ["Showcase", "UX/UI", "SEO", "No-Code", "Conversion"],
    featured: true,
    verified: true,
    createdDate: "2024-03-01",
    settings: {
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      welcomeMessage: "Bienvenue ! Ici, on conçoit des sites vitrines beaux, rapides et qui convertissent.",
      features: [
        "Page & Landing Reviews",
        "Design & Copy Clinics",
        "Templates & Components",
        "Tech Stack Guides (WP/Next/No-Code)",
        "SEO & Performance Checks",
        "Conversion Teardowns"
      ],
      benefits: [
        "Feedback concret sur vos pages (hero, offres, CTA)",
        "Ressources prêtes à l’emploi : sections, wireframes, checklists",
        "Guides SEO basiques pour site vitrine (schema, meta, vitesse)",
        "Mentorat pair-à-pair pour monter en compétence rapidement",
        "Curation d’outils no-code/low-code pour aller plus vite",
        "Accès à des études de cas réelles orientées résultats"
      ],
      template: "minimal",
      fontFamily: "inter",
      borderRadius: 8,
      backgroundStyle: "solid",
      heroLayout: "centered",
      showStats: true,
      showFeatures: true,
      showTestimonials: true,
      showPosts: true,
      showFAQ: true,
      enableAnimations: false,
      enableParallax: false,
      logo: "/placeholder.svg?height=80&width=80",
      heroBackground: "/placeholder.svg?height=600&width=1200",
      gallery: [],
      socialLinks: {
        github: "https://github.com/techcommunity",
        linkedin: "https://linkedin.com/company/techcommunity"
      },
      customSections: [],
      metaTitle: "Website Vitrine – Design, SEO & Conversion pour sites vitrines",
      metaDescription:
        "La communauté pour créer des sites vitrines élégants et performants. Feedback UX, templates, SEO, et conseils conversion. Rejoignez 2,000+ membres."
    },
    stats: {
      totalRevenue: 32340,
      monthlyGrowth: 5.2,
      engagementRate: 92,
      retentionRate: 95
    }
  }

]}


export default { communitiesData, ExploreData };
