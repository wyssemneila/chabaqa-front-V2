"use client"

import { useState, useEffect } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Funnel,
  FunnelChart,
  LabelList
} from "recharts"
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Coins, 
  Target,
  Clock,
  Activity,
  Eye,
  Heart,
  Share2,
  Bookmark,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Award,
  Zap,
  BarChart3,
  PieChartIcon,
  TrendingDown
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { trackEvent } from "@/lib/ga4"

interface ChallengeTask {
  id: string
  day: number
  title: string
  isCompleted: boolean
}

interface AnalyticsData {
  overview: {
    totalParticipants: number
    activeParticipants: number
    completedParticipants: number
    completionRate: number
    averageProgress: number
    totalTasks: number
    completedTasksTotal: number
    totalPointsEarned: number
    totalRevenue: number
  }
  participantStats: {
    byStatus: { active: number; inactive: number; completed: number }
    byProgress: { notStarted: number; early: number; midway: number; advanced: number; completed: number }
    joinTrend: Array<{ date: string; count: number }>
    topPerformers: Array<{
      odId: string
      odName: string
      progress: number
      totalPoints: number
      completedTasks: number
      joinedAt: string
      lastActivityAt: string
    }>
  }
  taskStats: {
    completionByTask: Array<{
      taskId: string
      day: number
      title: string
      points: number
      completedCount: number
      completionRate: number
    }>
    taskFunnel: Array<{
      taskId: string
      day: number
      title: string
      completedCount: number
      completionRate: number
      dropOffRate: number
      dropOffCount: number
    }>
    mostDifficultTasks: Array<{ taskId: string; day: number; title: string; completionRate: number }>
    easiestTasks: Array<{ taskId: string; day: number; title: string; completionRate: number }>
    totalTasks: number
    averageCompletionRate: number
  }
  engagementStats: {
    totalPosts: number
    totalComments: number
    totalLikes: number
    postsTrend: Array<{ date: string; count: number }>
    activityTrend: Array<{ date: string; count: number }>
    averagePostsPerParticipant: number
    views: number
    starts: number
    completes: number
    likes: number
    shares: number
    bookmarks: number
  }
  revenueStats: {
    totalRevenue: number
    participationFees: number
    deposits: number
    averageRevenuePerParticipant: number
    currency: string
    isPremium: boolean
  }
  timeStats: {
    startDate: string
    endDate: string
    totalDuration: number
    daysElapsed: number
    daysRemaining: number
    progressPercentage: number
    isActive: boolean
    isOngoing: boolean
    isCompleted: boolean
  }
  challenge: {
    id: string
    title: string
    category: string
    difficulty: string
    thumbnail: string
  }
}

