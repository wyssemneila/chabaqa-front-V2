"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ListTodo, Lock } from "lucide-react"

interface TimelineTabProps {
  challengeTasks: any[]
  isUpcoming?: boolean
  setSelectedTaskDay: (day: number | null) => void
  sequentialProgressionEnabled?: boolean
  unlockMessage?: string
  submissionByTaskId: Record<string, any>
}

export default function TimelineTab({
  challengeTasks,
  isUpcoming = false,
  setSelectedTaskDay,
  sequentialProgressionEnabled = false,
  unlockMessage,
  submissionByTaskId,
}: TimelineTabProps) {
  if (challengeTasks.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Challenge Timeline</CardTitle>
          <CardDescription>Track your progress through all challenge days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <ListTodo className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No tasks available yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Tasks will appear here once the creator adds them</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Challenge Timeline</CardTitle>
        <CardDescription>
          {isUpcoming
            ? `Challenge preview: ${challengeTasks.length} upcoming tasks`
            : `Track your progress through all ${challengeTasks.length} tasks`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {challengeTasks.map((task, index) => {
            const isLocked = isUpcoming || (sequentialProgressionEnabled && task.isUnlocked === false)
            const hasSubmission = Boolean(submissionByTaskId[String(task.id)])
            const isPendingSubmission = hasSubmission && !task.isCompleted
            const isLast = index === challengeTasks.length - 1
            const connectorClass = task.isCompleted
              ? "bg-green-500"
              : isLocked
                ? "border-l-2 border-dashed border-amber-300 bg-transparent"
                : isPendingSubmission
                  ? "bg-blue-300"
                  : task.isActive
                    ? "bg-challenges-300"
                    : "bg-gray-200"

            return (
              <div key={task.id} className="relative flex items-start gap-4 pb-4 last:pb-0">
                <div className="relative flex w-10 shrink-0 justify-center">
                  {!isLast && (
                    <div
                      className={`absolute left-1/2 top-10 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2 ${connectorClass}`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`z-10 flex h-10 w-10 items-center justify-center rounded-full font-semibold shadow-sm ring-4 ring-white ${
                      isLocked
                        ? "bg-amber-400 text-white"
                        : task.isCompleted
                          ? "bg-green-500 text-white"
                          : task.isActive
                            ? "bg-challenges-500 text-white"
                            : isPendingSubmission
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {task.isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      task.day
                    )}
                  </div>
                </div>
                <div
                  className={`min-w-0 flex-1 rounded-lg border p-4 transition-colors ${
                    isLocked
                      ? "cursor-not-allowed border-amber-300 bg-amber-50"
                      : task.isCompleted
                        ? "border-green-500 bg-green-50"
                        : task.isActive
                          ? "border-challenges-500 bg-challenges-50"
                          : isPendingSubmission
                            ? "border-blue-300 bg-blue-50"
                            : "cursor-pointer border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    if (!isLocked && !isUpcoming) setSelectedTaskDay(task.day)
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      Day {task.day}: {task.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {task.isCompleted && <Badge className="bg-green-500">Completed</Badge>}
                      {isLocked && <Badge className="bg-amber-500">Locked</Badge>}
                      {!task.isCompleted && !isLocked && task.isActive && (
                        <Badge className="bg-challenges-500">Active</Badge>
                      )}
                      {!isUpcoming && isPendingSubmission && (
                        <Badge className="bg-blue-500">Submitted (Pending Review)</Badge>
                      )}
                      {!isUpcoming && <span className="text-sm text-muted-foreground">{task.points || 0} pts</span>}
                    </div>
                  </div>
                  {!isUpcoming && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
                  {isLocked && (
                    <p className="mt-2 text-xs text-amber-700">
                      {isUpcoming
                        ? "Unlocks when the challenge starts."
                        : task.lockReason || unlockMessage || "Complete the previous task to unlock this one."}
                    </p>
                  )}
                  {!isUpcoming && task.deliverable && (
                    <p className="mt-2 text-sm font-medium">Deliverable: {task.deliverable}</p>
                  )}
                  {!isUpcoming && (
                    <div className="mt-2 flex items-center space-x-2">
                      {task.resources && task.resources.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {task.resources.length} resources
                        </Badge>
                      )}
                      {task.notes && (
                        <Badge variant="outline" className="text-xs">
                          Has notes
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
