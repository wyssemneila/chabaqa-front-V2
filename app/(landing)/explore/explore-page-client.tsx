"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthContext } from "@/app/providers/auth-provider"
import {
  communitiesApi,
  coursesApi,
  challengesApi,
  productsApi,
  sessionsApi,
  eventsApi,
} from "@/lib/api"
import { FeaturedCommunities } from "@/app/(landing)/(communities)/components/featured-communities"
import { CommunitiesSearchSection } from "@/app/(landing)/(communities)/components/communities-search-section"
import { CommunitiesCTA } from "@/app/(landing)/(communities)/components/communities-cta"
import { Explore } from "@/lib/data-communities"
import {
  buildExploreAccessSnapshot,
  createEmptyExploreAccessSnapshot,
  enrichExploreItemsWithAccess,
  type ExploreAccessSnapshot,
} from "./explore-access"

interface ExplorePageClientProps {
    communities: Explore[]
}

export function ExplorePageClient({ communities }: ExplorePageClientProps) {
    const { user, isAuthenticated, loading: authLoading } = useAuthContext()
    const [accessSnapshot, setAccessSnapshot] = useState<ExploreAccessSnapshot>(
        () => createEmptyExploreAccessSnapshot(),
    )

    // Fetch joined/access snapshots when authenticated.
    useEffect(() => {
        let isMounted = true

        async function fetchAccessSnapshot() {
            if (!isAuthenticated || !user) {
                if (isMounted) {
                    setAccessSnapshot(createEmptyExploreAccessSnapshot())
                }
                return
            }

            try {
                const [
                    joinedCommunities,
                    courseEnrollments,
                    challengeParticipations,
                    productPurchases,
                    sessionBookings,
                    eventRegistrations,
                ] = await Promise.allSettled([
                    communitiesApi.getMyJoined(),
                    coursesApi.getMyEnrollments(),
                    challengesApi.getMyParticipations(),
                    productsApi.getMyPurchases(),
                    sessionsApi.getUserBookings(),
                    eventsApi.getMyRegistrations(),
                ])

                const snapshot = buildExploreAccessSnapshot({
                    joinedCommunities: joinedCommunities.status === "fulfilled" ? joinedCommunities.value : undefined,
                    courseEnrollments: courseEnrollments.status === "fulfilled" ? courseEnrollments.value : undefined,
                    challengeParticipations: challengeParticipations.status === "fulfilled" ? challengeParticipations.value : undefined,
                    productPurchases: productPurchases.status === "fulfilled" ? productPurchases.value : undefined,
                    sessionBookings: sessionBookings.status === "fulfilled" ? sessionBookings.value : undefined,
                    eventRegistrations: eventRegistrations.status === "fulfilled" ? eventRegistrations.value : undefined,
                })

                if (isMounted) {
                    setAccessSnapshot(snapshot)
                }
            } catch (error) {
                console.error("Failed to fetch explore access snapshot:", error)
                if (isMounted) {
                    setAccessSnapshot(createEmptyExploreAccessSnapshot())
                }
            }
        }

        if (!authLoading) {
            fetchAccessSnapshot()
        }

        return () => {
            isMounted = false
        }
    }, [isAuthenticated, user, authLoading])

    // Enrich items with membership and strict access flags.
    const enrichedCommunities = useMemo(() => {
        return enrichExploreItemsWithAccess(communities, accessSnapshot)
    }, [communities, accessSnapshot])

    return (
        <>
            <FeaturedCommunities communities={enrichedCommunities} />
            <CommunitiesSearchSection communities={enrichedCommunities} />
            <CommunitiesCTA />
        </>
    )
}
