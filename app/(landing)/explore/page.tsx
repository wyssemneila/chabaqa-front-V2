import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ExploreClient from "./explore-page-client"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { generateAlternateLanguages } from "@/lib/seo-config"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.explore")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages("/explore"),
  }
}

export default function ExplorePage() {
  return (
    <div style={{ background: 'var(--bg)' }}>
      <Header />
      <main>
        <ExploreClient />
      </main>
      <Footer />
    </div>
  )
}
