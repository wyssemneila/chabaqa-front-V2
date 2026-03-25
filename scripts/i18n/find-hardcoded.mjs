#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const defaultDirs = ["app/(auth)", "app/(landing)", "app/(admin)", "components"]
const dirs = process.argv.slice(2)
const targets = dirs.length ? dirs : defaultDirs

const allowedPattern = /\b(className|variant|size|type|id|href|src|target|rel|role|name|value|method|aria-|http|https|mailto:|tel:|[A-Z0-9_/-]{2,})\b/
const literalPattern = /(["'`])((?:(?!\1|\\).|\\.)*[A-Za-z][^"'`]{1,})\1/g

function walk(dirPath, out = []) {
  if (!fs.existsSync(dirPath)) return out

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(fullPath)
  }
  return out
}

const findings = []

for (const relTarget of targets) {
  const absolute = path.join(root, relTarget)
  for (const file of walk(absolute)) {
    const content = fs.readFileSync(file, "utf8")
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      if (line.includes("useTranslations(") || line.includes("t(")) return
      const matches = [...line.matchAll(literalPattern)]
      for (const match of matches) {
        const literal = match[2].trim()
        if (literal.length < 4) continue
        if (allowedPattern.test(literal)) continue
        if (/^\{.*\}$/.test(literal)) continue
        findings.push({
          file: path.relative(root, file),
          line: index + 1,
          text: literal.slice(0, 120),
        })
      }
    })
  }
}

if (!findings.length) {
  console.log("No potential hardcoded user-facing literals found in scanned folders.")
  process.exit(0)
}

console.error(`Potential hardcoded literals found: ${findings.length}`)
for (const item of findings.slice(0, 250)) {
  console.error(`- ${item.file}:${item.line} -> ${item.text}`)
}
console.error("Run with explicit directories to scope checks, e.g. `node scripts/i18n/find-hardcoded.mjs app/(auth)`.")
process.exit(1)
