"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface AiTutorWidgetProps {
  courseId: string
  chapterId: string
}

export default function AiTutorWidget({ courseId, chapterId }: AiTutorWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const { toast } = useToast()
  const { user: currentUser } = useAuthContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const userAvatar =
    currentUser?.avatar ||
    (currentUser as any)?.photo_profil ||
    (currentUser as any)?.profile_picture ||
    "/placeholder.svg"
  const userInitials =
    (currentUser?.name || "You")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U"

  // Load persisted messages when course/chapter changes
  useEffect(() => {
    let isCancelled = false

    const loadHistory = async () => {
      setIsHistoryLoading(true)
      try {
        const history = await api.ai.getChapterHistory(courseId, chapterId)
        if (isCancelled) return
        const normalizedMessages = (history.messages || []).map((message) => ({
          role: message.role === 'user' ? 'user' : 'ai',
          content: message.content,
        })) as Message[]
        setMessages(normalizedMessages)
      } catch (error) {
        if (isCancelled) return
        console.error("Failed to load AI history:", error)
        setMessages([])
      } finally {
        if (!isCancelled) {
          setIsHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isCancelled = true
    }
  }, [courseId, chapterId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading || isHistoryLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await api.ai.askChapterQuestion(courseId, chapterId, userMessage)
      const answer = typeof response?.answer === 'string' ? response.answer.trim() : ""
      if (!answer) {
        throw new Error("AI response was empty")
      }
      setMessages(prev => [...prev, { role: 'ai', content: answer }])
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to get an answer from the AI Tutor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="border-0 shadow-sm h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>AI Course Tutor</CardTitle>
        </div>
        <CardDescription>
          Ask questions about this chapter's content.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <>
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground mt-20">
                  <Loader2 className="h-8 w-8 mb-3 animate-spin opacity-60" />
                  <p className="text-sm">Loading conversation...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground mt-20">
                  <Bot className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-medium">Hello! I'm your AI Tutor.</p>
                  <p className="text-sm mt-1 max-w-xs">
                    I've read this chapter and I'm ready to answer your questions.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  
                  <div
                    className={`rounded-lg p-3 max-w-[80%] text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                  {msg.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1 border border-blue-200">
                      <AvatarImage src={userAvatar} alt={currentUser?.name || "You"} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-gray-50/50">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Ask a question about this chapter..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isHistoryLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || isHistoryLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
