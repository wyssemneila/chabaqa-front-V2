"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Settings, 
  Maximize, 
  PlayCircle, 
  Lock 
} from "lucide-react"

interface VideoPlayerProps {
  creatorSlug: string
  currentChapter: any
  isChapterAccessible: (chapterId: string) => boolean
  enrollment: any
  slug: string
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  currentTime: number
  formatTime: (seconds: number) => string
  onEnrollNow?: () => void
}

export default function VideoPlayer({ 
  creatorSlug,
  currentChapter, 
  isChapterAccessible, 
  enrollment, 
  slug, 
  isPlaying, 
  setIsPlaying, 
  currentTime, 
  formatTime,
  onEnrollNow
}: VideoPlayerProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="relative bg-black aspect-video">
        {currentChapter?.videoUrl && isChapterAccessible(currentChapter.id) ? (
          <>
            <iframe
              src={currentChapter.videoUrl}
              title={currentChapter.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
            {/* Video Controls - Overlay for mock purposes */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="space-y-2">
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div
                    className="bg-white rounded-full h-1 transition-all"
                    style={{ width: `${(currentTime / (currentChapter.duration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <div className="w-16 bg-white/20 rounded-full h-1">
                        <div className="bg-white rounded-full h-1 w-3/4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>
                      {formatTime(currentTime)} / {formatTime((currentChapter.duration || 0) * 60)}
                    </span>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white bg-gray-800">
            <div className="text-center">
              {(!isChapterAccessible(currentChapter?.id) && !currentChapter?.isPreview) ? (
                <>
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  {currentChapter?.isPaidChapter ? (
                    <>
                      <p className="text-lg font-semibold">Payment Required</p>
                      <p className="text-sm text-gray-300 mt-2">You must pay to access this chapter.</p>
                      <Button className="mt-4" onClick={onEnrollNow}>
                        Enroll to Access
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold">Chapter Locked</p>
                      {enrollment ? (
                        <p className="text-sm text-gray-300 mt-2">Complete previous chapters to unlock this content.</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-300 mt-2">Enroll in the course to access this content</p>
                          <Button className="mt-4" onClick={onEnrollNow}>
                            Enroll Now
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Unavailable</p>
                  <p className="text-sm text-gray-300 mt-2">The video for this chapter is currently unavailable.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
