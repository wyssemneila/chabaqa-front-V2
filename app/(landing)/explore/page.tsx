import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ExploreClient from "./explore-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explore Communities, Courses & More | Chabaqa",
  description: "Discover communities, courses, challenges, and more — all built by creators in Tunisia and MENA.",
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
