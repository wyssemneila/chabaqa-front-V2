import { NextResponse } from "next/server"

const DEFAULT_LIBRE_ENDPOINTS = [
  "http://libretranslate:5000",
  "http://chabaqa-libretranslate:5000",
  "http://127.0.0.1:5000",
]

type RequestBody = {
  texts?: string[]
  source?: string
  target?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const source = body.source || "en"
    const target = body.target || "ar"
    const texts = Array.isArray(body.texts) ? body.texts.filter(Boolean).slice(0, 80) : []

    if (!texts.length) {
      return NextResponse.json({ translations: [] })
    }

    const endpoints = [process.env.LIBRETRANSLATE_URL, ...DEFAULT_LIBRE_ENDPOINTS].filter(Boolean)
    const translations: string[] = []

    for (const text of texts) {
      let translated = text
      let translatedOk = false

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${String(endpoint).replace(/\/$/, "")}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: text,
              source,
              target,
              format: "text",
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(4000),
          })
          if (!response.ok) continue
          const payload = await response.json()
          translated = payload?.translatedText || text
          translatedOk = true
          break
        } catch {
          continue
        }
      }

      if (!translatedOk) {
        try {
          const url = new URL("https://api.mymemory.translated.net/get")
          url.searchParams.set("q", text)
          url.searchParams.set("langpair", `${source}|${target}`)
          const response = await fetch(url.toString(), { cache: "no-store" })
          if (response.ok) {
            const payload = await response.json()
            const fallbackTranslated = payload?.responseData?.translatedText
            translations.push(fallbackTranslated || text)
            continue
          }
        } catch {
          // fall through to original text
        }
        translations.push(text)
        continue
      }

      translations.push(translated)
    }

    return NextResponse.json({ translations })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Translation failed", translations: [] },
      { status: 500 },
    )
  }
}
