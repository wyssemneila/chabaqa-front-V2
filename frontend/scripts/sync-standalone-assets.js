const fs = require("fs")
const path = require("path")

const root = path.resolve(__dirname, "..")
const standaloneDir = path.join(root, ".next", "standalone")
const publicDir = path.join(root, "public")
const nextStaticDir = path.join(root, ".next", "static")
const standalonePublicDir = path.join(standaloneDir, "public")
const standaloneNextDir = path.join(standaloneDir, ".next")
const standaloneStaticDir = path.join(standaloneNextDir, "static")

function copyDir(src, dest, { clean = true } = {}) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing required asset directory: ${src}`)
  }
  if (clean) {
    fs.rmSync(dest, { recursive: true, force: true })
  }
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(src, dest, { recursive: true, force: true })
}

if (!fs.existsSync(standaloneDir)) {
  console.log("[sync-standalone-assets] No standalone build found; skipping.")
  process.exit(0)
}

fs.mkdirSync(standaloneNextDir, { recursive: true })
copyDir(publicDir, standalonePublicDir)
copyDir(nextStaticDir, standaloneStaticDir, { clean: false })
console.log("[sync-standalone-assets] Synced public and merged .next/static into standalone build.")
