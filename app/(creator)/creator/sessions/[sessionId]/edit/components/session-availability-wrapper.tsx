"use client"

import { SessionAvailability } from "./session-availability"

interface SessionAvailabilityWrapperProps {
  sessionId: string
  duration: number
}

export function SessionAvailabilityWrapper({ sessionId, duration }: SessionAvailabilityWrapperProps) {
  return <SessionAvailability sessionId={sessionId} duration={duration} />
}
