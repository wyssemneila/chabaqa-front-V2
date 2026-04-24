# Chabaqa Documentation

## SEO Documentation

This folder contains comprehensive SEO documentation for the Chabaqa platform.

## I18N Documentation

- [I18N-FREE-SETUP.md](./I18N-FREE-SETUP.md) - Free Arabic localization setup (`next-intl` + runtime fallback translator).

### Files

#### 1. [SEO-GUIDE.md](./SEO-GUIDE.md)
**Comprehensive SEO Implementation Guide**

A complete overview of all SEO features implemented in the Chabaqa platform, including:
- Arabic transliteration keywords strategy
- Enhanced metadata implementation
- Structured data (JSON-LD) schemas
- Sitemap and robots.txt configuration
- Multilingual support (English, Arabic, French)
- Performance optimization
- Best practices and monitoring

**When to use:** 
- Understanding the overall SEO strategy
- Learning about implemented features
- Planning future SEO enhancements
- Onboarding new team members

#### 2. [SEO-QUICK-REFERENCE.md](./SEO-QUICK-REFERENCE.md)
**Quick Reference for Adding SEO to New Pages**

A practical, copy-paste guide for developers adding SEO to new pages, including:
- Code templates for metadata
- Structured data examples
- Common patterns for different page types
- SEO checklist
- Testing procedures
- Common mistakes to avoid

**When to use:**
- Creating a new page
- Adding SEO metadata
- Implementing structured data
- Quick reference during development

### Key SEO Features

#### Arabic Transliteration Support
The platform supports multiple spelling variations of "Chabaqa" to capture searches from users who type the name differently:
- chabaqa (official)
- shabqa
- chabka
- shabka
- chabqa
- شبقة (Arabic)

#### Multilingual Support
- English (en) - Default
- Arabic (ar)
- French (fr)

#### Geographic Targeting
- Primary: Tunisia
- Secondary: MENA region (Middle East & North Africa)
- Global reach

### SEO Configuration Module

Location: `lib/seo-config.ts`

Centralized configuration for:
- Brand variations
- Keywords (core, transliteration, location-based, long-tail)
- Social media handles
- Contact information
- Geographic data
- Helper functions for generating metadata

### Key Pages with Enhanced SEO

1. **Homepage** (`app/(landing)/page.tsx`)
   - Comprehensive metadata
   - Organization schema
   - SoftwareApplication schema
   - WebSite schema with search action

2. **FAQ Page** (`app/(landing)/faq/page.tsx`)
   - Dedicated FAQ page
   - FAQPage schema for rich results
   - Breadcrumb schema
   - 12+ comprehensive questions

3. **Blog Pages** (`app/(landing)/blogs/`)
   - Blog listing with metadata
   - Individual post schemas
   - Article structured data

### Tools and Resources

#### SEO Testing Tools
- [Google Search Console](https://search.google.com/search-console)
- [Schema Markup Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Rich Results Test](https://search.google.com/test/rich-results)

#### Documentation Resources
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Central](https://developers.google.com/search)

### Quick Start

#### For Developers Adding a New Page:

1. Read [SEO-QUICK-REFERENCE.md](./SEO-QUICK-REFERENCE.md)
2. Copy the metadata template
3. Customize for your page
4. Add structured data if applicable
5. Update sitemap
6. Test before deploying

#### For SEO Optimization:

1. Read [SEO-GUIDE.md](./SEO-GUIDE.md)
2. Review current implementation
3. Use helper functions from `lib/seo-config.ts`
4. Monitor with Google Search Console
5. Iterate based on performance data

### Maintenance Tasks

#### Weekly:
- [ ] Monitor search performance in Google Search Console
- [ ] Check for crawl errors
- [ ] Review new blog post SEO

#### Monthly:
- [ ] Update FAQ based on user questions
- [ ] Review and update meta descriptions
- [ ] Check keyword rankings
- [ ] Analyze organic traffic trends
- [ ] Update sitemap if needed

#### Quarterly:
- [ ] Comprehensive SEO audit
- [ ] Update keyword strategy
- [ ] Review competitor SEO
- [ ] Plan content strategy
- [ ] Update documentation

### Contact

For SEO-related questions or suggestions:
- Email: contactchabaqa@gmail.com
- Review the documentation first
- Check existing implementations for examples

### Contributing

When adding new SEO features:
1. Update relevant documentation
2. Add examples to quick reference
3. Test thoroughly
4. Update this README if needed

---

**Last Updated:** February 2024
**Version:** 1.0
**Maintained by:** Chabaqa Team
