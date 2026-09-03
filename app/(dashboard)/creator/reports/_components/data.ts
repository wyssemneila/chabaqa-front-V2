// ─── Mock data for the Course Reports section ──────────────────────────────────
// Deterministic (seeded) so the UI is stable across re-renders. This is a
// front-end-only preview; the real numbers will come from the backend later.

export interface Chapter {
  id: string
  title: string
  durationSec: number
}

export interface CourseReport {
  id: string
  title: string
  hue: number            // avatar/thumbnail accent
  enrolled: number
  chapters: Chapter[]
}

export interface Student {
  id: string
  name: string
  hue: number
}

// ─── Seeded RNG ────────────────────────────────────────────────────────────────
export function seededRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ─── Static-ish catalog ─────────────────────────────────────────────────────────
const FIRST = ['Yassin', 'Nour', 'Mariem', 'Skander', 'Farah', 'Aymen', 'Rania', 'Bilel', 'Ines', 'Oussama', 'Hela', 'Wassim', 'Amira', 'Karim', 'Salma', 'Zied']
const LAST = ['Ben Ali', 'Trabelsi', 'Gharbi', 'Mansour', 'Haddad', 'Jaziri', 'Bouazizi', 'Khelifi', 'Sassi', 'Chaabane']

export const STUDENTS: Student[] = Array.from({ length: 14 }, (_, i) => {
  const rng = seededRng(hashStr('student' + i))
  const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(rng() * LAST.length)]}`
  return { id: `stu_${i}`, name, hue: Math.floor(rng() * 360) }
})

const CHAPTER_TITLES = [
  'Welcome & what you will build',
  'Setting up your workspace',
  'Core concepts explained',
  'Your first real project',
  'Common mistakes to avoid',
  'Advanced techniques',
  'Polishing & exporting',
  'Next steps & resources',
]

export const COURSES: CourseReport[] = [
  { key: 'motion-fundamentals', title: 'Motion Design Fundamentals', hue: 258, enrolled: 214, chapters: 6 },
  { key: 'after-effects-pro',   title: 'After Effects Pro Workflow',  hue: 292, enrolled: 168, chapters: 8 },
  { key: 'brand-animation',     title: 'Brand Animation Masterclass', hue: 220, enrolled: 96,  chapters: 5 },
  { key: '3d-basics',           title: '3D for 2D Motion Designers',  hue: 160, enrolled: 132, chapters: 7 },
].map(c => {
  const rng = seededRng(hashStr(c.key))
  const chapters: Chapter[] = Array.from({ length: c.chapters }, (_, i) => ({
    id: `${c.key}_ch${i}`,
    title: CHAPTER_TITLES[i % CHAPTER_TITLES.length],
    durationSec: 240 + Math.floor(rng() * 720), // 4–16 min
  }))
  return { id: c.key, title: c.title, hue: c.hue, enrolled: c.enrolled, chapters }
})

export function getCourse(id: string): CourseReport | undefined {
  return COURSES.find(c => c.id === id)
}

// ─── Heatmap generation ─────────────────────────────────────────────────────────
// Returns an array of `segments` watch-counts:
//   0   = never watched (skipped)
//   1   = watched once
//   2+  = rewatched (higher = watched more times)
export function genHeatmap(seed: number, segments = 96): number[] {
  const rng = seededRng(seed)
  const out = new Array(segments).fill(0)

  // How far through the video this viewer got (drop-off point).
  const reach = Math.min(segments, Math.max(4, Math.round(segments * (0.25 + rng() * 0.78))))

  // Base pass: everything up to `reach` gets watched at least once…
  for (let i = 0; i < reach; i++) out[i] = 1

  // …except an occasional skipped gap (jumped ahead).
  if (rng() > 0.45) {
    const gapStart = Math.floor(rng() * reach * 0.6) + Math.floor(reach * 0.15)
    const gapLen = 2 + Math.floor(rng() * 6)
    for (let i = gapStart; i < Math.min(reach, gapStart + gapLen); i++) out[i] = 0
  }

  // One or two rewatch bands (a hard part they replayed).
  const bands = 1 + (rng() > 0.6 ? 1 : 0)
  for (let b = 0; b < bands; b++) {
    const center = Math.floor(rng() * reach)
    const width = 2 + Math.floor(rng() * 7)
    const intensity = 1 + Math.floor(rng() * 3) // +1..+3
    for (let i = Math.max(0, center - width); i < Math.min(reach, center + width); i++) {
      if (out[i] > 0) out[i] += intensity
    }
  }
  return out
}

export interface WatchStats {
  segments: number[]
  percent: number     // % of the video actually watched
  exitPct: number     // where they stopped, as % of duration
  rewatchSpots: { atPct: number; times: number }[]
}

export function watchStatsFor(studentId: string, chapterId: string, segments = 96): WatchStats {
  const seg = genHeatmap(hashStr(studentId + '|' + chapterId), segments)
  const watched = seg.filter(v => v > 0).length
  let exit = 0
  for (let i = 0; i < seg.length; i++) if (seg[i] > 0) exit = i
  const rewatchSpots = seg
    .map((v, i) => ({ atPct: Math.round((i / segments) * 100), times: v }))
    .filter(s => s.times >= 2)
    .sort((a, b) => b.times - a.times)
    .slice(0, 3)
  return {
    segments: seg,
    percent: Math.round((watched / segments) * 100),
    exitPct: Math.round((exit / segments) * 100),
    rewatchSpots,
  }
}

// Colour for a watch-count (skipped → watched → rewatched). Works on both themes.
export function segColor(count: number): string {
  if (count <= 0) return 'var(--seg-skip)'
  if (count === 1) return '#22c55e'        // watched once — green
  if (count === 2) return '#f59e0b'        // rewatched — amber
  if (count === 3) return '#f97316'        // deep orange
  return '#ef4444'                          // very hot — red
}

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
