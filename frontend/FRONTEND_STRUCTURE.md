# Chabaqa Frontend Project Structure & Configuration Report

## 📁 Project Location
- **Root Directory**: `/home/ubuntu/chabaqa/chabaqa-frontend/`
- **Parent Repository**: `/home/ubuntu/chabaqa/`
- **Project Size**: ~25,952 lines of TypeScript/TSX code (excluding node_modules and build artifacts)

---

## 🏗️ Overall Architecture

### Framework & Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **React**: React 19
- **Language**: TypeScript 5
- **CSS Framework**: Tailwind CSS 3.4.17
- **UI Component Library**: Radix UI
- **State Management**: TanStack React Query (React Query) v5.91.3
- **Form Handling**: React Hook Form 7.54.1 + Zod validation
- **Styling**: Styled-JSX 5.1.7 + Tailwind CSS

### Key Dependencies
- **Next.js Ecosystem**: next-intl (i18n), next-themes (dark mode)
- **UI/Animation**: Framer Motion, Embla Carousel, canvas-confetti
- **Data Visualization**: Recharts 2.15.0
- **Real-time**: Socket.io-client 4.8.3
- **Media**: HLS.js 1.6.15 (video streaming)
- **Authentication**: jose 5.10.0 (JWT handling)
- **Drag & Drop**: @dnd-kit packages

---

## 📂 Directory Structure

### Root-Level Directories (Excluding node_modules & .next)

```
chabaqa-frontend/
├── app/                          # Next.js App Router pages & routes
├── components/                   # Reusable React components
├── lib/                          # Utility functions, API clients, hooks
├── public/                       # Static assets
├── hooks/                        # Custom React hooks
├── middleware/                   # Next.js middleware (auth guards, etc.)
├── scripts/                      # Build & utility scripts
├── i18n/                         # Internationalization configuration
├── messages/                     # i18n translation strings
├── e2e/                          # End-to-end tests (Playwright)
├── __tests__/                    # Unit test files
├── docs/                         # Documentation
├── chabaqa-landing-temp/         # Temporary landing page alternate
└── test-results/                 # Test report outputs
```

### App Directory Structure (App Router)

The `app/` directory uses Next.js 15 App Router with grouped route segments:

```
app/
├── (admin)/                      # Admin dashboard routes
├── (auth)/                       # Authentication routes (signin, signup, reset-password)
├── (build-community)/            # Community building wizard
├── (community)/                  # Community pages & dynamic routes
├── (creator)/                    # Creator dashboard
├── (dashboard)/                  # User dashboard
├── (landing)/                    # Landing page & public pages
│   ├── blogs/
│   ├── community/
│   ├── explore/
│   ├── pricing/
│   ├── profile/
│   ├── settings/
│   ├── terms-of-service/
│   └── privacy-policy/
├── api/                          # API route handlers (server-side)
├── components/                   # App-level components
├── internal/                     # Internal utilities
├── middleware/                   # Auth & permission middleware
├── providers/                    # React Context providers
├── community/                    # Community data utilities
├── invitation/                   # Invitation flows
├── konnect-mock-checkout/        # Payment mock
├── ticket/                       # Support ticket handling
└── layout.tsx                    # Root layout
```

### Components Directory (Shared UI Components)

```
components/
├── ui/                           # Shadcn UI components (buttons, modals, etc.)
├── auth/                         # Auth-related components
├── community/                    # Community feature components
├── creator-dashboard/            # Creator-specific UI
├── layout/                       # Layout components (navbar, sidebar, footer)
├── live-support/                 # Live chat/support components
├── media/                        # Video, image, media players
├── notifications/                # Toast & notification components
├── permissions/                  # Permission check components
├── plan/                         # Pricing & plan display
├── profile/                      # User profile components
├── reviews/                      # Review/rating components
└── __tests__/                    # Component unit tests
```

### Lib Directory (Utilities & APIs)

```
lib/
├── api/                          # API client modules
│   ├── affiliate.api.ts
│   ├── admin-api.ts
│   ├── notifications.api.ts
│   ├── payments.api.ts
│   ├── products.api.ts
│   ├── video-playback.api.ts
│   ├── learning-path.api.ts
│   ├── moderation.api.ts
│   └── [15+ more API files]
├── hooks/                        # Custom React hooks
│   ├── useUser.ts
│   ├── use-payment-provider-modal.ts
│   └── use-product-purchase-flow.ts
├── utils/                        # Utility functions
│   ├── video-source.ts
│   ├── device.ts
│   ├── error-messages.ts
│   ├── google-calendar.ts
│   └── event-time.ts
├── permissions/                  # Permission utilities
│   ├── community-roles.ts
│   └── index.ts
├── validation/                   # Zod schema validation
├── plans/                        # Pricing plan logic
├── creator-dashboard/            # Creator utilities
├── i18n/                         # i18n helpers
├── api-client.ts                 # Main API client
├── models.ts                     # TypeScript interfaces/types
├── auth.ts                       # Auth utilities
├── auth.server.ts                # Server-side auth
├── token-manager.ts              # JWT token management
├── data.ts                       # Shared data structures (~35KB)
├── blog-content.ts               # Blog data (~85KB)
├── team.ts                       # Team utilities
└── __tests__/                    # Unit tests for lib
```

