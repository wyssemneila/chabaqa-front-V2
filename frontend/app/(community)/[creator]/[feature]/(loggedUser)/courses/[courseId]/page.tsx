"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CoursePlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-player"
import EnrollCourseDialog from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/EnrollCourseDialog"
import { coursesApi } from "@/lib/api/courses.api"
import { transformCourse } from "@/lib/api/courses-community.api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useCourseSession } from "@/hooks/use-course-session"
import { PaymentProviderModal } from "@/components/payment-provider-modal"
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal"

type CoursePlayerPageProps = {
  params: Promise<{ creator: string; feature: string; courseId: string }>
}

export default function CoursePlayerPage({ params }: CoursePlayerPageProps) {
  const { creator, feature, courseId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [course, setCourse] = useState<any | null>(null)
  const [enrollment, setEnrollment] = useState<any | null>(null)
  const [unlockedChapters, setUnlockedChapters] = useState<any[] | null>(null)
  const [sequentialProgressionEnabled, setSequentialProgressionEnabled] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined)
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [requestedChapterId, setRequestedChapterId] = useState<string | null>(null)
  const [pendingPaidChapterId, setPendingPaidChapterId] = useState<string | null>(null)
  const [chapterUnlockState, setChapterUnlockState] = useState<"idle" | "syncing" | "unlocked" | "timeout">("idle")

  const trackingSentRef = useMemo(
    () => ({ view: false, start: false }),
    [],
  )

  const unwrapApiPayload = (response: any) => {
    if (!response || typeof response !== "object") return response
    return response.data ?? response
  }

  // ── Centralized course session hook ─────────────────────────────────────
  const resolvedCourseIdForSession = String(course?.mongoId || courseId)
  const courseSession = useCourseSession(resolvedCourseIdForSession, {
    initialEnrollment: enrollment,
    onRefreshEnrollment: async () => {
      await refreshEnrollmentProgress(resolvedCourseIdForSession, course)
    },
  })

  const coursePagePaymentModal = usePaymentProviderModal({
    initStripe: () => (coursesApi as any).initStripePayment(String(course?.mongoId || courseId), undefined),
    onError: (err: any) => toast({ title: "Checkout failed", description: err?.message || "Please try again.", variant: "destructive" }),
  })

  const refreshEnrollmentProgress = async (
    resolvedCourseId: string,
    courseForFallback?: { mongoId?: string; id?: string } | null,
  ) => {
    let enrollmentProgress = await coursesApi.getCourseEnrollmentProgress(resolvedCourseId).catch(() => null)
    let payload = unwrapApiPayload(enrollmentProgress)
    let rawEnrollment = (payload as any)?.enrollment || null

    // If no enrollment and we have both ids, retry with the other id (handles backend id mismatch)
    if (!rawEnrollment && courseForFallback?.mongoId && courseForFallback?.id) {
      const otherId =
        resolvedCourseId === String(courseForFallback.mongoId)
          ? String(courseForFallback.id)
          : String(courseForFallback.mongoId)
      const retryProgress = await coursesApi.getCourseEnrollmentProgress(otherId).catch(() => null)
      const retryPayload = unwrapApiPayload(retryProgress)
      const retryEnrollment = (retryPayload as any)?.enrollment || null
      if (retryEnrollment) {
        enrollmentProgress = retryProgress
        payload = retryPayload
        rawEnrollment = retryEnrollment
      }
    }

    const progressPercentage = (payload as any)?.progress || 0
    const normalizedEnrollment = rawEnrollment
      ? {
          ...rawEnrollment,
          progress: rawEnrollment.progression ?? [],
          progressPercentage: progressPercentage,
        }
      : null

    setEnrollment(normalizedEnrollment)
    setIsEnrolled(Boolean(normalizedEnrollment))
    return normalizedEnrollment
  }

  const refreshUnlockedChapters = async (resolvedCourseId: string) => {
    const unlockedResponse = await coursesApi.getUnlockedChapters(resolvedCourseId).catch(() => null)
    const unlocked = unwrapApiPayload(unlockedResponse)
    const unlockedList = (unlocked as any)?.unlockedChapters || null
    const sequentialEnabled = Boolean((unlocked as any)?.sequentialProgressionEnabled)
    const unlockMsg = (unlocked as any)?.unlockMessage
    const normalizedUnlockedList = Array.isArray(unlockedList) ? unlockedList : null

    setUnlockedChapters(normalizedUnlockedList)
    setSequentialProgressionEnabled(sequentialEnabled)
    setUnlockMessage(typeof unlockMsg === "string" ? unlockMsg : undefined)

    return {
      unlockedChapters: normalizedUnlockedList,
      sequentialProgressionEnabled: sequentialEnabled,
      unlockMessage: typeof unlockMsg === "string" ? unlockMsg : undefined,
    }
  }

  const refreshProgress = async (
    resolvedCourseId: string,
    courseForFallback?: { mongoId?: string; id?: string } | null,
  ) => {
    const normalizedEnrollment = await refreshEnrollmentProgress(resolvedCourseId, courseForFallback)
    await refreshUnlockedChapters(resolvedCourseId)
    // Also refresh the centralized session
    await courseSession.refreshSession().catch(() => {})
    return normalizedEnrollment
  }

  const clearCheckoutParams = () => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    url.searchParams.delete("paidChapterId")
    url.searchParams.delete("checkout")
    url.searchParams.delete("sessionId")
    window.history.replaceState({}, "", `${url.pathname}${url.search}`)
  }

  const consumePendingCheckoutFromStorage = (): string | null => {
    if (typeof window === "undefined") return null
    const raw = sessionStorage.getItem("pending_chapter_checkout")
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      const createdAt = Number(parsed?.createdAt || 0)
      const chapterId = parsed?.chapterId ? String(parsed.chapterId) : null
      const maxAgeMs = 30 * 60 * 1000
      sessionStorage.removeItem("pending_chapter_checkout")
      if (!chapterId) return null
      if (!createdAt || Date.now() - createdAt > maxAgeMs) return null
      return chapterId
    } catch {
      sessionStorage.removeItem("pending_chapter_checkout")
      return null
    }
  }

  const runChapterUnlockReconciliation = async (chapterId: string): Promise<boolean> => {
    const resolvedCourseId = String(course?.mongoId || courseId)
    const delays = [0, 1000, 2000, 3000, 4000, 5000]
    setChapterUnlockState("syncing")
    for (const delay of delays) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      try {
        const [, unlockedSnapshot, sessionRaw] = await Promise.all([
          refreshEnrollmentProgress(resolvedCourseId, course),
          refreshUnlockedChapters(resolvedCourseId),
          coursesApi.getCourseSession(resolvedCourseId, chapterId).catch(() => null),
        ])
        void courseSession.refreshSession().catch(() => {})

        const session = unwrapApiPayload(sessionRaw)
        const unlockedByList = Boolean(
          unlockedSnapshot.unlockedChapters?.some(
            (chapter: any) => String(chapter?.id) === String(chapterId) && Boolean(chapter?.isUnlocked),
          ),
        )
        const unlockedBySession = Boolean(
          (session as any)?.chapters?.some(
            (chapter: any) => String(chapter?.chapterId) === String(chapterId) && Boolean(chapter?.canAccess),
          ),
        )

        if (unlockedByList || unlockedBySession) {
          setPendingPaidChapterId(chapterId)
          setChapterUnlockState("unlocked")
          clearCheckoutParams()
          return true
        }
      } catch {
        // continue polling window
      }
    }
    setPendingPaidChapterId(chapterId)
    setChapterUnlockState("timeout")
    return false
  }

  const refreshCourse = async () => {
    try {
      console.log('Refreshing course data...')
      const rawCourse = await coursesApi.getCoursById(String(courseId))
      console.log('Raw course from API:', rawCourse)
      const normalizedCourse = rawCourse ? transformCourse(rawCourse) : null
      console.log('Normalized course:', normalizedCourse)
      setCourse(normalizedCourse)

      // Track a course view for creator analytics (best-effort)
      if (!trackingSentRef.view) {
        trackingSentRef.view = true
        const trackingId = String(normalizedCourse?.id || courseId)
        void coursesApi.trackView(trackingId).catch(() => {
          // ignore tracking failures
        })
      }
    } catch (error) {
      console.error("Failed to refresh course:", error)
    }
  }

  const handleEnrollmentRequest = async (options?: {
    openPaymentModal?: boolean
    targetChapterId?: string
    targetChapterPaid?: boolean
    source?: "sidebar-next" | "player-lock" | "manual"
  }) => {
    if (!course) return

    const resolvedCourseId = String(course.mongoId || courseId)
    const targetChapterId = options?.targetChapterId ? String(options.targetChapterId) : undefined
    const targetChapterPaid = Boolean(options?.targetChapterPaid)
    const allCourseChapters = Array.isArray(course?.sections)
      ? course.sections.flatMap((section: any) => (Array.isArray(section?.chapters) ? section.chapters : []))
      : []
    const targetChapter = targetChapterId
      ? allCourseChapters.find((chapter: any) => String(chapter?.id) === String(targetChapterId))
      : null
    const chapterRequiresPayment = targetChapter
      ? Boolean(targetChapter?.isPaidChapter)
      : targetChapterPaid
    console.info("[CourseNextFlow] handleEnrollmentRequest", {
      source: options?.source,
      targetChapterId,
      targetChapterPaid: chapterRequiresPayment,
      openPaymentModal: options?.openPaymentModal,
      resolvedCourseId,
    })
    let hasExistingEnrollment = false

    // Before any paid flow: re-fetch enrollment so we never redirect to Stripe if user is already enrolled
    try {
      const progressRes = await coursesApi.getCourseEnrollmentProgress(resolvedCourseId).catch(() => null)
      const progressPayload = unwrapApiPayload(progressRes)
      const existingEnrollment = (progressPayload as any)?.enrollment ?? null
      if (existingEnrollment) {
        hasExistingEnrollment = true
        console.info("[CourseNextFlow] Existing enrollment found")
        await refreshProgress(resolvedCourseId, course)
      }
    } catch (_) {
      // Continue to paid or free flow if re-fetch fails
    }

    // Chapter-driven flow (independent from course-level price).
    if (targetChapterId) {
      if (chapterRequiresPayment) {
        try {
          setIsEnrolling(true)
          console.info("[CourseNextFlow] Redirecting to chapter payment", { targetChapterId })
          toast({ title: "Redirecting to chapter payment...", description: "Taking you to secure checkout." })
          const result = await coursesApi.initChapterStripePayment(resolvedCourseId, targetChapterId)
          const checkoutUrl = result?.data?.checkoutUrl ?? result?.checkoutUrl
          if (checkoutUrl) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem(
                "pending_chapter_checkout",
                JSON.stringify({
                  courseId: resolvedCourseId,
                  chapterId: targetChapterId,
                  createdAt: Date.now(),
                }),
              )
            }
            window.location.href = checkoutUrl
            return
          }
          throw new Error("Unable to start chapter checkout. Please try again.")
        } catch (error) {
          toast({
            title: "Checkout failed",
            description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsEnrolling(false)
        }
        return
      }

      // Free next chapter: enroll directly and navigate to requested chapter.
      try {
        setIsEnrolling(true)
        console.info("[CourseNextFlow] Free chapter path; enrolling directly", {
          targetChapterId,
          hasExistingEnrollment,
        })
        if (!hasExistingEnrollment) {
          toast({
            title: "Enrolling...",
            description: "Please wait while we enroll you in this course.",
          })
          const enrollResponse = await coursesApi.enroll(resolvedCourseId)
          const response = unwrapApiPayload(enrollResponse)
          const enrolledFromResponse = (response as any)?.enrollment || null
          if (enrolledFromResponse) {
            // Optimistic state so requested chapter selection can proceed immediately.
            setEnrollment((current: any | null) =>
              current || {
                ...enrolledFromResponse,
                progress: Array.isArray(enrolledFromResponse?.progression)
                  ? enrolledFromResponse.progression
                  : [],
                progressPercentage: 0,
              },
            )
            setIsEnrolled(true)
          }
          toast({
            title: "Enrolled successfully",
            description: (response as any)?.message || "You now have access to this course.",
          })
        }
        const refreshedEnrollment = await refreshProgress(resolvedCourseId, course)
        console.info("[CourseNextFlow] Enrollment/progress refresh complete; requesting chapter selection", {
          targetChapterId,
          hasEnrollment: Boolean(refreshedEnrollment),
        })
        setRequestedChapterId(targetChapterId)
      } catch (error) {
        console.error("[CourseNextFlow] Free chapter enrollment failed", error)
        toast({
          title: "Enrollment failed",
          description: typeof error === "object" && error && "message" in error
            ? String((error as any).message)
            : "Failed to enroll. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsEnrolling(false)
      }
      return
    }

    // Generic full-course purchase flow kept for explicit purchase UI.
    const isPaid = Number(course.price ?? 0) > 0
    if (isPaid) {
      const openModal = options?.openPaymentModal === true
      if (openModal) {
        setIsEnrollDialogOpen(true)
        return
      }
      try {
        setIsEnrolling(true)
        toast({ title: "Redirecting to payment...", description: "Taking you to secure checkout." })
        setIsEnrolling(false)
        coursePagePaymentModal.open()
      } catch (error) {
        toast({
          title: "Checkout failed",
          description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsEnrolling(false)
      }
      return
    }

    // Free course - enroll directly
    try {
      setIsEnrolling(true)
      toast({
        title: "Enrolling...",
        description: "Please wait while we enroll you in this course.",
      })

      const response = await coursesApi.enroll(resolvedCourseId)
      const enrollPayload = unwrapApiPayload(response)

      toast({
        title: "Enrolled successfully",
        description: (enrollPayload as any)?.message || "You now have access to this course.",
      })

      await refreshProgress(resolvedCourseId, course)
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: typeof error === "object" && error && "message" in error
          ? String((error as any).message)
          : "Failed to enroll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const rawCourse = await coursesApi.getCoursById(String(courseId))
        if (!isActive) return

        const normalizedCourse = rawCourse ? transformCourse(rawCourse) : null
        const resolvedCourseId = String(normalizedCourse?.mongoId || courseId)

        setCourse(normalizedCourse)
        if (!trackingSentRef.view) {
          trackingSentRef.view = true
          const trackingId = String(normalizedCourse?.id || courseId)
          void coursesApi.trackView(trackingId).catch(() => {
            // ignore tracking failures
          })
        }
        await refreshProgress(resolvedCourseId, normalizedCourse)
      } catch (error) {
        if (!isActive) return
        const message =
          typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message ?? "Failed to load course")
            : "Failed to load course"
        setErrorMessage(message)
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      isActive = false
    }
  }, [courseId])

  useEffect(() => {
    const fromQuery = searchParams.get("paidChapterId")
    const shouldReconcile = searchParams.get("checkout") === "success" || Boolean(fromQuery)
    if (!shouldReconcile) return
    const chapterId = fromQuery || consumePendingCheckoutFromStorage()
    if (!chapterId) return
    void runChapterUnlockReconciliation(String(chapterId))
  }, [searchParams, course?.mongoId, courseId])

  // Only show a status block for loading, error, or course not found. Never block with "Enrollment Required" — always show the course player.
  const status = useMemo(() => {
    if (isLoading) return { title: "Loading...", description: "" }
    if (errorMessage) return { title: "Failed to load course", description: errorMessage }
    if (!course || !course.id) return { title: "Course not found", description: "This course may be unpublished or no longer exists." }
    return null
  }, [isLoading, errorMessage, course])

  if (status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="rounded-lg border bg-white p-6">
            <div className="text-lg font-semibold">{status.title}</div>
            {status.description ? (
              <div className="mt-2 text-sm text-muted-foreground">{status.description}</div>
            ) : null}
            {status.title === "Course not found" && (
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={`/${creator}/${feature}/courses`}>View Courses</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PaymentProviderModal
        open={coursePagePaymentModal.isOpen}
        onOpenChange={coursePagePaymentModal.close}
        onSelect={coursePagePaymentModal.handleSelect}
      />
      <CoursePlayer
        creatorSlug={creator}
        slug={feature}
        courseId={String(course?.mongoId || courseId)}
        course={course}
        enrollment={enrollment}
        unlockedChapters={unlockedChapters}
        sequentialProgressionEnabled={sequentialProgressionEnabled}
        unlockMessage={unlockMessage}
        courseSession={courseSession}
        onRefreshCourse={refreshCourse}
        onRefreshProgress={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshEnrollmentProgress(resolvedCourseId, course)
        }}
        onRefreshUnlockedChapters={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshUnlockedChapters(resolvedCourseId)
        }}
        onOpenEnrollment={handleEnrollmentRequest}
        requestedChapterId={requestedChapterId}
        onRequestedChapterConsumed={(chapterId) => {
          setRequestedChapterId((current) => (current === chapterId ? null : current))
        }}
        pendingPaidChapterId={pendingPaidChapterId}
        chapterUnlockState={chapterUnlockState}
        onRetryUnlock={
          pendingPaidChapterId
            ? async () => {
                await runChapterUnlockReconciliation(pendingPaidChapterId)
              }
            : undefined
        }
      />

      <EnrollCourseDialog
        open={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
        course={course}
        isEnrolled={Boolean(isEnrolled)}
        onEnrolled={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshProgress(resolvedCourseId, course)
        }}
      />
    </>
  )
}
