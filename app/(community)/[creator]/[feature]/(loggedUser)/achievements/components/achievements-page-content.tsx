"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Community, AchievementWithProgress } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Medal,
  Award,
  Crown,
  RefreshCw,
  Sparkles,
  Zap,
  Grid3x3,
  List,
  Lock,
  CheckCircle2,
  Target,
  Filter,
  Flame
} from "lucide-react"

const RARITY_CONFIG = {
  common: { 
    label: "Common", 
    color: "bg-slate-100 text-slate-700 border-slate-200", 
    icon: Trophy,
    gradient: "from-slate-400 to-slate-600",
    shadow: "shadow-slate-200"
  },
  rare: { 
    label: "Rare", 
    color: "bg-blue-100 text-blue-700 border-blue-200", 
    icon: Medal,
    gradient: "from-blue-400 to-blue-600",
    shadow: "shadow-blue-200"
  },
  epic: { 
    label: "Epic", 
    color: "bg-purple-100 text-purple-700 border-purple-200", 
    icon: Award,
    gradient: "from-purple-400 to-purple-600",
    shadow: "shadow-purple-200"
  },
  legendary: { 
    label: "Legendary", 
    color: "bg-amber-100 text-amber-700 border-amber-200", 
    icon: Crown,
    gradient: "from-amber-400 to-amber-600",
    shadow: "shadow-amber-200"
  },
}

interface AchievementsPageContentProps {
  slug: string
  community: Community
  achievements: AchievementWithProgress[]
  onRefresh: () => void
}

