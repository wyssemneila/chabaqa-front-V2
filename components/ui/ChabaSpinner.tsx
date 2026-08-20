"use client"

/**
 * ChabaSpinner — mini version of the Chabaqa 4-ring branded loader.
 * Uses the same ringA/B/C/D keyframes defined in globals.css.
 */
export function ChabaSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <circle
        cx={120} cy={120} r={105}
        fill="none" strokeWidth={20} strokeDasharray="0 660"
        strokeDashoffset={-330} strokeLinecap="round"
        style={{ stroke: "var(--p,#8e78fb)", animation: "ringA 2s linear infinite" }}
      />
      <circle
        cx={120} cy={120} r={35}
        fill="none" strokeWidth={20} strokeDasharray="0 220"
        strokeDashoffset={-110} strokeLinecap="round"
        style={{ stroke: "var(--orange,#ff9b28)", animation: "ringB 2s linear infinite" }}
      />
      <circle
        cx={85} cy={120} r={70}
        fill="none" strokeWidth={20} strokeDasharray="0 440"
        strokeLinecap="round"
        style={{ stroke: "var(--cyan,#47c7ea)", animation: "ringC 2s linear infinite" }}
      />
      <circle
        cx={155} cy={120} r={70}
        fill="none" strokeWidth={20} strokeDasharray="0 440"
        strokeLinecap="round"
        style={{ stroke: "var(--pink,#f65887)", animation: "ringD 2s linear infinite" }}
      />
    </svg>
  )
}
