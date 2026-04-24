import { Route } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resolveImageUrl } from '@/lib/resolve-image-url'

interface LearningPathHeaderProps {
  communityName?: string
  communityLogo?: string
  totalCount: number
  chapterCount: number
  challengeCount: number
  resourceCount: number
}

const getInitials = (value?: string) => {
  if (!value) return 'C'
  const parts = value.trim().split(' ')
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase())
  return initials.join('') || 'C'
}

export default function LearningPathHeader({
  communityName,
  communityLogo,
  totalCount,
  chapterCount,
  challengeCount,
  resourceCount,
}: LearningPathHeaderProps) {
  const logoUrl = resolveImageUrl(communityLogo)

  return (
    <div className="mb-6">
      <div className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-500 p-4 text-white md:flex-row">
        <div className="absolute top-0 right-0 h-20 w-20 -translate-y-12 translate-x-12 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-white/10" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Route className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Learning Path</h1>
          </div>
          <p className="text-sm text-emerald-50">
            Personalized recommendations aligned with your goals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/40">
              <AvatarImage src={logoUrl || undefined} alt={communityName || 'Community'} />
              <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">
                {getInitials(communityName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-emerald-100">Community</div>
              <div className="text-base font-semibold">{communityName || 'Your community'}</div>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xl font-bold">{totalCount}</div>
              <div className="text-xs text-emerald-100">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{chapterCount}</div>
              <div className="text-xs text-emerald-100">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{challengeCount}</div>
              <div className="text-xs text-emerald-100">Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{resourceCount}</div>
              <div className="text-xs text-emerald-100">Resources</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
