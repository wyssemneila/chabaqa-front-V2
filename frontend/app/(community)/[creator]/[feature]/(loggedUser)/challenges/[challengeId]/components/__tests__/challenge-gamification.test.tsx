import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import LeaderboardTab from "../LeaderboardTab"
import TimelineTab from "../TimelineTab"

jest.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getUserInfo: jest.fn(() => ({ id: "user-12" })),
  },
}))

jest.mock("@/lib/hooks/useUser", () => ({
  resolveImageUrl: (url?: string) => url,
}))

jest.mock("@/lib/profile-handle", () => ({
  getUserProfileHref: ({ username, name }: { username?: string; name: string }) =>
    `/profile/${username || name.toLowerCase().replace(/\s+/g, "-")}`,
}))

function makeParticipants(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const rank = index + 1
    return {
      id: `participant-${rank}`,
      userId: `user-${rank}`,
      username: `user${rank}`,
      name: `User ${rank}`,
      avatar: `/avatar-${rank}.png`,
      score: 1000 - index * 10,
      completedTasks: Array.from({ length: Math.max(0, 8 - index) }),
      streak: rank % 2 === 0 ? 3 : 0,
    }
  })
}

describe("challenge leaderboard gamification", () => {
  it("keeps the empty leaderboard state", () => {
    render(<LeaderboardTab challenge={{ participants: [] }} />)

    expect(screen.getByText("No participants yet")).toBeInTheDocument()
    expect(screen.getByText("Be the first to join this challenge!")).toBeInTheDocument()
  })

  it("renders top-three podium data and ranks four through ten below it", () => {
    render(<LeaderboardTab challenge={{ participants: makeParticipants(10) }} />)

    expect(screen.getByText("1st")).toBeInTheDocument()
    expect(screen.getByText("2nd")).toBeInTheDocument()
    expect(screen.getByText("3rd")).toBeInTheDocument()
    expect(screen.getByText("User 1")).toBeInTheDocument()
    expect(screen.getByText("User 2")).toBeInTheDocument()
    expect(screen.getByText("User 3")).toBeInTheDocument()
    expect(screen.getByText("970 points • 5 tasks completed")).toBeInTheDocument()
  })

  it("appends the current user outside the top ten once", async () => {
    render(<LeaderboardTab challenge={{ participants: makeParticipants(12) }} />)

    await waitFor(() => expect(screen.getByText("Your position")).toBeInTheDocument())
    expect(screen.getAllByText("User 12")).toHaveLength(1)
    expect(screen.getByText("890 points • 0 tasks completed")).toBeInTheDocument()
  })
})

describe("challenge timeline gamification", () => {
  const tasks = [
    { id: "done", day: 1, title: "Done", description: "Completed task", points: 10, isCompleted: true },
    { id: "active", day: 2, title: "Active", description: "Active task", points: 20, isActive: true },
    { id: "pending", day: 3, title: "Pending", description: "Pending task", points: 30 },
    { id: "locked", day: 4, title: "Locked", description: "Locked task", points: 40, isUnlocked: false },
  ]

  it("renders completed, active, pending, and locked states", () => {
    render(
      <TimelineTab
        challengeTasks={tasks}
        sequentialProgressionEnabled
        setSelectedTaskDay={jest.fn()}
        submissionByTaskId={{ pending: { id: "submission-1" } }}
      />,
    )

    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Submitted (Pending Review)")).toBeInTheDocument()
    expect(screen.getByText("Locked")).toBeInTheDocument()
    expect(screen.getByText("Complete the previous task to unlock this one.")).toBeInTheDocument()
  })

  it("selects only unlocked task cards", () => {
    const setSelectedTaskDay = jest.fn()
    render(
      <TimelineTab
        challengeTasks={tasks}
        sequentialProgressionEnabled
        setSelectedTaskDay={setSelectedTaskDay}
        submissionByTaskId={{ pending: { id: "submission-1" } }}
      />,
    )

    fireEvent.click(screen.getByText("Day 2: Active"))
    fireEvent.click(screen.getByText("Day 4: Locked"))

    expect(setSelectedTaskDay).toHaveBeenCalledTimes(1)
    expect(setSelectedTaskDay).toHaveBeenCalledWith(2)
  })
})
