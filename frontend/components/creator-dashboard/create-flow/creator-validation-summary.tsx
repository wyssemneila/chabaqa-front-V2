"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { CreatorValidationResult } from "@/lib/creator-content"

interface CreatorValidationSummaryProps {
  result: CreatorValidationResult
  title?: string
  onIssueClick?: (field: string) => void
}

export function CreatorValidationSummary({
  result,
  title = "Needs attention",
  onIssueClick,
}: CreatorValidationSummaryProps) {
  const fieldIssues = Object.entries(result.fieldErrors)
  const issues = [
    ...fieldIssues.map(([field, message]) => ({ field, message })),
    ...result.globalErrors.map((message, index) => ({ field: `global-${index}`, message })),
    ...result.publishBlockers.map((message, index) => ({ field: `publish-${index}`, message })),
  ]

  if (issues.length === 0) return null

  return (
    <Alert variant="destructive" className="bg-red-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {issues.map((issue) => (
            <li key={`${issue.field}-${issue.message}`}>
              <button
                type="button"
                className="text-left underline-offset-2 hover:underline"
                onClick={() => onIssueClick?.(issue.field)}
              >
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