export default function AchievementsPageContent({
  slug,
  community,
  achievements,
  onRefresh,
}: AchievementsPageContentProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const safeAchievements = Array.isArray(achievements) ? achievements : []

  // Extract unique categories (tags)
  const categories = useMemo(() => {
    const allTags = safeAchievements.flatMap(a => a.tags || [])
    const uniqueTags = Array.from(new Set(allTags)).filter(Boolean)
    return ['all', ...uniqueTags.sort()]
  }, [safeAchievements])

  const stats = useMemo(() => {
    const unlocked = safeAchievements.filter(a => a.isUnlocked).length
    const total = safeAchievements.length
    const inProgress = safeAchievements.filter(a => !a.isUnlocked && a.progress && a.progress > 0).length
    const locked = total - unlocked - inProgress
    const completionRate = total > 0 ? Math.round((unlocked / total) * 100) : 0
    
    // Calculate total XP earned
    const totalXp = safeAchievements
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + (a.points || 0), 0)

    return { total, unlocked, inProgress, locked, completionRate, totalXp }
  }, [safeAchievements])

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = safeAchievements

    // Filter by tab status
    if (activeTab === 'unlocked') {
      filtered = filtered.filter(a => a.isUnlocked)
    } else if (activeTab === 'locked') {
      filtered = filtered.filter(a => !a.isUnlocked)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.tags?.includes(selectedCategory))
    }

    return filtered
  }, [safeAchievements, activeTab, selectedCategory])

  // Find next milestone (highest progress among locked)
  const nextMilestone = useMemo(() => {
    const locked = safeAchievements.filter(a => !a.isUnlocked)
    if (locked.length === 0) return null
    // Sort by progress descending
    return locked.sort((a, b) => (b.progress || 0) - (a.progress || 0))[0]
  }, [safeAchievements])

  const handleRefresh = async () => {
    try {
      await onRefresh()
      toast({
        title: "✨ Achievements updated",
        description: "Latest achievement progress has been loaded.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "We couldn't refresh your achievements. Please try again.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Stats Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                    <Trophy className="h-7 w-7 text-yellow-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Achievements</h1>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold flex items-center justify-end gap-1">
                    {stats.totalXp} <span className="text-xl font-semibold text-indigo-200 mt-1.5">XP</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="text-center border-r border-white/20">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="h-7 w-7 text-yellow-300" /> {stats.unlocked}
                  </div>
                </div>
                <div className="text-center border-r border-white/20">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Target className="h-7 w-7 text-indigo-300" /> {stats.inProgress}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-7 w-7 text-green-300" /> {stats.completionRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Milestone Card */}
          {nextMilestone ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5 text-orange-600 font-semibold text-sm uppercase tracking-wide">
                  <Flame className="h-4 w-4" />
                  Next Goal
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                    <Target className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5 text-xl line-clamp-1">{nextMilestone.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">{nextMilestone.description}</p>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{Math.round(nextMilestone.progress || 0)}%</span>
                  </div>
                  <Progress value={nextMilestone.progress} className="h-2.5 bg-orange-100/70 [&>*]:bg-orange-500" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">All Clear!</h3>
              <p className="text-sm text-gray-500 mt-1">You've unlocked everything.</p>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-2 rounded-xl border shadow-sm">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
            <TabsList className="bg-gray-100/60 p-1 h-auto rounded-lg">
              <TabsTrigger value="all" className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
                All
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
                Unlocked
              </TabsTrigger>
              <TabsTrigger value="locked" className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
                Locked
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {categories.length > 1 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] h-10 border-gray-200 bg-gray-50/50 text-gray-700 hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center bg-gray-100/60 rounded-lg p-1 border border-gray-200/50">
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-9 w-9 p-0 rounded-md text-gray-600 hover:bg-white hover:text-indigo-600", viewMode === 'grid' && "bg-white shadow-sm text-indigo-600")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-9 w-9 p-0 rounded-md text-gray-600 hover:bg-white hover:text-indigo-600", viewMode === 'list' && "bg-white shadow-sm text-indigo-600")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-10 w-10 p-0 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Sparkles className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No achievements found</h3>
              <p className="text-gray-500 max-w-md mx-auto text-base">
                Try adjusting your filters or check back later for new challenges!
              </p>
              {(selectedCategory !== 'all' || activeTab !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => { setSelectedCategory('all'); setActiveTab('all'); }}
                  className="mt-6 text-indigo-600 font-semibold"
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          )}>
            {filteredAchievements.map((achievement) => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AchievementCard({ 
  achievement, 
  viewMode,
}: { 
  achievement: AchievementWithProgress
  viewMode: 'grid' | 'list'
}) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common
  const RarityIcon = rarityConfig.icon
  
  const progressPercent = achievement.progress || 0
  const isUnlocked = achievement.isUnlocked

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100",
        isUnlocked
          ? "bg-white"
          : "bg-gray-50/50 opacity-95 hover:opacity-100",
        viewMode === 'list' && "flex-row items-center gap-6 p-2"
      )}
    >
      {/* Shine effect for unlocked achievements */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20 pointer-events-none"></div>
      )}

      {/* Rarity Stripe - Thicker and more visible */}
      <div className={cn(
        "absolute top-0 left-0 h-full w-2",
        `bg-gradient-to-b ${rarityConfig.gradient}`
      )}></div>

      <CardContent className={cn("p-4 pl-6", viewMode === 'list' && "flex-1 flex items-center gap-4 p-3 pl-6")}>
        {/* Header / Icon Area */}
        <div className={cn("flex items-start justify-between mb-3", viewMode === 'list' && "mb-0 w-1/4")}>
          <div className={cn(
            "relative rounded-2xl w-12 h-12 flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
            isUnlocked ? `bg-gradient-to-br ${rarityConfig.gradient} text-white` : "bg-gray-200 text-gray-400 grayscale"
          )}>
            <RarityIcon className={cn("h-6 w-6", isUnlocked ? "text-white" : "text-gray-500")} />
            
            {/* Lock Overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full backdrop-blur-[1.5px]">
                <Lock className="h-5 w-5 text-white/90 drop-shadow-md" />
              </div>
            )}

            {/* Unlocked Badge */}
            {isUnlocked && (
              <div className="absolute -bottom-1 -right-1 bg-white text-green-600 p-1 rounded-full shadow-md border border-green-50">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* XP Badge */}
          {achievement.points > 0 && viewMode === 'grid' && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 transition-colors shadow-sm text-[11px] px-2 py-0.5">
              <Zap className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              {achievement.points} XP
            </Badge>
          )}
        </div>

        {/* Content Area */}
        <div className={cn("flex-1 min-w-0", viewMode === 'list' && "grid grid-cols-2 gap-4 items-center")}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                {achievement.name}
              </h3>
              {viewMode === 'list' && achievement.points > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm text-[11px] px-2 py-0.5">
                  <Zap className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                  {achievement.points} XP
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2 leading-snug">
              {achievement.description}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                className={cn("text-[10px] uppercase tracking-wider h-5 px-2.5 font-semibold shadow-sm border-0 text-white", `bg-gradient-to-r ${rarityConfig.gradient}`)}
              >
                {rarityConfig.label}
              </Badge>
              {achievement.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 h-5 px-2.5 capitalize border-slate-200 border">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress Area */}
          <div className={cn("mt-4", viewMode === 'list' && "mt-0")}>
            {!isUnlocked ? (
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-slate-400" /> Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                {achievement.currentValue !== undefined && achievement.targetValue !== undefined && (
                  <div className="text-[11px] text-right text-slate-500 font-medium mt-0.5">
                    {achievement.currentValue} <span className="text-slate-300">/</span> {achievement.targetValue}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-3 border border-green-100 shadow-sm flex items-center justify-between">
                <div className="text-xs md:text-sm text-green-800 font-bold flex items-center gap-1.5">
                  <div className="p-1 bg-green-200 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 text-green-700" />
                  </div>
                  Unlocked!
                </div>
                {achievement.earnedAt && (
                  <span className="text-green-600 font-medium text-[11px] uppercase tracking-wide">
                    {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
