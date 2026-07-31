"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  AskChapterResponse,
  ChapterHistoryMessage,
  TutorQuizQuestion,
  TutorSource,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { BidiList, BidiText } from "./bidi-text"

export type UiMessage = ChapterHistoryMessage & {
  quiz?: TutorQuizQuestion[]
  summaryData?: { summary: string; keyPoints: string[] }
}

export function SourceCitations({ sources }: { sources: TutorSource[] }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        dir="ltr"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-[#8e78fb]" />
          Sources from this chapter ({sources.length})
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      {open && (
        <ul className="mt-2 space-y-2" role="list">
          {sources.map((src) => (
            <li key={src.id} className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <BidiText as="p" className="font-medium text-foreground">
                {src.label}
              </BidiText>
              <BidiText as="p" className="mt-1 text-muted-foreground">
                {src.excerpt}
              </BidiText>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function QuizBlock({ questions }: { questions: TutorQuizQuestion[] }) {
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState(false)
  const allAnswered =
    questions.length > 0 && questions.every((_, i) => selections[i] !== undefined)

  return (
    <div className="space-y-3">
      {questions.map((q, qi) => {
        const selected = selections[qi]
        const isCorrect = revealed && selected === q.correctIndex
        const isWrong = revealed && selected !== undefined && selected !== q.correctIndex

        return (
          <div key={qi} className="rounded-lg border bg-muted/30 p-3" dir="auto">
            <BidiText as="p" className="text-sm font-medium text-foreground">
              {qi + 1}. {q.question}
            </BidiText>
            <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {q.options.map((opt: string, oi: number) => (
                <label
                  key={oi}
                  dir="auto"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors",
                    selected === oi && !revealed && "border-[#d4c5ff] bg-[#f0eefe]",
                    revealed && oi === q.correctIndex && "border-green-200 bg-green-50",
                    isWrong && selected === oi && "border-red-200 bg-red-50",
                  )}
                >
                  <input
                    type="radio"
                    name={`quiz-q-${qi}`}
                    className="sr-only"
                    checked={selected === oi}
                    disabled={revealed}
                    onChange={() => setSelections((prev) => ({ ...prev, [qi]: oi }))}
                  />
                  <BidiText as="span" className="flex-1 text-foreground">
                    {opt}
                  </BidiText>
                </label>
              ))}
            </div>
            {revealed && (
              <p className="mt-2 text-xs text-muted-foreground">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-green-700" dir="ltr">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                  </span>
                ) : (
                  <BidiText as="span">
                    <span dir="ltr">Review: </span>
                    {q.explanation}
                  </BidiText>
                )}
              </p>
            )}
          </div>
        )
      })}
      <Button type="button" size="sm" variant="outline" disabled={!allAnswered || revealed} onClick={() => setRevealed(true)}>
        Check answers
      </Button>
    </div>
  )
}

export function AssistantBubble({ message }: { message: UiMessage }) {
  if (message.mode === "quiz" && !message.quiz?.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground" dir="ltr">
          This quiz could not be restored. Use Quiz below to generate a new one.
        </p>
        {message.content ? (
          <BidiText className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </BidiText>
        ) : null}
      </div>
    )
  }

  if (message.quiz?.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground" dir="ltr">
          Chapter quiz
        </p>
        <QuizBlock questions={message.quiz} />
      </div>
    )
  }

  if (message.summaryData) {
    return (
      <div className="space-y-2 text-sm text-foreground">
        <BidiText className="whitespace-pre-wrap leading-relaxed">
          {message.summaryData.summary}
        </BidiText>
        <BidiList
          items={message.summaryData.keyPoints}
          className="text-muted-foreground"
        />
        <SourceCitations sources={message.sources || []} />
      </div>
    )
  }

  return (
    <div>
      <BidiText className="whitespace-pre-wrap text-sm leading-relaxed">
        {message.content}
      </BidiText>
      <SourceCitations sources={message.sources || []} />
    </div>
  )
}

export function responseToUiMessages(
  response: AskChapterResponse,
  userContent: string,
): UiMessage[] {
  const userMsg: UiMessage = { role: "user", content: userContent, mode: response.mode }

  if (response.mode === "quiz") {
    if (!response.questions.length) {
      throw new Error("Empty quiz response")
    }
    return [
      userMsg,
      {
        role: "ai",
        content: `Quiz: ${response.questions.length} questions`,
        mode: "quiz",
        quiz: response.questions,
      },
    ]
  }

  if (response.mode === "summary") {
    const points = response.keyPoints.map((p: string) => `• ${p}`).join("\n")
    return [
      userMsg,
      {
        role: "ai",
        content: `${response.summary}\n\n${points}`,
        mode: "summary",
        sources: response.sources,
        summaryData: { summary: response.summary, keyPoints: response.keyPoints },
      },
    ]
  }

  return [
    userMsg,
    {
      role: "ai",
      content: response.mode === "simplify" ? response.answer : response.answer,
      mode: response.mode,
      sources: response.sources,
    },
  ]
}
