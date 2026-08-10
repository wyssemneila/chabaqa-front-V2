"use client"

import Image from "next/image"
import * as React from "react"
import { Globe2, Landmark } from "lucide-react"

const colours = ["#f65887", "#8e78fb", "#47c7ea", "#ff9b28", "#8e78fb"]

/** A branded, accessible adaptation of the supplied aurora-card component. */
function ChabaqaAuroraCard() {
  const ref = React.useRef<HTMLDivElement>(null)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const card = ref.current
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const bounds = card.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    card.style.setProperty("--card-rx", `${-y * 9}deg`)
    card.style.setProperty("--card-ry", `${x * 12}deg`)
    card.style.setProperty("--card-x", `${x * 10}px`)
    card.style.setProperty("--card-y", `${y * 8}px`)
  }

  function resetCard() {
    const card = ref.current
    card?.style.setProperty("--card-rx", "0deg")
    card?.style.setProperty("--card-ry", "0deg")
    card?.style.setProperty("--card-x", "0px")
    card?.style.setProperty("--card-y", "0px")
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCard}
      className="group relative mx-auto aspect-[1.586/1] w-full max-w-[510px] [perspective:1000px]"
    >
      <div
        className="relative h-full overflow-hidden rounded-[2rem] border border-white/35 shadow-[0_30px_70px_-28px_rgba(72,48,170,0.72)] transition-transform duration-500 ease-out will-change-transform [transform:perspective(1000px)_rotateX(var(--card-rx,0deg))_rotateY(var(--card-ry,0deg))_translate3d(var(--card-x,0px),var(--card-y,0px),0)] group-hover:scale-[1.015]"
        style={{ background: "linear-gradient(145deg, #17132f 4%, #382475 47%, #14112a 100%)" }}
      >
        <div className="aurora-bands absolute -inset-[65%] opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_8%,rgba(255,255,255,.32),transparent_22%),linear-gradient(160deg,rgba(255,255,255,.15),transparent_28%,rgba(8,5,28,.55)_92%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(174deg,transparent_0,transparent_5px,rgba(255,255,255,.12)_6px,transparent_8px)]" />

        {/* Brandmark is printed directly on the card, not inside a separate tile. */}
        <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" width={42} height={42} className="absolute left-7 top-7 h-10 w-10 drop-shadow-[0_2px_8px_rgba(255,255,255,.22)] sm:left-9 sm:top-9" priority />
        <span className="absolute right-7 top-8 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">CHABAQA</span>

        {/* SIM-style payment chip, with contacts and metallic segmentation. */}
        <div className="absolute left-7 top-1/2 h-14 w-[78px] -translate-y-1/2 overflow-hidden rounded-lg border border-amber-100/70 bg-gradient-to-br from-[#fff9ca] via-[#d9a943] to-[#875319] shadow-[inset_0_1px_2px_rgba(255,255,255,.85),0_4px_10px_rgba(0,0,0,.2)] sm:left-9">
          <span className="absolute inset-y-0 left-1/2 w-px bg-[#925c1b]/70" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-[#925c1b]/70" />
          <span className="absolute left-0 top-1/4 h-px w-full bg-[#925c1b]/70" />
          <span className="absolute bottom-1/4 left-0 h-px w-full bg-[#925c1b]/70" />
          <span className="absolute inset-y-0 left-1/4 w-px bg-[#925c1b]/70" />
          <span className="absolute inset-y-0 right-1/4 w-px bg-[#925c1b]/70" />
        </div>
        <div className="absolute bottom-8 left-7 sm:left-9">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">Chabaqa pay</p>
          <p className="mt-1 text-xl font-semibold tracking-wide text-white sm:text-2xl">Local & global payments.</p>
        </div>
        <div className="absolute bottom-8 right-7 flex h-11 items-center gap-1 sm:right-9">
          <span className="h-10 w-10 rounded-full bg-[#f65887]/90" />
          <span className="-ml-5 h-10 w-10 rounded-full bg-[#ffb26b]/90 mix-blend-screen" />
        </div>
      </div>
    </div>
  )
}

export function AuroraCardShowcase() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-20 sm:px-10 lg:py-28 dark:!bg-[var(--section-alt)]" aria-labelledby="aurora-showcase-title">
      <style jsx>{`
        .aurora-bands {
          background: repeating-linear-gradient(165deg, ${colours.map((colour, index) => `${colour} ${index * 20}%`).join(", ")}, ${colours[0]} 100%);
          filter: blur(18px) saturate(1.15);
          animation: aurora-flow 22s linear infinite;
        }
        @keyframes aurora-flow { from { transform: translate3d(-4%, -8%, 0) rotate(-8deg); } to { transform: translate3d(5%, 9%, 0) rotate(-8deg); } }
        @media (prefers-reduced-motion: reduce) { .aurora-bands { animation: none; } }
      `}</style>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--p3)] bg-[var(--white)] px-3 py-1.5 text-sm font-semibold text-[var(--p)]">
            <Landmark className="h-4 w-4" /> Local and international payments
          </div>
          <h2 id="aurora-showcase-title" className="max-w-xl text-3xl font-bold tracking-tight text-[var(--t1)] sm:text-4xl lg:text-5xl">
            Everything your community needs, in one beautiful place.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--t2)] sm:text-lg">
            Accept local and international payments while managing your community, courses, events, and products from one trusted platform.
          </p>
          <div className="mt-7 flex items-center gap-2 text-sm font-medium text-[var(--t2)]"><Globe2 className="h-4 w-4 text-[var(--p)]" /> Built for Tunisia, ready for the world.</div>
        </div>
        <ChabaqaAuroraCard />
      </div>
    </section>
  )
}
