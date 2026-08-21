"use client"

import * as React from "react"
import { Sparkles, Loader2, Check } from "lucide-react"
import { aiApi, type LearnerProfile } from "@/lib/api/ai.api"
import { IOSCard, IOSCardHeader, IOSCardContent } from "@/components/ui/ios/ios-card"
import { IOSButton } from "@/components/ui/ios/ios-button"
import { IOSInput, IOSLabel, IOSTextarea } from "@/components/ui/ios/ios-input"

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const
const STYLES = ["analogies", "concise", "step-by-step", "examples", "visual"] as const

/**
 * Lets a learner configure their cross-course AI profile. The profile is fed
 * into the AI tutor's system prompt (so the tutor adapts to style/weak
 * topics) and the learning path reranker (so recommendations reflect goals).
 */
export function LearnerProfileCard() {
  const [profile, setProfile] = React.useState<LearnerProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<number | null>(null)
  const [goals, setGoals] = React.useState("")
  const [skillLevel, setSkillLevel] = React.useState("")
  const [style, setStyle] = React.useState("")
  const [weakTopics, setWeakTopics] = React.useState("")
  const [interests, setInterests] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    void (async () => {
      try {
        const p = await aiApi.getLearnerProfile()
        if (!active) return
        setProfile(p)
        setGoals(p.goals || "")
        setSkillLevel(p.skillLevel || "")
        setStyle(p.preferredLearningStyle || "")
        setWeakTopics((p.weakTopics || []).join(", "))
        setInterests((p.interests || []).join(", "))
        setLanguage(p.preferredLanguage || "")
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load profile")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await aiApi.updateLearnerProfile({
        goals: goals.trim(),
        skillLevel: skillLevel.trim(),
        preferredLearningStyle: style.trim(),
        weakTopics: weakTopics.split(",").map((t) => t.trim()).filter(Boolean),
        interests: interests.split(",").map((t) => t.trim()).filter(Boolean),
        preferredLanguage: language.trim(),
      })
      setProfile(updated)
      setSavedAt(Date.now())
    } catch (e: any) {
      setError(e?.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <IOSCard>
      <IOSCardHeader className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8e78fb]/10">
          <Sparkles className="h-4 w-4 text-[#8e78fb]" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[var(--t1)]">AI learning profile</p>
          <p className="text-[12px] text-[var(--t3)]">Personalizes the AI tutor and learning paths across all your courses.</p>
        </div>
      </IOSCardHeader>
      <IOSCardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--t3)]" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <IOSLabel>Skill level</IOSLabel>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkillLevel(skillLevel === lvl ? "" : lvl)}
                    className={`h-9 rounded-full px-4 text-[13px] font-medium capitalize transition-colors ${
                      skillLevel === lvl
                        ? "bg-[#8e78fb] text-white"
                        : "border border-[var(--bd)] bg-[var(--bg)] text-[var(--t2)]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <IOSLabel>Learning goals</IOSLabel>
              <IOSTextarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                placeholder="e.g. Become a full-stack developer, launch my own product"
              />
            </div>

            <div className="grid gap-2">
              <IOSLabel>Preferred explanation style</IOSLabel>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(style === s ? "" : s)}
                    className={`h-9 rounded-full px-4 text-[13px] font-medium capitalize transition-colors ${
                      style === s
                        ? "bg-[#8e78fb] text-white"
                        : "border border-[var(--bd)] bg-[var(--bg)] text-[var(--t2)]"
                    }`}
                  >
                    {s.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <IOSLabel>Weak topics (comma-separated)</IOSLabel>
              <IOSInput
                value={weakTopics}
                onChange={(e) => setWeakTopics(e.target.value)}
                placeholder="e.g. async/await, CSS grid, SQL joins"
              />
            </div>

            <div className="grid gap-2">
              <IOSLabel>Interests (comma-separated)</IOSLabel>
              <IOSInput
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. design, marketing, AI"
              />
            </div>

            <div className="grid gap-2">
              <IOSLabel>Preferred answer language (optional)</IOSLabel>
              <IOSInput
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. en, fr, ar — leave empty for auto-detect"
              />
            </div>

            {error ? (
              <p className="text-[12px] text-red-500">{error}</p>
            ) : null}

            <div className="flex items-center gap-3 pt-1">
              <IOSButton
                variant="filled"
                size="sm"
                onClick={save}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : savedAt ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {saving ? "Saving..." : savedAt ? "Saved" : "Save profile"}
              </IOSButton>
              <p className="text-[12px] text-[var(--t3)]">
                The AI tutor uses this to adapt its answers.
              </p>
            </div>
          </>
        )}
      </IOSCardContent>
    </IOSCard>
  )
}
