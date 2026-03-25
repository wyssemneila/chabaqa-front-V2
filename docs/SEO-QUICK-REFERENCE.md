# SEO Quick Reference Guide

## Adding SEO to a New Page

### 1. Import Required Modules

```typescript
import type { Metadata } from "next"
import { generateKeywords, generateOGMetadata, generateTwitterMetadata, generateAlternateLanguages, generateRobotsMetadata } from "@/lib/seo-config"
```

### 2. Create Page Metadata

```typescript
export const metadata: Metadata = {
  title: "Your Page Title | Chabaqa",
  description: "Your page description (150-160 characters)",
  keywords: generateKeywords([
    "page-specific keyword 1",
    "page-specific keyword 2",
    "page-specific keyword 3"
  ]),
  authors: [{ name: "Chabaqa" }],
  openGraph: generateOGMetadata(
    "Your Page Title",
    "Your page description",
    "https://chabaqa.com/your-page-url"
  ),
  twitter: generateTwitterMetadata(
    "Your Page Title",
    "Your page description"
  ),
  alternates: generateAlternateLanguages("/your-page-url"),
  robots: generateRobotsMetadata(true, true) // index: true, follow: true
}
```

### 3. Add Structured Data (if applicable)

#### For FAQ Pages:
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Question text?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Answer text"
          }
        }
      ]
    })
  }}
/>
```

#### For Blog Posts:
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Blog post title",
      "description": "Blog post description",
      "image": "image-url",
      "datePublished": "2024-01-01",
      "author": {
        "@type": "Person",
        "name": "Author Name"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Chabaqa",
        "logo": {
          "@type": "ImageObject",
          "url": "https://chabaqa.com/logo.png"
        }
      }
    })
  }}
/>
```

#### For Breadcrumbs:
```typescript
import { generateBreadcrumbSchema } from "@/lib/seo-config"

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      generateBreadcrumbSchema([
        { name: "Home", url: "https://chabaqa.com" },
        { name: "Your Page", url: "https://chabaqa.com/your-page" }
      ])
    )
  }}
/>
```

### 4. Update Sitemap

Add your new page to `app/sitemap.ts`:

```typescript
{
  url: `${baseUrl}/your-new-page`,
  lastModified: new Date(),
  changeFrequency: 'weekly', // or 'daily', 'monthly'
  priority: 0.8, // 0.0 to 1.0
}
```

### 5. Update Robots.txt (if needed)

If your page should be indexed, ensure it's not in the disallow list in `app/robots.ts`.

## Common Metadata Patterns

### Landing Page
```typescript
title: "Feature Name - Description | Chabaqa"
description: "Compelling description with main keywords (150-160 chars)"
priority: 0.8-0.9
changeFrequency: 'weekly'
```

### Blog Post
```typescript
title: "Blog Post Title | Chabaqa Blog"
description: "Post excerpt (150-160 chars)"
priority: 0.7
changeFrequency: 'weekly'
```

### Documentation Page
```typescript
title: "Documentation Topic | Chabaqa Docs"
description: "What users will learn (150-160 chars)"
priority: 0.6-0.7
changeFrequency: 'monthly'
```

### Feature Page
```typescript
title: "Feature Name - Benefits | Chabaqa"
description: "Feature description with value proposition (150-160 chars)"
priority: 0.7-0.8
changeFrequency: 'weekly'
```

## SEO Checklist for New Pages

- [ ] Title tag (50-60 characters)
- [ ] Meta description (150-160 characters)
- [ ] Keywords (including transliterations if relevant)
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Language alternates
- [ ] Robots meta tags
- [ ] Structured data (if applicable)
- [ ] Breadcrumb schema (if applicable)
- [ ] Added to sitemap
- [ ] Internal links from other pages
- [ ] Mobile-responsive
- [ ] Fast loading time
- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] Alt text for images
- [ ] Descriptive URLs

## Arabic Transliteration Keywords

Always include these variations when relevant:
- chabaqa
- shabqa
- chabka
- shabka
- chabqa
- شبقة

## Location Keywords

For Tunisia/MENA targeting:
- tunisia
- tunisie
- mena
- north africa
- middle east
- arabic

## Common Mistakes to Avoid

1. ❌ Duplicate title tags across pages
2. ❌ Missing or duplicate meta descriptions
3. ❌ Keyword stuffing
4. ❌ Missing alt text on images
5. ❌ Broken internal links
6. ❌ Missing canonical URLs
7. ❌ Not updating sitemap
8. ❌ Forgetting mobile optimization
9. ❌ Missing structured data
10. ❌ Not testing with SEO tools

## Testing Your SEO

### Before Publishing:
1. Check title and description length
2. Validate structured data with [Schema Markup Validator](https://validator.schema.org/)
3. Test mobile responsiveness
4. Check page speed with [PageSpeed Insights](https://pagespeed.web.dev/)
5. Verify all links work
6. Check image alt text

### After Publishing:
1. Submit URL to Google Search Console
2. Check indexing status
3. Monitor search appearance
4. Track rankings for target keywords
5. Analyze user behavior in Google Analytics

## Quick Commands

### Test structured data locally:
```bash
# View page source and copy JSON-LD
# Paste into https://validator.schema.org/
```

### Check sitemap:
```bash
# Visit: https://chabaqa.com/sitemap.xml
```

### Check robots.txt:
```bash
# Visit: https://chabaqa.com/robots.txt
```

### Build and test:
```bash
npm run build
npm run start
```

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

## Need Help?

Refer to:
- `docs/SEO-GUIDE.md` - Comprehensive SEO documentation
- `lib/seo-config.ts` - SEO configuration and helper functions
- Existing pages for examples (e.g., `app/(landing)/page.tsx`, `app/(landing)/faq/page.tsx`)