---

## ⚙️ Build & Configuration Files

### TypeScript Configuration
- **File**: `tsconfig.json`
- **Key Settings**:
  - `target`: ES6
  - `module`: esnext
  - `jsx`: preserve (Next.js handles JSX)
  - `strict`: true (strict type checking enabled)
  - Path alias: `@/*` maps to root directory
  - Incremental builds enabled

### ESLint Configuration
- **File**: `.eslintrc.json`
- **Base Config**: `next/core-web-vitals`
- **Custom Rules**:
  - `react/no-unescaped-entities`: off
  - `react-hooks/exhaustive-deps`: off
  - `@next/next/no-img-element`: off (allows `<img>` tags)
  - `import/no-anonymous-default-export`: off

### Next.js Configuration
- **File**: `next.config.mjs`
- **Key Features**:
  - **i18n Plugin**: Integrated with `next-intl` for internationalization
  - **Error Handling**: 
    - ESLint errors ignored during builds
    - TypeScript errors ignored during builds
  - **Output**: Standalone mode (self-contained build)
  - **Image Optimization**:
    - Unoptimized images (disabled Next.js optimization)
    - Remote patterns configured for:
      - `api.chabaqa.io` (production)
      - `51.254.132.77:3000` (staging)
      - `localhost:3000/3001` (local dev)
      - External: `picsum.photos`, `ui-avatars.com`, `unsplash.com`
  - **Security Headers**:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: SAMEORIGIN
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: Disables camera, microphone, geolocation
    - HSTS enabled in production
  - **API Rewrites**: Proxies `/api/*` and `/uploads/*` to backend
  - **Backend Integration**:
    - Uses `API_INTERNAL_URL` (container-to-container) for server
    - Falls back to `NEXT_PUBLIC_API_URL` (browser calls)
    - Fallback: `http://localhost:3000/api`

### Tailwind CSS Configuration
- **File**: `tailwind.config.ts`
- **Key Customizations**:
  - **Custom Colors**:
    - Primary: `#8e78fb` (purple)
    - Chabaqa brand colors:
      - Primary: `#8e78fb`
      - Secondary 1 (Sessions): `#f65887` (pink)
      - Secondary 2 (Courses): `#47c7ea` (cyan)
      - Accent (Challenges): `#ff9b28` (orange)
    - Additional: events, products, challenges, courses
  - **Custom Animations**:
    - accordion-down/up
    - float, shimmer, pulse-glow
    - slide-up, slide-in-right, fade-in
    - bounce-gentle
  - **Dark Mode**: Class-based (`darkMode: ["class"]`)
  - **Plugins**: tailwindcss-animate

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**:
  - Preset: `ts-jest`
  - Environment: `jsdom` (for React components)
  - Test Files: `**/__tests__/**/*.test.ts(x)`
  - Coverage: `app/(admin)/**` and `lib/api/admin-api.ts`
  - Module mapping:
    - `@/*` → root directory
    - CSS → identity-obj-proxy (mock)
  - Setup file: `jest.setup.js`

### PostCSS Configuration
- **File**: `postcss.config.mjs`
- **Plugins**: Tailwind CSS

### Playwright E2E Testing
- **File**: `playwright.config.ts`
- **Configuration**:
  - Base URL: `http://localhost:8080`
  - Browsers: Chromium, Firefox, WebKit
  - Mobile: Pixel 5, iPhone 12
  - Desktop Edge/Chrome
  - Auto-retry on CI (2 retries)
  - Screenshots on failure
  - Video on failure
  - Auto-starts dev server on `npm run dev`

---

## 📦 Package.json Scripts

### Build & Development
```bash
npm run build              # Production build (Node option: 2048MB heap)
npm run dev               # Development server on port 8080
npm run start             # Production start on port 8080
npm run lint              # ESLint check
```

### Testing
```bash
npm run test              # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # Playwright headed (visible browser)
npm run test:e2e:chromium    # Chromium only
npm run test:e2e:firefox     # Firefox only
npm run test:e2e:webkit      # WebKit only
npm run test:e2e:mobile      # Mobile browsers
npm run test:e2e:report      # Show report
```

### Code Quality
```bash
npm run guard:no-relative-api       # Guard: prevent relative API calls
npm run check:browser-compat        # Check browser compatibility
```

### Internationalization (i18n)
```bash
npm run i18n:translate:ar           # Translate to Arabic (LibreTranslate)
npm run i18n:check:parity          # Check translation parity
npm run i18n:check:hardcoded       # Find hardcoded strings
npm run i18n:ci                    # CI pipeline checks
```

---

## 🌐 Environment Configuration

### `.env` (Frontend)
```
NEXT_PUBLIC_API_URL=https://chabaqa.io/api
API_INTERNAL_URL=http://chabaqa-backend:3000/api
NEXT_PUBLIC_APP_URL=https://chabaqa.io
```

**Note**: `JWT_SECRET` is defined in the root `.env` (shared repo-wide)

---

## 🧪 Testing Setup