const chartConfig: ChartConfig = {
  participants: { label: "Participants", color: "hsl(var(--chart-1))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
  active: { label: "Active", color: "hsl(var(--chart-3))" },
  posts: { label: "Posts", color: "hsl(var(--chart-4))" },
  activity: { label: "Activity", color: "hsl(var(--chart-5))" },
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function ChallengeAnalyticsTab({
  challenge,
  challengeTasks: _challengeTasks,
}: {
  challenge: any
  challengeTasks: ChallengeTask[]
}) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState("30")

  useEffect(() => {
    // Track when a creator views the challenge analytics tab
    trackEvent("challenge_analytics_view", {
      content_type: "challenge",
      content_id: challenge?.id,
      challenge_id: challenge?.id,
      community_id: challenge?.communityId,
      creator_id: challenge?.creatorId,
      date_range_days: Number(dateRange),
    })
  }, [challenge?.id, challenge?.communityId, challenge?.creatorId, dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [challenge.id, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const toDate = new Date()
      const fromDate = new Date(toDate.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
      
      const response = await apiClient.get<any>(
        `/challenges/${challenge.id}/analytics?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
      )
      
      const data = response?.data?.data ?? response?.data ?? response
      setAnalytics(data)
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err)
      setError(err?.message || 'Failed to load analytics')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Challenge Analytics</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <OverviewStats analytics={analytics} />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <ParticipantAnalytics analytics={analytics} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskAnalytics analytics={analytics} />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementAnalytics analytics={analytics} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueAnalytics analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}


// ============ OVERVIEW STATS COMPONENT ============
function OverviewStats({ analytics }: { analytics: AnalyticsData }) {
  const { overview, timeStats } = analytics

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <EnhancedCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="text-3xl font-bold">{overview.totalParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.activeParticipants} active
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-3xl font-bold">{overview.completionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.completedParticipants} completed
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
              <p className="text-3xl font-bold">{overview.averageProgress}%</p>
              <Progress value={overview.averageProgress} className="mt-2 h-2" />
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">
                {overview.totalRevenue.toLocaleString()} {analytics.revenueStats.currency}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.revenueStats.isPremium && <Badge variant="secondary" className="text-xs">Premium</Badge>}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Time Progress Card */}
      <EnhancedCard className="md:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Challenge Timeline</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={timeStats.isOngoing ? "default" : timeStats.isCompleted ? "secondary" : "outline"}>
                  {timeStats.isOngoing ? "Ongoing" : timeStats.isCompleted ? "Completed" : "Not Started"}
                </Badge>
              </div>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <Progress value={timeStats.progressPercentage} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{timeStats.daysElapsed} days elapsed</span>
            <span>{timeStats.daysRemaining} days remaining</span>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Tasks Overview Card */}
      <EnhancedCard className="md:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Tasks Overview</p>
              <p className="text-2xl font-bold">{overview.completedTasksTotal} / {overview.totalTasks * overview.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">total task completions</p>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-semibold">{overview.totalTasks}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-semibold">{overview.totalPointsEarned}</p>
              <p className="text-xs text-muted-foreground">Points Earned</p>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}

// ============ PARTICIPANT ANALYTICS COMPONENT ============
function ParticipantAnalytics({ analytics }: { analytics: AnalyticsData }) {
  const { participantStats, overview } = analytics

  const progressDistributionData = [
    { name: 'Not Started', value: participantStats.byProgress.notStarted, fill: '#ef4444' },
    { name: 'Early (1-25%)', value: participantStats.byProgress.early, fill: '#f59e0b' },
    { name: 'Midway (26-50%)', value: participantStats.byProgress.midway, fill: '#06b6d4' },
    { name: 'Advanced (51-99%)', value: participantStats.byProgress.advanced, fill: '#8b5cf6' },
    { name: 'Completed', value: participantStats.byProgress.completed, fill: '#10b981' },
  ].filter(d => d.value > 0)

  const statusData = [
    { name: 'Active', value: participantStats.byStatus.active, fill: '#10b981' },
    { name: 'Inactive', value: participantStats.byStatus.inactive, fill: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Progress Distribution */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Progress Distribution
          </CardTitle>
          <CardDescription>How participants are progressing through the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {progressDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {progressDistributionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Join Trend */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Join Trend
          </CardTitle>
          <CardDescription>New participants over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {participantStats.joinTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={participantStats.joinTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, 'New Participants']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No join trend data available
              </div>
            )}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Top Performers */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>Participants with the highest progress and points</CardDescription>
        </CardHeader>
        <CardContent>
          {participantStats.topPerformers.length > 0 ? (
            <div className="space-y-4">
              {participantStats.topPerformers.map((performer, index) => (
                <div key={performer.odId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{performer.odName || `Participant ${index + 1}`}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{performer.completedTasks} tasks</span>
                      <span>{performer.totalPoints} points</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{performer.progress}%</p>
                    <Progress value={performer.progress} className="w-24 h-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No participants yet
            </div>
          )}
        </CardContent>
      </EnhancedCard>
    </div>
  )
}


// ============ TASK ANALYTICS COMPONENT ============
function TaskAnalytics({ analytics }: { analytics: AnalyticsData }) {
  const { taskStats } = analytics

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Task Completion Rates */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Completion Rates
          </CardTitle>
          <CardDescription>Completion rate for each task in the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {taskStats.completionByTask.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStats.completionByTask} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis 
                    type="category" 
                    dataKey="title" 
                    width={150}
                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                    labelFormatter={(label) => `Day ${taskStats.completionByTask.find(t => t.title === label)?.day}: ${label}`}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No task data available
              </div>
            )}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Task Funnel / Drop-off Analysis */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Task Funnel
          </CardTitle>
          <CardDescription>Drop-off analysis between tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taskStats.taskFunnel.length > 0 ? (
              taskStats.taskFunnel.slice(0, 8).map((task, index) => (
                <div key={task.taskId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[200px]">Day {task.day}: {task.title}</span>
                    <span className="font-medium">{task.completedCount} ({task.completionRate}%)</span>
                  </div>
                  <div className="relative">
                    <Progress value={task.completionRate} className="h-2" />
                    {task.dropOffRate > 0 && (
                      <span className="absolute right-0 -top-5 text-xs text-red-500">
                        -{task.dropOffRate}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No funnel data available
              </div>
            )}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Difficult vs Easy Tasks */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Task Difficulty Analysis
          </CardTitle>
          <CardDescription>Most and least completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Most Difficult */}
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Most Challenging
              </h4>
              <div className="space-y-2">
                {taskStats.mostDifficultTasks.length > 0 ? (
                  taskStats.mostDifficultTasks.slice(0, 3).map((task) => (
                    <div key={task.taskId} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-sm truncate max-w-[180px]">Day {task.day}: {task.title}</span>
                      <Badge variant="destructive">{task.completionRate}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            {/* Easiest */}
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Most Completed
              </h4>
              <div className="space-y-2">
                {taskStats.easiestTasks.length > 0 ? (
                  taskStats.easiestTasks.slice(0, 3).map((task) => (
                    <div key={task.taskId} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm truncate max-w-[180px]">Day {task.day}: {task.title}</span>
                      <Badge className="bg-green-600">{task.completionRate}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Task Stats Summary */}
      <EnhancedCard className="lg:col-span-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{taskStats.totalTasks}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{taskStats.averageCompletionRate}%</p>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">
                {taskStats.completionByTask.filter(t => t.completionRate >= 80).length}
              </p>
              <p className="text-sm text-muted-foreground">High Completion (≥80%)</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">
                {taskStats.completionByTask.filter(t => t.completionRate < 50).length}
              </p>
              <p className="text-sm text-muted-foreground">Low Completion (&lt;50%)</p>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}

// ============ ENGAGEMENT ANALYTICS COMPONENT ============
function EngagementAnalytics({ analytics }: { analytics: AnalyticsData }) {
  const { engagementStats } = analytics

  const engagementMetrics = [
    { label: 'Views', value: engagementStats.views, icon: Eye, color: 'text-blue-600' },
    { label: 'Starts', value: engagementStats.starts, icon: Zap, color: 'text-yellow-600' },
    { label: 'Completes', value: engagementStats.completes, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Likes', value: engagementStats.likes, icon: Heart, color: 'text-red-600' },
    { label: 'Shares', value: engagementStats.shares, icon: Share2, color: 'text-purple-600' },
    { label: 'Bookmarks', value: engagementStats.bookmarks, icon: Bookmark, color: 'text-orange-600' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Engagement Metrics Grid */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engagement Metrics
          </CardTitle>
          <CardDescription>Overall engagement with the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {engagementMetrics.map((metric) => (
              <div key={metric.label} className="text-center p-4 bg-muted/50 rounded-lg">
                <metric.icon className={`h-6 w-6 mx-auto mb-2 ${metric.color}`} />
                <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Community Engagement */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Community Activity
          </CardTitle>
          <CardDescription>Posts and comments in the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>Total Posts</span>
              </div>
              <span className="text-xl font-bold">{engagementStats.totalPosts}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span>Total Comments</span>
              </div>
              <span className="text-xl font-bold">{engagementStats.totalComments}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-600" />
                <span>Total Likes</span>
              </div>
              <span className="text-xl font-bold">{engagementStats.totalLikes}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Avg Posts/Participant</span>
              </div>
              <span className="text-xl font-bold">{engagementStats.averagePostsPerParticipant}</span>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Activity Trend */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Trend
          </CardTitle>
          <CardDescription>Participant activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {engagementStats.activityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementStats.activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, 'Active Users']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No activity trend data available
              </div>
            )}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Posts Trend */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Posts Trend
          </CardTitle>
          <CardDescription>Community posts over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {engagementStats.postsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementStats.postsTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, 'Posts']}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No posts trend data available
              </div>
            )}
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}


// ============ REVENUE ANALYTICS COMPONENT ============
function RevenueAnalytics({ analytics }: { analytics: AnalyticsData }) {
  const { revenueStats, overview } = analytics

  const revenueBreakdown = [
    { name: 'Participation Fees', value: revenueStats.participationFees, fill: '#8b5cf6' },
    { name: 'Deposits', value: revenueStats.deposits, fill: '#06b6d4' },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Overview */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Financial performance of the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
              <Coins className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {revenueStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600/80">{revenueStats.currency}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-xl">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{overview.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Paying Participants</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-xl">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {revenueStats.averageRevenuePerParticipant.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Avg per Participant</p>
            </div>
            <div className="text-center p-6 bg-muted/50 rounded-xl">
              {revenueStats.isPremium ? (
                <>
                  <Award className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <Badge className="bg-yellow-600">Premium</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Challenge Type</p>
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <Badge variant="secondary">Standard</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Challenge Type</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Revenue Breakdown */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Revenue Breakdown
          </CardTitle>
          <CardDescription>Distribution of revenue sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {revenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ${revenueStats.currency}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No revenue data available
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {revenueBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Revenue Details */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Details
          </CardTitle>
          <CardDescription>Detailed breakdown of earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="font-medium">Participation Fees</p>
                <p className="text-sm text-muted-foreground">From {overview.totalParticipants} participants</p>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {revenueStats.participationFees.toLocaleString()} {revenueStats.currency}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <div>
                <p className="font-medium">Deposits Collected</p>
                <p className="text-sm text-muted-foreground">Refundable on completion</p>
              </div>
              <p className="text-xl font-bold text-cyan-600">
                {revenueStats.deposits.toLocaleString()} {revenueStats.currency}
              </p>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {revenueStats.totalRevenue.toLocaleString()} {revenueStats.currency}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Revenue Projections */}
      <EnhancedCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Insights
          </CardTitle>
          <CardDescription>Key financial metrics and projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Conversion Potential</h4>
              <p className="text-lg font-semibold">
                {overview.completionRate >= 70 ? 'High' : overview.completionRate >= 40 ? 'Medium' : 'Low'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {overview.completionRate}% completion rate
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Participant Value</h4>
              <p className="text-lg font-semibold">
                {revenueStats.averageRevenuePerParticipant.toLocaleString()} {revenueStats.currency}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Average revenue per participant
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Growth Opportunity</h4>
              <p className="text-lg font-semibold">
                {((100 - overview.completionRate) * overview.totalParticipants / 100).toFixed(0)} participants
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Could still complete the challenge
              </p>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}

// ============ LOADING SKELETON ============
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <EnhancedCard key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </EnhancedCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <EnhancedCard key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </EnhancedCard>
        ))}
      </div>
    </div>
  )
}
