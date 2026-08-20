"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"

const CACHE_KEY = "i18n_ar_auto_cache_v1"

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "OPTION",
])

function shouldTranslate(text: string): boolean {
  const value = text.trim()
  if (!value) return false
  if (value.length < 2) return false
  if (/^\d+$/.test(value)) return false
  if (!/[A-Za-z]/.test(value)) return false
  return true
}

function getCache(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")
  } catch {
    return {}
  }
}

function setCache(cache: Record<string, string>) {
  if (typeof window === "undefined") return
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function ArabicAutoTranslate() {
  const locale = useLocale()

  useEffect(() => {
    if (locale !== "ar") return
    const enabled = process.env.NEXT_PUBLIC_ENABLE_ARABIC_AUTO_TRANSLATE !== "false"
    if (!enabled) return

    const translatedNodes = new WeakSet<Text>()
    const translatedAttrs = new WeakSet<Element>()
    const cache = getCache()

    const translateTexts = async (texts: string[]) => {
      const unknown = texts.filter((text) => !cache[text])
      if (unknown.length) {
        const response = await fetch("/internal/i18n/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: unknown, source: "en", target: "ar" }),
        })
        if (response.ok) {
          const payload = await response.json()
          const translated = Array.isArray(payload?.translations) ? payload.translations : []
          unknown.forEach((text, index) => {
            cache[text] = translated[index] || text
          })
          setCache(cache)
        }
      }
      return texts.map((text) => cache[text] || text)
    }

    const runTranslationPass = async () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      const texts: string[] = []

      while (walker.nextNode()) {
        const node = walker.currentNode as Text
        if (translatedNodes.has(node)) continue
        const parent = node.parentElement
        if (!parent || SKIP_TAGS.has(parent.tagName)) continue
        if (parent.closest("[data-no-auto-translate='true']")) continue

        const content = node.nodeValue || ""
        if (!shouldTranslate(content)) continue

        nodes.push(node)
        texts.push(content)
      }

      if (texts.length) {
        const translated = await translateTexts(texts)
        translated.forEach((value, index) => {
          nodes[index].nodeValue = value
          translatedNodes.add(nodes[index])
        })
      }

      const attrElements = Array.from(
        document.querySelectorAll("[placeholder],[title],[aria-label]"),
      ).filter((el) => !translatedAttrs.has(el) && !el.closest("[data-no-auto-translate='true']"))

      const attrTexts: string[] = []
      const attrTargets: Array<{ el: Element; attr: string }> = []

      for (const el of attrElements) {
        for (const attr of ["placeholder", "title", "aria-label"]) {
          const value = el.getAttribute(attr)
          if (!value || !shouldTranslate(value)) continue
          attrTargets.push({ el, attr })
          attrTexts.push(value)
        }
      }

      if (attrTexts.length) {
        const translatedAttrsText = await translateTexts(attrTexts)
        translatedAttrsText.forEach((value, index) => {
          const target = attrTargets[index]
          target.el.setAttribute(target.attr, value)
          translatedAttrs.add(target.el)
        })
      }
    }

    let running = false
    let rerun = false

    const scheduleProcess = () => {
      if (running) {
        rerun = true
        return
      }

      running = true
      runTranslationPass()
        .catch(() => undefined)
        .finally(() => {
          running = false
          if (rerun) {
            rerun = false
            scheduleProcess()
          }
        })
    }

    scheduleProcess()

    const observer = new MutationObserver(() => {
      scheduleProcess()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [locale])

  return null
}
