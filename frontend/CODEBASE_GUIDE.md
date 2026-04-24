# Chabaqa Frontend - Complete Codebase Guide

Welcome to the Chabaqa Frontend codebase documentation. This guide provides a comprehensive overview of the project structure, build tools, and development workflow.

## 📚 Documentation Index

This codebase includes three comprehensive documentation files:

1. **PROJECT_SUMMARY.txt** - Visual overview of the entire project
   - Tech stack, directory structure, build tools
   - NPM scripts, design system, deployment info
   - Perfect for getting a quick high-level understanding

2. **FRONTEND_STRUCTURE.md** - Detailed architectural documentation
   - In-depth configuration file explanations
   - Complete directory structure breakdown
   - Testing setup details
   - Security features and compliance
   - Best for understanding specific configurations

3. **QUICK_START.md** - Development quick reference
   - Common commands and tasks
   - Environment setup
   - Testing best practices
   - Troubleshooting guide
   - Perfect for day-to-day development

---

## 🚀 Getting Started (30 seconds)

```bash
cd /home/ubuntu/chabaqa/chabaqa-frontend
npm install              # Install dependencies
npm run dev             # Start dev server on http://localhost:8080
npm run lint            # Check for linting issues
```

---

## 📋 Key Information at a Glance

### Framework & Tech
- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS + Styled-JSX
- **UI Library**: Radix UI (20+ components)
- **Testing**: Jest + Playwright

### Project Size
- ~25,952 lines of TypeScript/TSX code
- 7 main route groups
- 13+ component categories
- 15+ API client modules

### Core Tools
| Tool | Purpose | Config |
|------|---------|--------|
| TypeScript | Type checking | `tsconfig.json` |
| ESLint | Code linting | `.eslintrc.json` |
| Next.js | Framework | `next.config.mjs` |
| Tailwind | Styling | `tailwind.config.ts` |
| Jest | Unit tests | `jest.config.js` |
| Playwright | E2E tests | `playwright.config.ts` |

---

## 📂 Directory Structure Overview

```
chabaqa-frontend/
├── app/                   # Next.js App Router (7 route groups)
├── components/            # Reusable React components (13+ categories)
├── lib/                   # Utilities & helpers
│   ├── api/              # 15+ API client modules
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── permissions/      # Role-based access
├── middleware/            # Auth guards & route protection
├── i18n/                 # Internationalization setup
├── messages/             # Translation strings
├── e2e/                  # Playwright E2E tests
├── __tests__/            # Jest unit tests
└── public/               # Static assets
```

