#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = process.cwd()
const scanRoots = ["app", "components", "lib"]
const skipSegments = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}app${path.sep}api${path.sep}`,
]

const riskyPatterns = [
  /fetch\(\s*["'`]\/api\//g,
  /axios\.(get|post|put|patch|delete)\(\s*["'`]\/api\//g,
]

const matches = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (skipSegments.some((segment) => fullPath.includes(segment))) continue
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue

    const content = fs.readFileSync(fullPath, "utf8")
    const lines = content.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (riskyPatterns.some((pattern) => pattern.test(line))) {
        matches.push(`${path.relative(root, fullPath)}:${index + 1}:${line.trim()}`)
      }
      riskyPatterns.forEach((pattern) => {
        pattern.lastIndex = 0
      })
    })
  }
}

for (const relativeRoot of scanRoots) {
  const absoluteRoot = path.join(root, relativeRoot)
  if (fs.existsSync(absoluteRoot)) {
    walk(absoluteRoot)
  }
}

if (matches.length) {
  console.error("Found client/runtime relative /api calls that are unsafe behind the current Nginx split:")
  matches.forEach((match) => console.error(`- ${match}`))
  process.exit(1)
}

console.log("No unsafe relative /api client calls found.")
