"use client"

import type { HTMLAttributes } from "react"
import React from "react"
import { forwardRef } from "react"

const BLOCKED_ELEMENTS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "svg",
  "math",
  "meta",
  "link",
  "base",
]

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
])

function sanitizeUrl(rawUrl: string, allowRelative = false): string | null {
  const trimmed = rawUrl.trim().replace(/[\u0000-\u001f\u007f\s]+/g, "")
  if (!trimmed) return null
  if (allowRelative && (trimmed.startsWith("/") || trimmed.startsWith("#"))) return trimmed

  try {
    const parsed = new URL(trimmed)
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

function sanitizeWithDomParser(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
  const root = doc.body.firstElementChild
  if (!root) return ""

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase()
      if (BLOCKED_ELEMENTS.includes(tag)) {
        child.remove()
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...Array.from(child.childNodes))
        continue
      }

      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase()
        const value = attr.value
        const allowed =
          (tag === "a" && ["href", "title", "target"].includes(name)) ||
          (tag === "img" && ["src", "alt", "title", "width", "height"].includes(name)) ||
          (["td", "th"].includes(tag) && ["colspan", "rowspan"].includes(name))

        if (!allowed || name.startsWith("on") || ["style", "srcdoc", "formaction"].includes(name)) {
          child.removeAttribute(attr.name)
          continue
        }

        if (name === "href") {
          const safeUrl = sanitizeUrl(value)
          safeUrl ? child.setAttribute("href", safeUrl) : child.removeAttribute("href")
        }

        if (name === "src") {
          const safeUrl = sanitizeUrl(value, true)
          safeUrl ? child.setAttribute("src", safeUrl) : child.removeAttribute("src")
        }

        if ((name === "width" || name === "height" || name === "colspan" || name === "rowspan") && !/^\d{1,4}$/.test(value)) {
          child.removeAttribute(attr.name)
        }
      }

      if (tag === "a" && child.getAttribute("target") === "_blank") {
        child.setAttribute("rel", "noopener noreferrer")
      }

      walk(child)
    }
  }

  walk(root)
  return root.innerHTML
}

function sanitizeFallback(html: string): string {
  let output = html.replace(/<!--[\s\S]*?-->/g, "")
  for (const tag of BLOCKED_ELEMENTS) {
    output = output
      .replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), "")
      .replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "")
  }
  return output
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:style|srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["']?)\s*(?:javascript|vbscript|data):[^"'\s>]*\1/gi, "")
}

export function sanitizeHtml(html: string): string {
  if (!html) return ""
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    return sanitizeWithDomParser(html)
  }
  return sanitizeFallback(html)
}

type SafeHtmlProps = Omit<HTMLAttributes<HTMLDivElement>, "dangerouslySetInnerHTML"> & {
  html: string
}

export const SafeHtml = forwardRef<HTMLDivElement, SafeHtmlProps>(function SafeHtml({ html, ...props }, ref) {
  return <div ref={ref} {...props} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
})
