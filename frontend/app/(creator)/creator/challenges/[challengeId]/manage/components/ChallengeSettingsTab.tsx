"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  challengeId: string
  formData: any
  onInputChange: (field: string, value: any) => void
  onDeleteChallenge: () => Promise<void>
  fieldErrors?: Record<string, string>
}

export default function ChallengeSettingsTab({ 
  challengeId, 
  formData, 
  onInputChange, 
  onDeleteChallenge,
  fieldErrors = {},
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDeleteChallenge()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Challenge Configuration</CardTitle>
          <CardDescription>Control challenge behavior and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Active Status</h4>
              <p className="text-sm text-muted-foreground">Enable to allow users to join and see this challenge</p>
            </div>
            <Switch 
              checked={formData.isActive} 
              onCheckedChange={(checked) => onInputChange("isActive", checked)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sequential Progression</h4>
              <p className="text-sm text-muted-foreground">Users must complete tasks in order (Day 1, then Day 2...)</p>
            </div>
            <Switch 
              checked={formData.sequentialProgression} 
              onCheckedChange={(checked) => onInputChange("sequentialProgression", checked)} 
            />
          </div>

          {formData.sequentialProgression && (
            <div className="space-y-2">
              <Label htmlFor="unlockMessage">Unlock Message</Label>
              <Input
                id="unlockMessage"
                value={formData.unlockMessage || ""}
                onChange={(e) => onInputChange("unlockMessage", e.target.value)}
                placeholder="Complete the previous task to unlock this one."
                className={fieldErrors.unlockMessage ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {fieldErrors.unlockMessage && (
                <p className="text-sm text-red-500">{fieldErrors.unlockMessage}</p>
              )}
            </div>
          )}
          {fieldErrors.subscription && (
            <p className="text-sm text-red-500">{fieldErrors.subscription}</p>
          )}
          {fieldErrors.permission && (
            <p className="text-sm text-red-500">{fieldErrors.permission}</p>
          )}
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this challenge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Delete Challenge</h4>
              <p className="text-sm text-muted-foreground">Permanently remove this challenge and all participant data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Challenge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    challenge and remove all participant data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Challenge"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}
