import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { communitiesApi } from "@/lib/api"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "./components/checkout-form"
import { generateAlternateLanguages, generateKeywords, generateTwitterMetadata, noIndexRobots } from "@/lib/seo-config"

interface CheckoutPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    inviteCode?: string
  }>
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params
  const communityName = slug
    ? slug
        .replace(/[-_]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Community"
  const title = `Checkout - ${communityName}`
  const description = `Complete your checkout to join ${communityName} on Chabaqa and access premium community content.`

  return {
    title,
    description,
    keywords: generateKeywords(["community checkout", "join community", `${communityName} checkout`]),
    alternates: generateAlternateLanguages(`/community/${encodeURIComponent(slug)}/checkout`),
    robots: noIndexRobots,
    twitter: generateTwitterMetadata(title, description),
  }
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { slug } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const inviteCode =
    typeof resolvedSearchParams.inviteCode === "string" ? resolvedSearchParams.inviteCode.trim() : ""
  
  let community: any = null
  
  try {
    const response = await communitiesApi.getBySlug(slug)
    community = response.data
  } catch (error) {
    console.error("Failed to fetch community:", error)
    notFound()
  }

  if (!community) {
    notFound()
  }

  const rawCreator = (community as any)?.creator || (community as any)?.createur || null

  const communityData = {
    ...community,
    creator: rawCreator ? {
      id: String((rawCreator as any)?._id || rawCreator.id || ""),
      name: String((rawCreator as any)?.name || ""),
      avatar: (rawCreator as any)?.avatar ? String((rawCreator as any)?.avatar) : undefined,
      verified: Boolean((rawCreator as any)?.verified)
    } : null,
    id: String((community as any)?._id || community.id || ""),
    category: typeof (community as any).category === "string" 
      ? community.category 
      : String((community as any).category?.name || ""),
    tags: Array.isArray(community.tags) 
      ? community.tags.map((t: any) => typeof t === "string" ? t : String(t?.name || t?._id || "")) 
      : [],
    members: (community as any).members
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-16">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <CheckoutForm community={communityData} inviteCode={inviteCode || undefined} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
