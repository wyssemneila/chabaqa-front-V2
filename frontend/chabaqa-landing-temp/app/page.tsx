import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { SuccessStories } from "@/components/success-stories"
import { CreatorTools } from "@/components/creator-tools"
import { HowItWorks } from "@/components/how-it-works"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { Resources } from "@/components/resources"
import { About } from "@/components/about"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <SuccessStories />
      <CreatorTools />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Resources />
      <About />
      <Footer />
    </main>
  )
}
