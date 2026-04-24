"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react"
import type { Community } from "@/lib/api/types"

interface CommunityContextValue {
    selectedCommunity: Community | null
    setSelectedCommunity: (community: Community | null) => void
    selectedCommunityId: string | null
    isLoading: boolean
}

const CommunityContext = createContext<CommunityContextValue | undefined>(undefined)

const STORAGE_KEY = "creator_selected_community_id"

export function CommunityProvider({ children }: { children: ReactNode }) {
    const [selectedCommunity, setSelectedCommunityState] = useState<Community | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedId = localStorage.getItem(STORAGE_KEY)
            if (savedId) {
                // The sidebar will handle fetching and setting the actual community object
                // We just initialize with the ID to preserve the selection
            }
        }
        setIsLoading(false)
    }, [])

    const setSelectedCommunity = (community: Community | null) => {
        setSelectedCommunityState(community)
        if (typeof window !== "undefined") {
            if (community) {
                localStorage.setItem(STORAGE_KEY, community.id)
            } else {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    }

    const selectedCommunityId = selectedCommunity?.id || null

    const value = useMemo(
        () => ({
            selectedCommunity,
            setSelectedCommunity,
            selectedCommunityId,
            isLoading,
        }),
        [selectedCommunity, isLoading]
    )

    return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunityContext() {
    const context = useContext(CommunityContext)
    if (!context) {
        throw new Error("useCommunityContext must be used within CommunityProvider")
    }
    return context
}
