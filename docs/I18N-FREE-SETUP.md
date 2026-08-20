# Free Arabic Translation Setup (`next-intl` + auto-translate fallback)

This project supports Arabic in two layers:

1. Static translations from `messages/ar.json` via `next-intl`.
2. Runtime auto-translation for hardcoded UI text on `/ar/*` pages.

## 1) Generate Arabic messages for keys

From `chabaqa-frontend`:

```bash
npm run i18n:translate:ar
npm run i18n:check:parity
```

The script uses free providers in this order:

1. `LIBRETRANSLATE_URL` (if set)
2. `http://libretranslate:5000`
3. `http://chabaqa-libretranslate:5000`
4. `http://127.0.0.1:5000`
5. MyMemory public API fallback

## 2) Enable auto-translation for hardcoded text

In deploy env:

```env
NEXT_PUBLIC_ENABLE_ARABIC_AUTO_TRANSLATE=true
```

This runs on Arabic pages only and translates text nodes/placeholders/title/aria-label not yet localized.

To skip a subtree:

```html
<div data-no-auto-translate="true">...</div>
```

## 3) Optional: run free local LibreTranslate

```bash
docker run -d --name libretranslate \
  -p 5000:5000 \
  libretranslate/libretranslate:latest
```

Then set:

```env
LIBRETRANSLATE_URL=http://libretranslate:5000
```

## 4) Deploy

From repo root:

```bash
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```
