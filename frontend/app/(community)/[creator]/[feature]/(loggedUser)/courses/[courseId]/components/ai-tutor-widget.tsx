"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  ListChecks,
  Lightbulb,
  MessageCircle,
  ListOrdered,
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
  { label: "Explain simply", text: "Explain this chapter in simple terms for a beginner.", icon: Lightbulb },
  { label: "Key takeaways", text: "What are the key takeaways from this chapter?", icon: ListOrdered },
  { label: "Summary", text: "", mode: "summary", icon: BookOpen },
  { label: "Quick quiz", text: "Give me a 3-question quiz on this chapter.", mode: "quiz", icon: ListChecks },
  { label: "Simplify", text: "", mode: "simplify", icon: Lightbulb },
  { label: "I'm stuck", text: "I'm stuck on the main concept — can you help me understand it?", icon: CircleHelp },
]

function TutorAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8e78fb]/15 to-[#47c7ea]/15 ring-1 ring-[#8e78fb]/20",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 text-purple-600" strokeWidth={2} />
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
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
            className="btn-press-active h-11 shrink-0 gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#8e78fb]/40 hover:bg-[#8e78fb]/5 hover:text-[#8e78fb] disabled:opacity-50"
            disabled={isLoading || isHistoryLoading}
            onClick={() => sendRequest(chip.text, mode)}
          >
            <Icon className="h-4 w-4 text-[#8e78fb]" aria-hidden="true" />
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
          : "h-[min(680px,72vh)] min-h-[460px] overflow-hidden border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(51,65,85,0.55)]",
      )}
    >
      <CardHeader className={cn("shrink-0 border-b border-slate-100 bg-gradient-to-br from-white via-white to-[#f6f4ff] pb-4", isSheet && "pr-12 backdrop-blur")}>
        <div className="flex items-start gap-3">
          <TutorAvatar className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base text-slate-950 md:text-lg">AI Course Tutor</CardTitle>
              <span className="rounded-full bg-[#47c7ea]/10 px-2 py-0.5 text-[11px] font-bold text-[#0f7490] ring-1 ring-[#47c7ea]/20">
                Chapter-aware
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
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[radial-gradient(circle_at_top_right,rgba(142,120,251,0.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 md:px-6"
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
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-lg shadow-purple-100 ring-1 ring-purple-100">
                    <MessageCircle className="h-8 w-8 text-[#8e78fb]" strokeWidth={1.75} aria-hidden="true" />
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
          "shrink-0 flex flex-col gap-3 border-t border-slate-100 bg-white/92 p-4 backdrop-blur md:p-5",
          isSheet && "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        )}
      >
        {promptChips}
        <div className="flex w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-[#8e78fb]/60 focus-within:ring-2 focus-within:ring-[#8e78fb]/15">
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
            className="btn-press-active h-11 w-11 shrink-0 rounded-xl bg-[#8e78fb] text-white shadow-sm hover:bg-[#7d67f5] disabled:bg-slate-300"
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
        className="btn-press-active motion-safe:hover:scale-[1.03] fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 gap-2 rounded-2xl bg-slate-950 px-4 text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/20 hover:bg-slate-800 sm:bottom-6 sm:right-6"
        onClick={() => onOpenChange?.(true)}
        aria-label="Ask AI Tutor"
        data-testid="floating-ai-tutor-trigger"
      >
        <PanelRightOpen className="h-5 w-5 text-[#47c7ea]" aria-hidden="true" />
        <span className="text-xs font-bold">Ask AI</span>
      </Button>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-full flex-col overflow-hidden border-l border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[480px]"
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