### App Router Structure (7 Route Groups)
- **(admin)/** - Admin dashboard
- **(auth)/** - Authentication (signin, signup, reset)
- **(landing)/** - Public landing pages
- **(community)/** - Community pages
- **(creator)/** - Creator dashboard
- **(dashboard)/** - User dashboard
- **(build-community)/** - Community setup wizard

---

## 🛠️ Build & Development Commands

### Essential Commands
```bash
npm run dev              # Start development server (port 8080)
npm run build            # Production build
npm run start            # Run production build
npm run lint             # Check code with ESLint
```

### Testing
```bash
npm run test             # Unit tests (Jest)
npm run test:watch      # Jest watch mode
npm run test:e2e        # E2E tests (Playwright)
npm run test:e2e:ui     # Playwright UI mode
```

### Code Quality
```bash
npm run guard:no-relative-api        # Check for relative API calls
npm run check:browser-compat         # Browser compatibility check
npm run i18n:check:parity           # Translation consistency
npm run i18n:check:hardcoded        # Find hardcoded strings
```

---

## 🔧 Configuration Files Explained

### TypeScript (`tsconfig.json`)
- **Target**: ES6
- **Strict Mode**: Enabled
- **Path Alias**: `@/*` → root directory
- **Incremental Builds**: Enabled

### ESLint (`.eslintrc.json`)
- **Base Config**: next/core-web-vitals
- **Key Rules**:
  - `react/no-unescaped-entities`: off
  - `react-hooks/exhaustive-deps`: off
  - `@next/next/no-img-element`: off (custom `<img>` allowed)

### Next.js (`next.config.mjs`)
- **i18n**: next-intl plugin
- **Build Errors**: ESLint & TypeScript errors ignored
- **Output**: Standalone (self-contained)
- **Image Optimization**: Disabled (custom CDN)
- **Security Headers**: HSTS, CSP, frame options
- **API Proxying**: `/api/*` → backend

### Tailwind CSS (`tailwind.config.ts`)
- **Dark Mode**: Class-based
- **Brand Colors**:
  - Primary: `#8e78fb` (purple)
  - Sessions: `#f65887` (pink)
  - Courses: `#47c7ea` (cyan)
  - Challenges: `#ff9b28` (orange)
- **Custom Animations**: 8+ available
- **Plugins**: tailwindcss-animate

### Jest (`jest.config.js`)
- **Environment**: jsdom (for React)
- **Coverage**: admin dashboard + admin APIs
- **Module Mapping**: `@/*` alias, CSS mocking
- **Test Files**: `**/__tests__/**/*.test.ts(x)`

### Playwright (`playwright.config.ts`)
- **Browsers**: Chromium, Firefox, WebKit, Chrome, Edge
- **Mobile**: Pixel 5, iPhone 12
- **CI**: 2 retries, single worker
- **Artifacts**: Screenshots & videos on failure
- **Base URL**: http://localhost:8080

---

## 🌐 Environment Variables

### Development (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_INTERNAL_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### Production (`.env`)
```
NEXT_PUBLIC_API_URL=https://chabaqa.io/api
API_INTERNAL_URL=http://chabaqa-backend:3000/api
NEXT_PUBLIC_APP_URL=https://chabaqa.io
```

**Note**: `JWT_SECRET` is defined in the parent repo `.env`

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
- **Location**: `__tests__/` directories
- **Runner**: Jest with ts-jest preset
- **Environment**: jsdom
- **Coverage Targets**: admin dashboard, admin APIs
- **Examples**: Component, hook, utility tests

### E2E Tests (Playwright)
- **Location**: `e2e/` directory
- **Browsers**: Desktop (3) + Mobile (2) + Edge
- **CI Strategy**: Retry 2x on failure
- **Artifacts**: HTML report, screenshots, videos
- **Auto-start**: Dev server on test run

---

## 🔐 Security Features

### Security Headers (Production)
- ✅ HSTS: 1-year max-age + subdomains
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: camera/mic/geolocation disabled

### API Security
- ✅ Backend proxy (no direct exposure)
- ✅ Video streaming via `/api/video/stream/`
- ✅ JWT authentication with token-manager
- ✅ File upload validation on backend

---

## 📱 Internationalization

- **Library**: next-intl 3.26.5
- **Config**: `i18n/request.ts`
- **Messages**: `messages/` directory
- **Supported**: English, Arabic (expandable)
- **Validation**: Parity checks, hardcoded detection

---

## 🎨 Design System

### Colors (Chabaqa Brand)
```
Primary:     #8e78fb (Purple)
Secondary 1: #f65887 (Sessions - Pink)
Secondary 2: #47c7ea (Courses - Cyan)
Accent:      #ff9b28 (Challenges - Orange)
```

### Custom Animations
- `float` - Floating motion
- `shimmer` - Shimmer effect
- `pulse-glow` - Glowing pulse
- `slide-up` - Slide from bottom
- `slide-in-right` - Slide from right
- `fade-in` - Fade transition
- `bounce-gentle` - Gentle bounce
- `accordion-down/up` - Accordion expand/collapse

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Code Lines** | ~25,952 (TS/TSX) |
| **Route Groups** | 7 grouped |
| **Components** | 13+ categories |
| **API Modules** | 15+ dedicated |
| **Config Files** | 10+ |
| **Dependencies** | 50+ packages |
| **Test Coverage** | Admin + APIs |

---

## 🚀 Build Optimization

- **Standalone Output**: Self-contained build (no node_modules)
- **Tree-shaking**: Optimized for lucide-react
- **Memory**: 2GB Node heap allocation
- **CPU Limit**: 1 CPU for experimental features
- **Image Optimization**: Disabled (custom CDN)

---

## 🆘 Common Issues & Solutions

### Port 8080 in Use
```bash
npm run dev -- -p 3000  # Use different port
```

### Out of Memory During Build
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

### Tests Timeout
```bash
npm run test -- --testTimeout=10000
```

### ESLint Errors Not Blocking Build
This is by design (see `next.config.mjs`). Fix with:
```bash
npx eslint --fix app components lib
```

---

## 📚 Additional Resources

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

### Project Documentation
- `PROJECT_SUMMARY.txt` - Visual overview
- `FRONTEND_STRUCTURE.md` - Detailed architecture
- `QUICK_START.md` - Development reference

---

## ✅ Checklist for New Developers

- [ ] Read `PROJECT_SUMMARY.txt` for overview
- [ ] Read `QUICK_START.md` for development setup
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to start development server
- [ ] Run `npm run lint` to check linting
- [ ] Understand the 7 route groups in `app/`
- [ ] Familiarize yourself with `components/` structure
- [ ] Review `lib/api/` for API client patterns
- [ ] Check `FRONTEND_STRUCTURE.md` for detailed config info

---

## 🔄 Development Workflow

1. **Feature Development**
   ```bash
   npm run dev              # Start dev server
   npm run lint             # Check linting
   ```

2. **Testing**
   ```bash
   npm run test             # Unit tests
   npm run test:e2e        # E2E tests
   ```

3. **Build & Deploy**
   ```bash
   npm run build            # Production build
   npm run start            # Test production build
   ```

---

## 📞 Need Help?

1. Check the relevant documentation file
   - Visual overview? → `PROJECT_SUMMARY.txt`
   - Configuration details? → `FRONTEND_STRUCTURE.md`
   - Quick commands? → `QUICK_START.md`

2. Review common issues in `QUICK_START.md` troubleshooting section

3. Check official documentation links above

---

**Last Updated**: March 29, 2026

This guide is designed to be comprehensive yet practical. Start with the file that best matches your needs!
