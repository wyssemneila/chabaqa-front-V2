#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const messagesDir = path.join(root, "messages")
const sourcePath = path.join(messagesDir, "en.json")
const targetPath = path.join(messagesDir, "ar.json")

function readJson(filePath) {
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

const source = flatten(readJson(sourcePath))
const target = flatten(readJson(targetPath))

const missingInTarget = []
const extraInTarget = []

for (const key of Object.keys(source)) {
  if (!(key in target)) missingInTarget.push(key)
}

for (const key of Object.keys(target)) {
  if (!(key in source)) extraInTarget.push(key)
}

if (missingInTarget.length || extraInTarget.length) {
  console.error("i18n parity check failed.")
  if (missingInTarget.length) {
    console.error(`Missing keys in ar.json (${missingInTarget.length}):`)
    missingInTarget.slice(0, 200).forEach((k) => console.error(`- ${k}`))
  }
  if (extraInTarget.length) {
    console.error(`Extra keys in ar.json (${extraInTarget.length}):`)
    extraInTarget.slice(0, 200).forEach((k) => console.error(`- ${k}`))
  }
  process.exit(1)
}

console.log(`i18n parity check passed. Keys: ${Object.keys(source).length}`)
