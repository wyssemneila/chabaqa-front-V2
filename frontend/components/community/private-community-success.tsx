"use client"

import { useRouter } from "next/navigation"
import { Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrivateCommunitySuccessProps {
  createdCommunity: {
    id: string
    slug: string
    name: string
    isPrivate: boolean
    inviteLink?: string
  }
  inviteCopied: boolean
  onCopyInviteLink: () => void
}

export function PrivateCommunitySuccess({
  createdCommunity,
  inviteCopied,
  onCopyInviteLink,
}: PrivateCommunitySuccessProps) {
  const router = useRouter()

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Private community created</h2>
        <p className="mt-2 text-gray-700">
          Share this invitation link to allow people to join <span className="font-semibold">{createdCommunity.name}</span>.
        </p>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invite link</p>
          <p className="mt-2 break-all text-sm text-gray-800">
            {createdCommunity.inviteLink || "Invite link is being prepared. You can generate it from your communities page."}
          </p>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            onClick={onCopyInviteLink}
            disabled={!createdCommunity.inviteLink}
            className="sm:w-auto"
          >
            <Copy className="w-4 h-4 mr-2" />
            {inviteCopied ? "Copied" : "Copy invite link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/community/${createdCommunity.slug}`)}
            disabled={!createdCommunity.slug}
            className="sm:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to community
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/creator/communities")}
            className="sm:w-auto"
          >
            Manage communities
          </Button>
        </div>
      </div>
    </div>
  )
}