### Jest (Unit Tests)
- **Test Files**: Located in `__tests__/` directories
- **Entry Point**: `jest.setup.js` (configures testing library)
- **Scope**: Components, utilities, hooks
- **Coverage Targets**: Admin dashboard, admin APIs

### Playwright (E2E Tests)
- **Test Files**: `e2e/` directory
- **Browsers**: Desktop (Chrome, Firefox, Safari) + Mobile
- **CI Strategy**: Single worker, 2 retries, auto-failing on `.only`
- **Reporter**: HTML with screenshots/videos on failure

### Development Testing
```bash
npm run test:watch                  # Jest in watch mode
npm run test:e2e:ui                # Playwright interactive UI
npm run test:e2e:headed --headed   # See browser during test
```

---

## 🚀 Build Optimization

### Next.js Build Features
- **Standalone Output**: Self-contained bundle (no `node_modules` needed)
- **Package Import Optimization**: `lucide-react` optimized for tree-shaking
- **CPU Limit**: 1 CPU for experimental features
- **Memory Management**: 2GB heap for Node.js during build

### Memory & Performance Considerations
```bash
NODE_OPTIONS='--max-old-space-size=2048' next build
```
- Custom Node heap allocation to prevent OOM during build

---

## 🔐 Security & Compliance

### Security Headers (Production)
- **HSTS**: 1-year max-age + subdomains + preload
- **CSP Controls**: Referrer policy, frame options, no CORS policies
- **Feature Policy**: Camera, microphone, geolocation disabled
- **Type Safety**: X-Content-Type-Options: nosniff

### API Security
- **Backend Proxy**: `/api/*` proxied to backend (no direct exposure)
- **Video Streaming**: Proxied through `/api/video/stream/` (not direct URLs)
- **Upload Security**: Backend validates file uploads

---

## 📱 Internationalization (i18n)

### System
- **Library**: `next-intl` 3.26.5
- **Configuration**: `i18n/request.ts`
- **Messages**: `messages/` directory
- **Languages Supported**: Multiple (Arabic translation available)

### Validation Scripts
- Parity checks between language files
- Hardcoded string detection
- CI integration for translation consistency

---

## 🎨 Design System

### Brand Colors (Chabaqa)
- **Primary (Purple)**: `#8e78fb`
- **Sessions (Pink)**: `#f65887`
- **Courses (Cyan)**: `#47c7ea`
- **Challenges (Orange)**: `#ff9b28`

### Component Library
- **Radix UI**: 20+ UI components (buttons, dialogs, menus, etc.)
- **Shadcn UI**: Pre-built composable components
- **Custom Animations**: Smooth transitions, pulse effects

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Framework** | Next.js 15.2.4 |
| **React Version** | 19.x |
| **TypeScript** | 5.x (strict mode) |
| **Total Lines of Code** | ~25,952 (TS/TSX) |
| **App Routes** | 7 grouped route segments |
| **Components** | 13+ feature categories |
| **API Modules** | 15+ dedicated API clients |
| **Test Frameworks** | Jest + Playwright |
| **CSS Framework** | Tailwind CSS |
| **Styling** | Tailwind + Styled-JSX |
| **Node Version** | 2GB heap allocated |

---

## 🔧 Build Pipeline Summary

### Development Workflow
1. **Install**: `npm install`
2. **Dev Server**: `npm run dev` (http://localhost:8080)
3. **Lint**: `npm run lint` (ESLint)
4. **Test**: `npm run test` (Jest) + `npm run test:e2e` (Playwright)
5. **Build**: `npm run build` (Next.js standalone)
6. **Run**: `npm run start` (Production server)

### CI/CD Considerations
- ESLint & TypeScript errors ignored during build (configured)
- i18n parity checks in CI pipeline
- E2E tests with retry logic on CI
- Coverage collection for admin dashboard

---

## 📋 Configuration Files Summary

| File | Purpose | Format |
|------|---------|--------|
| `tsconfig.json` | TypeScript compilation | JSON |
| `.eslintrc.json` | Linting rules | JSON |
| `next.config.mjs` | Next.js settings | MJS |
| `tailwind.config.ts` | Tailwind CSS theme | TS |
| `postcss.config.mjs` | CSS processing | MJS |
| `jest.config.js` | Jest testing | CJS |
| `playwright.config.ts` | E2E testing | TS |
| `.eslintrc.json` | ESLint config | JSON |
| `.env` | Environment variables | Plain text |
| `components.json` | Shadcn CLI config | JSON |
| `.browserslistrc` | Browser support | Plain text |

---

## 🎯 Key Takeaways

1. **Modern Stack**: Next.js 15 App Router with React 19
2. **Type-Safe**: Full TypeScript with strict mode enabled
3. **Scalable Components**: Radix UI + Tailwind CSS design system
4. **Comprehensive Testing**: Jest unit tests + Playwright E2E
5. **Internationalization**: Built-in i18n with `next-intl`
6. **Production Ready**: Security headers, API proxying, error handling
7. **Development-Friendly**: Dev server on port 8080, watch mode, UI testing
8. **Modular Architecture**: Clear separation of concerns (api, components, hooks, utils)

