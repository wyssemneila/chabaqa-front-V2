"use client"

import React, { useEffect, useMemo, useState } from "react"

type WatermarkStrength = "subtle" | "normal"

interface ChabaqaLogoWatermarkProps {
  enabled?: boolean
  logoSrc?: string
  strength?: WatermarkStrength
}

type WatermarkPosition = {
  topPct: number
  leftPct: number
}

const MIN_MOVE_INTERVAL_MS = 25000
const MAX_MOVE_INTERVAL_MS = 35000

const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const getRandomPosition = (): WatermarkPosition => {
  // Keep the moving logo away from extreme edges so it remains visible.
  return {
    topPct: randomInRange(8, 78),
    leftPct: randomInRange(6, 82),
  }
}

export function ChabaqaLogoWatermark({
  enabled = true,
  logoSrc = "/Logos/PNG/brandmark.png",
  strength = "subtle",
}: ChabaqaLogoWatermarkProps) {
  const [position, setPosition] = useState<WatermarkPosition>(() => getRandomPosition())
  const [resolvedLogoSrc, setResolvedLogoSrc] = useState(logoSrc)

  useEffect(() => {
    setResolvedLogoSrc(logoSrc)
  }, [logoSrc])

  useEffect(() => {
    if (!enabled) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const scheduleMove = () => {
      const nextDelay = randomInRange(MIN_MOVE_INTERVAL_MS, MAX_MOVE_INTERVAL_MS)
      timeoutId = setTimeout(() => {
        if (cancelled) return
        setPosition(getRandomPosition())
        scheduleMove()
      }, nextDelay)
    }

    setPosition(getRandomPosition())
    scheduleMove()

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [enabled])

  const stylePreset = useMemo(() => {
    if (strength === "normal") {
      return {
        movingOpacity: 0.12,
      }
    }

    return {
      movingOpacity: 0.08,
    }
  }, [strength])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      data-testid="chabaqa-watermark"
      className="absolute inset-0 z-10 overflow-hidden pointer-events-none select-none"
    >
      <img
        src={resolvedLogoSrc}
        alt=""
        className="absolute h-[76px] w-[76px] object-contain transition-all duration-1000"
        style={{
          top: `${position.topPct}%`,
          left: `${position.leftPct}%`,
          opacity: stylePreset.movingOpacity,
          filter: "grayscale(1)",
        }}
        onError={() => {
          if (resolvedLogoSrc !== "/logo_chabaqa.png") {
            setResolvedLogoSrc("/logo_chabaqa.png")
          }
        }}
      />
    </div>
  )
}
