"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: React.ComponentType<{ size?: number }>
  relatedIds: number[]
  status: "completed" | "in-progress" | "pending"
  energy: number
  image?: string
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[]
  logoSrc?: string
  className?: string
  /** idle drift (deg per 50ms tick) when nothing is selected */
  autoRotateSpeed?: number
  /** initial/target orbit radius; responsive computed from container */
  orbitRadius?: number
  /** where the selected node lands (270 = top) */
  focusAlignAngle?: number
  /** UNUSED now (replaced by eased animator), kept for API compatibility */
  speedDps?: number
}

export default function RadialOrbitalTimeline({
  timelineData,
  logoSrc = "/Logos/PNG/brandmark.png",
  className,
  autoRotateSpeed = 0.3,
  orbitRadius = 200,
  focusAlignAngle = 270,
  speedDps = 320, // kept for backward compatibility; not used by eased animator
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [rotationAngle, setRotationAngle] = useState<number>(0) // degrees
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [radius, setRadius] = useState<number>(orbitRadius)
  const [dragging, setDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startAngle, setStartAngle] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)

  // ---------- math helpers ----------
  const norm360 = (a: number) => ((a % 360) + 360) % 360
  const shortestDelta = (from: number, to: number) => {
    const f = norm360(from)
    const t = norm360(to)
    let d = t - f
    if (d > 180) d -= 360
    if (d < -180) d += 360
    return d
  }
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
    outMin + ((clamp(v, inMin, inMax) - inMin) * (outMax - outMin)) / (inMax - inMin)

  // easing
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  // ---------- eased animation state ----------
  const animRaf = useRef<number | null>(null)
  const animStartTime = useRef<number>(0)
  const animFrom = useRef<number>(0)
  const animTo = useRef<number>(0)
  const animSettling = useRef<boolean>(false)

  const cancelAnim = useCallback(() => {
    if (animRaf.current != null) cancelAnimationFrame(animRaf.current)
    animRaf.current = null
    animSettling.current = false
  }, [])

  // start an eased rotation to an absolute angle
  const animateToAngle = useCallback(
    (absAngle: number) => {
      const from = rotationAngle
      const toAbs = norm360(absAngle)
      const delta = shortestDelta(from, toAbs)
      const distance = Math.abs(delta)

      // duration scales with distance: 260–700ms for 0–180°
      const duration = map(distance, 0, 180, 260, 700)

      // subtle overshoot when distance is noticeable
      const overshoot = distance > 25 ? Math.min(12, distance * 0.08) : 0
      const signedOvershoot = Math.sign(delta) * overshoot

      cancelAnim()

      // phase 1: move to overshoot target
      animStartTime.current = performance.now()
      animFrom.current = from
      animTo.current = norm360(from + delta + signedOvershoot)
      animSettling.current = overshoot > 0

      const step = (now: number) => {
        const t = clamp((now - animStartTime.current) / duration, 0, 1)
        const eased = easeInOutCubic(t)
        const path = shortestDelta(animFrom.current, animTo.current)
        const current = norm360(animFrom.current + path * eased)
        setRotationAngle(current)

        if (t < 1) {
          animRaf.current = requestAnimationFrame(step)
          return
        }

        // phase 2: settle back from overshoot to exact target
        if (animSettling.current) {
          animSettling.current = false
          animStartTime.current = performance.now()
          animFrom.current = current
          animTo.current = toAbs
          const settleDuration = clamp(duration * 0.35, 120, 260)

          const settleStep = (now2: number) => {
            const t2 = clamp((now2 - animStartTime.current) / settleDuration, 0, 1)
            const eased2 = easeInOutCubic(t2)
            const path2 = shortestDelta(animFrom.current, animTo.current)
            const cur2 = norm360(animFrom.current + path2 * eased2)
            setRotationAngle(cur2)
            if (t2 < 1) {
              animRaf.current = requestAnimationFrame(settleStep)
            } else {
              animRaf.current = null
            }
          }

          animRaf.current = requestAnimationFrame(settleStep)
        } else {
          animRaf.current = null
        }
      }

      animRaf.current = requestAnimationFrame(step)
    },
    [rotationAngle, cancelAnim],
  )

  // ---------- environment ----------
  // respect reduced motion
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduced) setAutoRotate(false)
  }, [])

  // responsive radius
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      const pad = 80
      const minDim = Math.min(rect.width, rect.height)
      const computed = Math.max(90, Math.min(minDim / 2 - pad, 260))
      setRadius(computed)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // idle autorotate (very slow)
  useEffect(() => {
    if (!autoRotate) return
    const id = setInterval(() => {
      if (animRaf.current == null) {
        setRotationAngle((prev) => norm360(prev + autoRotateSpeed))
      }
    }, 50)
    return () => clearInterval(id)
  }, [autoRotate, autoRotateSpeed])

  // ---------- selection / centering ----------
  // compute target for a node to be at focusAlignAngle (default top)
  const centerViewOnNode = useCallback(
    (nodeId: number) => {
      const idx = timelineData.findIndex((i) => i.id === nodeId)
      if (idx < 0) return
      const total = timelineData.length
      const nodeAngle = (idx / total) * 360 // absolute angle for node at 0°
      const desired = focusAlignAngle - nodeAngle // rotate world so node lands at focus
      animateToAngle(desired)
    },
    [timelineData, focusAlignAngle, animateToAngle],
  )

  const toggleItem = useCallback(
    (id: number) => {
      setExpandedItems((prev) => {
        const open = !prev[id]
        const next: Record<number, boolean> = {}
        if (open) {
          next[id] = true
          setAutoRotate(false)
          centerViewOnNode(id) // smooth eased rotation to focus
        } else {
          setAutoRotate(true)
        }
        return next
      })
    },
    [centerViewOnNode],
  )

  // ---------- layout ----------
  const calculateNodePosition = useCallback(
    (index: number, total: number) => {
      const angle = ((index / total) * 360 + rotationAngle) % 360
      const rad = (angle * Math.PI) / 180
      const x = +(radius * Math.cos(rad)).toFixed(2)
      const y = +(radius * Math.sin(rad)).toFixed(2)
      const zIndex = Math.round(100 + 50 * Math.cos(rad))
      const scale = +Math.max(0.85, 0.85 + 0.15 * ((1 + Math.sin(rad)) / 2)).toFixed(2)
      return { x, y, zIndex, scale }
    },
    [rotationAngle, radius],
  )

  // ---------- interactions: drag to rotate ----------
  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnim()
    setDragging(true)
    setAutoRotate(false)
    setStartX(e.clientX)
    setStartAngle(rotationAngle)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - startX
    const delta = (dx / Math.max(radius, 1)) * (180 / Math.PI)
    setRotationAngle(norm360(startAngle + delta))
  }
  const onPointerUp = () => {
    setDragging(false)
    if (Object.keys(expandedItems).length === 0) setAutoRotate(true)
  }

  // close on click outside
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({})
      setAutoRotate(true)
    }
  }, [])

  const hasExpanded = Object.keys(expandedItems).length > 0

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden",
        "[--node:clamp(32px,6vw,44px)] [--card-w:clamp(220px,80vw,320px)]",
        className,
      )}
      role="application"
      aria-label="Circular timeline with expandable nodes"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          ref={orbitRef}
          className="absolute w-full h-full flex items-center justify-center"
          style={{ perspective: "1000px" }}
        >
          {/* center logo */}
          <div
            className={cn(
              "absolute rounded-full flex items-center justify-center",
              "shadow-[#8e78fb] shadow-md",
              "transition-[transform,box-shadow] duration-300",
              hasExpanded ? "scale-[1.03]" : "scale-100",
            )}
            style={{ width: "clamp(72px,12vw,112px)", height: "clamp(72px,12vw,112px)" }}
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="object-contain rounded-full bg-white p-2"
              style={{ width: "clamp(56px,10vw,96px)", height: "clamp(56px,10vw,96px)" }}
            />
          </div>

          {/* orbit ring */}
          <div
            className={cn(
              "absolute rounded-full border transition-[box-shadow,border-color] duration-300",
              hasExpanded ? "border-[#8e78fb] shadow-[0_0_0_2px_rgba(142,120,251,0.15)]" : "border-[#8e78fb]/70",
            )}
            style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
          />

          {/* nodes */}
          {timelineData.map((item, i) => {
            const pos = calculateNodePosition(i, timelineData.length)
            const isExpanded = !!expandedItems[item.id]
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={cn(
                  "absolute select-none cursor-pointer will-change-transform",
                  "transition-[transform,opacity,filter] duration-300 ease-out",
                )}
                style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, zIndex: isExpanded ? 200 : pos.zIndex }}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
              >
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transform-gpu",
                    "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-out",
                    isExpanded
                      ? "bg-[#8e78fb] text-white border-[#8e78fb] shadow-[0_10px_30px_rgba(142,120,251,0.35)] scale-[1.06]"
                      : "bg-white text-gray-700 border-[#8e78fb] hover:bg-[#8e78fb]/10 hover:border-[#8e78fb] hover:text-[#8e78fb]",
                  )}
                  style={{ width: "var(--node)", height: "var(--node)", transform: `scale(${pos.scale})` }}
                  aria-label={item.title}
                >
                  <Icon size={Math.max(14, Math.min(18, Math.round(radius / 14)))} />
                </div>

                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 text-[11px] sm:text-xs font-medium text-center whitespace-nowrap",
                    "transition-opacity duration-300",
                    isExpanded ? "text-gray-900 opacity-100" : "text-gray-500 opacity-90",
                  )}
                  style={{ top: `calc(var(--node) + 10px)` }}
                >
                  {item.title}
                </div>

                {isExpanded && (
                                  <Card
                                    className="absolute left-1/2 -translate-x-1/2 bg-white border shadow-2xl shadow-[#8e78fb]/20 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden max-h-[60vh] sm:max-h-none"
                                    style={{ top: `calc(var(--node) + 28px)`, width: "clamp(200px, 64vw, 320px)" }}
                                  >
                    <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-r from-[#8e78fb]/5 to-[#47c7ea]/5">
                      <p className="text-[11px] sm:text-xs md:text-sm text-[#8e78fb] font-semibold">{item.date}</p>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      {item.image && (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden border border-gray-200">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 380px"
                          />
                        </div>
                      )}
                      <div className="max-h-[40vh] overflow-y-auto overscroll-contain pr-1">
                        <p className="text-xs sm:text-sm leading-relaxed text-gray-700">{item.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
