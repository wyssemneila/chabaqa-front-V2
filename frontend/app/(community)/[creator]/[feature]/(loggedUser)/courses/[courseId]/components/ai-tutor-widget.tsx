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
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100",
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

  if (isDisabled) return null

  const isSheet = variant === "sheet"
  const promptChips = (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
      {PROMPT_CHIPS.map((chip) => {
        const Icon = chip.icon
        const mode = chip.mode || "chat"
        return (
          <Button
            key={chip.label}
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-medium"
            disabled={isLoading || isHistoryLoading}
            onClick={() => sendRequest(chip.text, mode)}
          >
            <Icon className="h-3.5 w-3.5 text-purple-500" />
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
          : "h-[min(640px,70vh)] min-h-[420px] border shadow-sm",
      )}
    >
      <CardHeader className={cn("shrink-0 pb-4", isSheet && "border-b bg-background/80 pr-12 backdrop-blur")}>
        <div className="flex items-center gap-3">
          <TutorAvatar className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base md:text-lg">AI Course Tutor</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Answers grounded in this chapter, with sources, summaries, and quizzes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

        <div
          ref={scrollViewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 md:px-6"
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
                    <MessageCircle className="h-7 w-7 text-purple-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium md:text-base">Ask about this chapter</p>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                      Pick a suggestion below or type your own question.
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
                        "min-w-0 rounded-lg px-3 py-2.5 md:px-4",
                        msg.role === "user"
                          ? "max-w-[88%] bg-primary text-primary-foreground md:max-w-[85%]"
                          : "w-full max-w-full border bg-muted/40",
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
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-xs text-muted-foreground md:text-sm">{loadingLabel}</span>
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
          "shrink-0 flex flex-col gap-3 border-t bg-muted/20 p-4 md:p-6",
          isSheet && "bg-background/85 backdrop-blur",
        )}
      >
        {promptChips}
        <div className="flex w-full gap-2">
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
            className="text-sm md:text-base"
            aria-label="Question for AI tutor"
          />
          <Button
            type="button"
            size="icon"
            disabled={isLoading || isHistoryLoading || !input.trim()}
            onClick={() => void sendRequest(input, "chat")}
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
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
      <SheetContent
        side="left"
        className="flex h-full w-full max-w-full flex-col overflow-hidden border-r border-slate-100 bg-slate-50/90 p-0 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:max-w-md"
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
