"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Loader2,
  BookOpen,
  ListChecks,
  Lightbulb,
  CircleHelp,
  ShieldCheck,
  PanelRightOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { api, type AiTutorMode } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"
import { cn } from "@/lib/utils"
import {
  AssistantBubble,
  responseToUiMessages,
  type UiMessage,
} from "./ai-tutor-parts"
import { BidiText } from "./bidi-text"

interface AiTutorWidgetProps {
  courseId: string
  chapterId: string
  variant?: "embedded" | "sheet"
}

interface FloatingAiTutorSheetProps {
  courseId: string
  chapterId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PROMPT_CHIPS: {
  label: string
  text: string
  mode?: AiTutorMode
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { label: "Explain", text: "Explain this chapter in simple terms for a beginner.", icon: Lightbulb },
  { label: "Summary", text: "", mode: "summary", icon: BookOpen },
  { label: "Quiz me", text: "Give me a 3-question quiz on this chapter.", mode: "quiz", icon: ListChecks },
  { label: "Help me", text: "I'm stuck on the main concept — can you help me understand it?", icon: CircleHelp },
]

/** Chabaqa AI Tutor mark: an open book (learning) with a focused AI spark. */
export function AiTutorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 text-[#8e78fb]", className)}
    >
      <path
        d="M4.75 8.75c3.55-1.55 6.8-1.05 11.25 1.65v15.1c-4.45-2.7-7.7-3.2-11.25-1.65V8.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M27.25 8.75c-3.55-1.55-6.8-1.05-11.25 1.65v15.1c4.45-2.7 7.7-3.2 11.25-1.65V8.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 10.4v15.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M23.5 3.25v4.5M21.25 5.5h4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TutorAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0eefe] ring-1 ring-[#d4c5ff]",
        className,
      )}
    >
      <AiTutorMark />
    </div>
  )
}

