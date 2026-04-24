"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  Play,
  ArrowRight,
  Users,
  Lock,
  Globe,
  Coins,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Check,
  Globe2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateCommunityForm } from "@/components/community/create-community-form"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreateCommunityPage() {
  const router = useRouter()
  const { refreshCommunities, setSelectedCommunityId } = useCreatorCommunity()

  const handleSuccess = async (communityId: string) => {
    await refreshCommunities()
    setSelectedCommunityId(communityId)
    router.push('/creator/dashboard')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <CreateCommunityForm 
        onSuccess={handleSuccess}
        backUrl="/creator/dashboard"
        backLabel="Back to Dashboard"
      />
    </div>
  )
}