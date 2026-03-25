"use client"

import { CreateCommunityForm } from "@/components/community/create-community-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CreateCommunityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <CreateCommunityForm 
            backUrl="/explore" 
            backLabel="Back to Explore"
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
