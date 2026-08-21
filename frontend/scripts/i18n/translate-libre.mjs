#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const messagesDir = path.join(root, "messages")
const sourceLocale = "en"
const targetLocale = "ar"
const sourcePath = path.join(messagesDir, `${sourceLocale}.json`)
const targetPath = path.join(messagesDir, `${targetLocale}.json`)
const force = process.argv.includes("--force")
const endpoints = [
  process.env.LIBRETRANSLATE_URL,
  "http://libretranslate:5000",
  "http://chabaqa-libretranslate:5000",
  "http://127.0.0.1:5000",
].filter(Boolean)

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj || {})) {
    const next = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, next, out)
      continue
    }
    out[next] = value
  }
  return out
}

function unflatten(flat) {
  const out = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".")
    let cursor = out
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {}
      cursor = cursor[parts[i]]
    }
    cursor[parts[parts.length - 1]] = value
  }
  return out
}

function protectText(text) {
  const protectedTokens = []
  const register = (token) => {
    const key = `__P${protectedTokens.length}__`
    protectedTokens.push({ key, token })
    return key
  }

  let next = text
  const patterns = [
    /\{\{\s*[\w.:-]+\s*\}\}/g,
    /\{\s*[\w.:-]+\s*\}/g,
    /https?:\/\/[^\s)]+/g,
    /<[0-9]+>/g,
    /<\/[0-9]+>/g,
    /\b(Chabaqa|Google|WhatsApp|Instagram|Facebook|YouTube|Stripe|PayPal|API|JSON|URL)\b/g,
  ]

  for (const pattern of patterns) {
    next = next.replace(pattern, (match) => register(match))
  }

  return { text: next, protectedTokens }
}

function restoreText(text, protectedTokens) {
  let next = text
  for (const item of protectedTokens) {
    next = next.replaceAll(item.key, item.token)
  }
  return next
}

async function translateOne(text) {
  let lastError = ""
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${String(endpoint).replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: sourceLocale,
          target: targetLocale,
          format: "text",
        }),
      })

      if (!response.ok) {
        const details = await response.text()
        lastError = `Endpoint ${endpoint} failed ${response.status}: ${details}`
        continue
      }

      const payload = await response.json()
      const translated = payload?.translatedText
      if (translated) return translated
      lastError = `Endpoint ${endpoint} returned empty translation`
    } catch (error) {
      lastError = `Endpoint ${endpoint} error: ${error?.message || "unknown"}`
    }
  }

  // Free fallback: MyMemory API
  try {
    const url = new URL("https://api.mymemory.translated.net/get")
    url.searchParams.set("q", text)
    url.searchParams.set("langpair", `${sourceLocale}|${targetLocale}`)
    const response = await fetch(url.toString())
    if (response.ok) {
      const payload = await response.json()
      const translated = payload?.responseData?.translatedText
      if (translated) return translated
    }
  } catch (error) {
    lastError = `${lastError} | MyMemory error: ${error?.message || "unknown"}`
  }

  throw new Error(`Free translation failed on all providers. ${lastError}`)
}

async function run() {
  const sourceFlat = flatten(readJson(sourcePath))
  const targetFlat = flatten(readJson(targetPath))
  const output = { ...targetFlat }

  const keys = Object.keys(sourceFlat)
  let translatedCount = 0

  console.log(`Using LibreTranslate endpoints: ${endpoints.join(", ")}`)

  for (const key of keys) {
    const sourceValue = sourceFlat[key]
    if (typeof sourceValue !== "string") {
      output[key] = sourceValue
      continue
    }

    if (!force && typeof targetFlat[key] === "string" && targetFlat[key].trim()) {
      continue
    }

    const { text: protectedText, protectedTokens } = protectText(sourceValue)
    const translated = await translateOne(protectedText)
    output[key] = restoreText(translated, protectedTokens)
    translatedCount += 1
  }

  fs.writeFileSync(targetPath, `${JSON.stringify(unflatten(output), null, 2)}\n`)
  console.log(`Translation completed. Updated keys: ${translatedCount}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
