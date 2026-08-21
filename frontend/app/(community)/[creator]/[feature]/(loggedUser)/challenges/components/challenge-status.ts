export type ChallengeStatus = "upcoming" | "active" | "completed"

export function getChallengeStatus(challenge: {
  startDate?: string | Date
  endDate?: string | Date
}): ChallengeStatus {
  const now = Date.now()
  const startTime = new Date(challenge.startDate || 0).getTime()
  const endTime = new Date(challenge.endDate || 0).getTime()

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return "upcoming"
  }

  if (startTime > now) return "upcoming"
  if (endTime < now) return "completed"
  return "active"
}

