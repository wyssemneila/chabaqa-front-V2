"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tasks will appear here once the creator adds them</p>
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
        <div className="space-y-4">
          {challengeTasks.map((task) => (
            (() => {
              const isLocked = isUpcoming || (sequentialProgressionEnabled && task.isUnlocked === false)
              const hasSubmission = Boolean(submissionByTaskId[String(task.id)])
              const isPendingSubmission = hasSubmission && !task.isCompleted
              return (
            <div
              key={task.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                isLocked
                  ? "border-amber-300 bg-amber-50 cursor-not-allowed"
                  : task.isCompleted
                    ? "border-green-500 bg-green-50"
                    : task.isActive
                  ? "border-challenges-500 bg-challenges-50"
                  : isPendingSubmission
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => {
                if (!isLocked && !isUpcoming) setSelectedTaskDay(task.day)
              }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
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
                {task.isCompleted ? <CheckCircle className="h-5 w-5" /> : isLocked ? <Lock className="h-5 w-5" /> : task.day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold">
                    Day {task.day}: {task.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {task.isCompleted && <Badge className="bg-green-500">Completed</Badge>}
                    {isLocked && <Badge className="bg-amber-500">Locked</Badge>}
                    {!task.isCompleted && !isLocked && task.isActive && <Badge className="bg-challenges-500">Active</Badge>}
                    {!isUpcoming && isPendingSubmission && <Badge className="bg-blue-500">Submitted (Pending Review)</Badge>}
                    {!isUpcoming && <span className="text-sm text-muted-foreground">{task.points || 0} pts</span>}
                  </div>
                </div>
                {!isUpcoming && <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{task.description}</p>}
                {isLocked && (
                  <p className="text-xs text-amber-700 mt-2">
                    {isUpcoming
                      ? "Unlocks when the challenge starts."
                      : task.lockReason || unlockMessage || "Complete the previous task to unlock this one."}
                  </p>
                )}
                {!isUpcoming && task.deliverable && (
                  <p className="text-sm font-medium mt-2">📋 {task.deliverable}</p>
                )}
                {!isUpcoming && (
                  <div className="flex items-center space-x-2 mt-2">
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
            })()
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
