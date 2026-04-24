import { Suspense } from "react"
import ChallengeManager from "./components/ChallengeManager"

function ChallengeManagerLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default async function ManageChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>
}) {
  const { challengeId } = await params
  return (
    <Suspense fallback={<ChallengeManagerLoader />}>
      <ChallengeManager challengeId={challengeId} />
    </Suspense>
  )
}