export default function AiTutorWidget({ courseId, chapterId, variant = "embedded" }: AiTutorWidgetProps) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMode, setLoadingMode] = useState<AiTutorMode | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const { toast } = useToast()
  const { user: currentUser } = useAuthContext()
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  const userAvatar =
    currentUser?.avatar ||
    (currentUser as { photo_profil?: string; profile_picture?: string })?.photo_profil ||
    (currentUser as { profile_picture?: string })?.profile_picture ||
    "/placeholder.svg"
  const userInitials =
    (currentUser?.name || "You")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U"

  useEffect(() => {
    let isCancelled = false
    const loadHistory = async () => {
      setIsHistoryLoading(true)
      try {
        const history = await api.ai.getChapterHistory(courseId, chapterId)
        if (!isCancelled) {
          setMessages(
            (history.messages || []).map((message) => ({
              ...message,
              quiz: message.quiz,
            })) as UiMessage[],
          )
        }
      } catch (error: unknown) {
        if (isCancelled) return
        const status =
          (error as { response?: { status?: number }; status?: number })?.response?.status ??
          (error as { status?: number })?.status
        if (status === 403) {
          setIsDisabled(true)
          return
        }
        setMessages([])
      } finally {
        if (!isCancelled) setIsHistoryLoading(false)
      }
    }
    void loadHistory()
    return () => {
      isCancelled = true
    }
  }, [courseId, chapterId])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
    })
  }, [messages, isLoading])

  const sendRequest = useCallback(
    async (question: string, mode: AiTutorMode = "chat") => {
      if (isLoading || isHistoryLoading) return
      const trimmed = question.trim()
      if (mode === "chat" && !trimmed) return

      const displayQuestion =
        trimmed ||
        (mode === "summary" ? "Chapter summary" : mode === "quiz" ? "Chapter quiz" : "Simpler explanation")

      setMessages((prev) => [...prev, { role: "user", content: displayQuestion, mode }])
      setInput("")
      setIsLoading(true)
      setLoadingMode(mode)

      try {
        const response = await api.ai.askChapterQuestion(courseId, chapterId, {
          question: trimmed || undefined,
          mode,
        })
        setMessages((prev) => {
          const pair = responseToUiMessages(response, displayQuestion)
          if (prev.length > 0 && prev[prev.length - 1]?.role === "user") {
            return [...prev.slice(0, -1), ...pair]
          }
          return [...prev, ...pair]
        })
        if (liveRef.current) {
          liveRef.current.textContent =
            mode === "quiz" ? "Quiz ready." : mode === "summary" ? "Summary ready." : "Answer ready."
        }
      } catch (error: unknown) {
        setMessages((prev) => prev.slice(0, -1))
        const message =
          error instanceof Error && error.message.includes("empty quiz")
            ? "The quiz could not be generated. Please try again."
            : "Could not get a response. Please try again."
        toast({
          title: mode === "quiz" ? "Quiz unavailable" : "Tutor unavailable",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setLoadingMode(null)
      }
    },
    [courseId, chapterId, isHistoryLoading, isLoading, toast],
  )

  const loadingLabel =
    loadingMode === "quiz"
      ? "Building quiz…"
      : loadingMode === "summary"
        ? "Summarizing…"
        : loadingMode === "simplify"
          ? "Simplifying…"
          : "Thinking…"

  if (isDisabled) {
    return (
      <Card className="flex h-full min-h-[360px] flex-col justify-center rounded-none border-0 bg-transparent p-6 text-center shadow-none">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <CardTitle className="mt-4 text-base text-slate-950">Tutor locked for this chapter</CardTitle>
        <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Finish the required step or unlock the chapter before asking the AI tutor. This keeps paid course content protected.
        </CardDescription>
      </Card>
    )
  }

  const isSheet = variant === "sheet"
  const promptChips = (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="AI tutor quick prompts">
      {PROMPT_CHIPS.map((chip) => {
        const Icon = chip.icon
        const mode = chip.mode || "chat"
        return (
          <Button
            key={chip.label}
            type="button"
            variant="secondary"
            size="sm"
            className="btn-press-active h-10 shrink-0 gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:border-[#d4c5ff] hover:bg-[#f0eefe] hover:text-[#8e78fb] disabled:opacity-50"
            disabled={isLoading || isHistoryLoading}
            onClick={() => sendRequest(chip.text, mode)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {chip.label}
          </Button>
        )
      })}
    </div>
  )

  return (
    <Card
      className={cn(
        "flex flex-col",
        isSheet
          ? "h-full min-h-0 rounded-none border-0 bg-transparent shadow-none"
          : "h-[min(680px,72vh)] min-h-[460px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm",
      )}
    >
      <CardHeader className={cn("shrink-0 border-b border-gray-100 bg-white pb-4", isSheet && "pr-12")}>
        <div className="flex items-start gap-3">
          <TutorAvatar className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base text-slate-950 md:text-lg">AI Course Tutor</CardTitle>
              <span className="rounded-full border border-[#d4c5ff] bg-[#f0eefe] px-2 py-0.5 text-[11px] font-semibold text-[#8e78fb]">
                This chapter
              </span>
            </div>
            <CardDescription className="mt-1 text-xs leading-relaxed text-slate-500 md:text-sm">
              Ask focused questions, generate summaries, and test yourself without leaving the lesson.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

        <div
          ref={scrollViewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-gray-50/60 px-4 md:px-6"
        >
          <div className="py-4">
            {messages.length === 0 ? (
              isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin opacity-50" />
                  <p className="text-sm md:text-base">Loading conversation…</p>
                </div>
              ) : (
                <div className="mx-auto max-w-md space-y-6 py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4c5ff] bg-[#f0eefe]">
                    <AiTutorMark className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-950 md:text-lg">Start with a chapter question</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Choose a quick prompt or ask your own. The tutor uses the current chapter context.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-2.5 md:gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "ai" && <TutorAvatar className="mt-0.5" />}
                    <div
                      className={cn(
                        "min-w-0 rounded-2xl px-3 py-2.5 shadow-sm md:px-4",
                        msg.role === "user"
                          ? "max-w-[88%] bg-slate-950 text-white md:max-w-[85%]"
                          : "w-full max-w-full border border-slate-200 bg-white/90",
                        msg.role === "ai" &&
                          !msg.quiz?.length &&
                          "max-w-[88%] md:max-w-[85%]",
                      )}
                    >
                      {msg.role === "ai" ? (
                        <AssistantBubble message={msg} />
                      ) : (
                        <BidiText className="text-sm leading-relaxed md:text-base">
                          {msg.content}
                        </BidiText>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <Avatar className="mt-0.5 h-8 w-8 shrink-0 border">
                        <AvatarImage src={userAvatar} alt={currentUser?.name || "You"} />
                        <AvatarFallback className="text-[10px] font-medium">{userInitials}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2.5 md:gap-3">
                    <TutorAvatar className="mt-0.5" />
                    <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-[#8e78fb]" aria-hidden="true" />
                      <span className="text-xs text-slate-500 md:text-sm">{loadingLabel}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter
        className={cn(
          "shrink-0 flex flex-col gap-3 border-t border-gray-100 bg-white p-4 md:p-5",
          isSheet && "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        )}
      >
        {promptChips}
        <div className="flex w-full gap-2 rounded-xl border border-gray-200 bg-white p-1.5 focus-within:border-[#8e78fb] focus-within:ring-2 focus-within:ring-[#8e78fb]/10">
          <Input
            placeholder="Ask about this chapter…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendRequest(input, "chat")
              }
            }}
            disabled={isLoading || isHistoryLoading}
            className="h-11 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 md:text-base"
            aria-label="Question for AI tutor"
          />
          <Button
            type="button"
            size="icon"
            disabled={isLoading || isHistoryLoading || !input.trim()}
            onClick={() => void sendRequest(input, "chat")}
            aria-label="Send question"
            className="btn-press-active h-10 w-10 shrink-0 rounded-lg bg-[#8e78fb] text-white shadow-sm hover:bg-[#7a64f0] disabled:bg-slate-300"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function FloatingAiTutorSheet({
  courseId,
  chapterId,
  open,
  onOpenChange,
}: FloatingAiTutorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Button
        type="button"
        className="btn-press-active fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 h-11 gap-2 rounded-xl bg-[#8e78fb] px-4 text-white shadow-lg shadow-[#8e78fb]/20 hover:bg-[#7a64f0] sm:bottom-6 sm:right-6"
        onClick={() => onOpenChange?.(true)}
        aria-label="Ask AI Tutor"
        data-testid="floating-ai-tutor-trigger"
      >
        <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-bold">Ask AI</span>
      </Button>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-full flex-col overflow-hidden border-l border-gray-200 bg-white p-0 shadow-2xl sm:max-w-[440px]"
        data-testid="floating-ai-tutor-sheet"
      >
        <SheetTitle className="sr-only">AI Course Tutor</SheetTitle>
        <SheetDescription className="sr-only">
          Ask questions, summarize this chapter, or generate a quiz with the AI tutor.
        </SheetDescription>
        <AiTutorWidget courseId={courseId} chapterId={chapterId} variant="sheet" />
      </SheetContent>
    </Sheet>
  )
}
