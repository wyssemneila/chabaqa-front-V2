"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"

const GREETINGS = ["مرحبا", "Hello", "bonjour", "Ciao", "Olà", "やあ", "Guten tag", "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ"]
const LANDING_INTRO_SESSION_KEY = "chabaqa:landing-intro-seen"
const LANDING_INTRO_WINDOW_MARKER = "__chabaqa_landing_intro_seen__"

function hasSeenLandingIntro(): boolean {
  // sessionStorage is the normal per-tab store. window.name is a small
  // per-tab fallback because auth cleanup deliberately clears sessionStorage.
  return window.sessionStorage.getItem(LANDING_INTRO_SESSION_KEY) === "true" ||
    window.name.includes(LANDING_INTRO_WINDOW_MARKER)
}

function markLandingIntroSeen(): void {
  window.sessionStorage.setItem(LANDING_INTRO_SESSION_KEY, "true")
  if (!window.name.includes(LANDING_INTRO_WINDOW_MARKER)) {
    window.name = `${window.name}${LANDING_INTRO_WINDOW_MARKER}`
  }
}

/**
 * The full landing-page intro is deliberately mounted by the homepage only.
 * Other routes continue to use the compact global loading screen.
 */
export function MainLandingPreloader() {
  const rootRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const [visible, setVisible] = useState(true)

  useLayoutEffect(() => {
    const root = rootRef.current
    const word = wordRef.current
    const logo = logoRef.current
    const content = document.getElementById("landing-page-content")
    if (!root || !word || !logo || !content) return

    // sessionStorage is unique to this browser tab and survives reloads/navigation
    // within it, so a new tab still receives the full welcome sequence.
    if (hasSeenLandingIntro()) {
      setVisible(false)
      return
    }
    markLandingIntroSeen()

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const context = gsap.context(() => {
      gsap.set(content, { autoAlpha: 0 })
      gsap.set(logo, { autoAlpha: 0 })

      if (reduceMotion) {
        gsap.set(content, { autoAlpha: 1 })
        setVisible(false)
        return
      }

      const timeline = gsap.timeline({
        onComplete: () => setVisible(false),
      })

      // A short clean pause gives the sequence a deliberate opening beat.
      timeline.to({}, { duration: 0.26 })

      GREETINGS.forEach((greeting, index) => {
        const isFinal = index === GREETINGS.length - 1
        timeline
          .call(() => {
            word.textContent = greeting
          })
          .fromTo(word, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" })

        if (isFinal) {
          timeline.to({}, { duration: 0.34 })
        } else {
          timeline.to(word, { autoAlpha: 0, y: -10, duration: 0.12, ease: "power2.in", delay: 0.08 })
        }
      })

      timeline.addLabel("morph")
      timeline.to(word, { autoAlpha: 0, scale: 0.65, y: -16, duration: 0.4, ease: "power3.inOut" }, "morph")
      timeline.to(logo, { autoAlpha: 1, duration: 0.4, ease: "power2.inOut" }, "morph")
      timeline.to(root, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, "morph+=0.56")
      timeline.to(content, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, "morph+=0.42")
    }, root)

    return () => {
      context.revert()
      gsap.set(content, { clearProps: "opacity,visibility,transform" })
    }
  }, [])

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      id="preloader"
      role="status"
      aria-live="polite"
      aria-label="Loading Chabaqa"
      className="fixed inset-0 z-[10000] overflow-hidden bg-white text-[#323232]"
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          ref={wordRef}
          id="preloader-word"
          dir="auto"
          className="block whitespace-nowrap text-[56px] font-semibold leading-none tracking-[-1.5px] sm:text-[64px] md:text-[72px]"
        >
          مرحبا
        </span>
      </div>

      {/* The final greeting resolves into the real Chabaqa mark, not a second text logo. */}
      <header id="site-header" className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-16 items-center px-6 md:px-10">
        <Link
          ref={logoRef}
          id="logo"
          href="/"
          aria-label="Chabaqa — go to homepage"
          className="pointer-events-auto block"
          style={{ opacity: 0 }}
        >
          <img src="/Logos/PNG/frensh1.png" alt="Chabaqa" width={112} height={28} className="h-9 w-auto" />
        </Link>
      </header>

    </div>
  )
}
