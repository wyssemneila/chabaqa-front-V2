# Chabaqa Frontend - Quick Start Guide

## 🚀 Quick Commands Reference

### Installation & Setup
```bash
cd /home/ubuntu/chabaqa/chabaqa-frontend
npm install              # Install dependencies
```

### Development
```bash
npm run dev              # Start dev server (http://localhost:8080)
npm run lint             # Check code with ESLint
npm run build            # Production build
npm run start            # Run production build
```

### Testing
```bash
# Unit Tests (Jest)
npm run test             # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# E2E Tests (Playwright)
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Interactive UI mode
npm run test:e2e:headed # Run in visible browser
npm run test:e2e:report # View HTML report
```

### Code Quality
```bash
npm run guard:no-relative-api      # Check for relative API calls
npm run check:browser-compat       # Browser compatibility check
```

### Internationalization
```bash
npm run i18n:check:parity         # Verify translation consistency
npm run i18n:check:hardcoded      # Find hardcoded strings
npm run i18n:translate:ar         # Generate Arabic translations
```

---

## 📁 Project Structure at a Glance

```
chabaqa-frontend/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin dashboard
│   ├── (auth)/              # Authentication (signin, signup, etc.)
│   ├── (landing)/           # Landing & public pages
│   ├── (community)/         # Community routes
│   ├── (creator)/           # Creator dashboard
│   ├── (dashboard)/         # User dashboard
│   └── api/                 # API route handlers
├── components/               # Reusable React components
│   ├── ui/                  # Shadcn/Radix UI components
│   ├── auth/                # Auth components
│   ├── community/           # Community UI
│   ├── layout/              # Layout components
│   └── ...
├── lib/                      # Utilities & helpers
│   ├── api/                 # API clients (15+ modules)
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── permissions/         # Role-based access
│   └── validation/          # Zod schemas
├── hooks/                    # App-level hooks
├── middleware/               # Auth & route guards
├── i18n/                     # i18n configuration
├── messages/                 # Translation strings
├── e2e/                      # Playwright tests
├── __tests__/                # Jest unit tests
└── public/                   # Static assets
```

---

## ⚙️ Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript settings |
| `.eslintrc.json` | ESLint rules |
| `next.config.mjs` | Next.js config |
| `tailwind.config.ts` | Tailwind CSS theme |
| `jest.config.js` | Jest testing config |
| `playwright.config.ts` | E2E testing config |
| `.env` | Environment variables |

---

## 🔧 Common Tasks

### Adding a New Page
1. Create file in `app/(group)/page.tsx`
2. Add route-specific components to `components/`
3. Create tests in `__tests__/`

### Adding a New Component
1. Create in `components/feature-name/`
2. Follow Shadcn/Radix UI patterns
3. Add unit test in `__tests__/`

### Adding an API Integration
1. Create module in `lib/api/feature.api.ts`
2. Use `api-client.ts` for HTTP requests
3. Add authentication via `authenticated-fetch.ts`
4. Define types in `lib/models.ts`

### Fixing Lint Issues
```bash
npm run lint              # See ESLint errors
# Fix manually or:
npx eslint --fix app components lib  # Auto-fix where possible
```

---

## 🌐 Environment Variables

Create `.env.local` for local development:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_INTERNAL_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

**Production** (`.env`):
```
NEXT_PUBLIC_API_URL=https://chabaqa.io/api
API_INTERNAL_URL=http://chabaqa-backend:3000/api
NEXT_PUBLIC_APP_URL=https://chabaqa.io
```

---

## 🧪 Testing Best Practices

### Unit Tests (Jest)
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/signin')
  await page.fill('input[type="email"]', 'user@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Sign In")')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 🚀 Build & Deploy

### Local Build Test
```bash
npm run build              # Creates standalone build
npm run start              # Serves production build
# Visit http://localhost:8080
```

### Docker Build
```bash
docker build -t chabaqa-frontend:latest .
docker run -p 8080:8080 chabaqa-frontend:latest
```

### Security Headers (Automatic)
- ✅ HSTS enabled (1 year)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: camera/mic/geolocation disabled

---

## 🎨 Tailwind CSS & Styling

### Color Palette
```
Primary (Purple):   #8e78fb
Sessions (Pink):    #f65887
Courses (Cyan):     #47c7ea
Challenges (Orange): #ff9b28
```

### Custom Animations
```css
/* Available animations */
animate-float           /* Floating motion */
animate-shimmer         /* Shimmer effect */
animate-pulse-glow      /* Glow pulse */
animate-slide-up        /* Slide from bottom */
animate-slide-in-right  /* Slide from right */
animate-fade-in         /* Fade in */
animate-bounce-gentle   /* Gentle bounce */
```

---

## 🔍 Debugging

### Next.js Debug Mode
```bash
NODE_DEBUG_ENV=true npm run dev
```

### ESLint Debug
```bash
npm run lint -- --debug app/page.tsx
```

### Jest Debug
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
# Then open chrome://inspect in Chrome
```

### Playwright Debug
```bash
PWDEBUG=1 npm run test:e2e
```

---

## 📊 Performance Optimization

- ✅ Standalone Next.js build (no node_modules needed)
- ✅ Tree-shaking optimized for lucide-react
- ✅ Image optimization disabled (custom CDN)
- ✅ 2GB Node heap allocation (prevents OOM)
- ✅ 1 CPU experimental feature optimization

---

## 🆘 Troubleshooting

### Build Fails with Out of Memory
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run build
# Increase if needed
```

### ESLint Errors During Build
- They're ignored by design (see `next.config.mjs`)
- Fix with: `npx eslint --fix .`

### TypeScript Errors During Build
- Also ignored by design
- Check types manually: `npx tsc --noEmit`

### Tests Timeout
```bash
npm run test -- --testTimeout=10000  # Increase timeout
```

### Port 8080 Already in Use
```bash
npm run dev -- -p 3000  # Use different port
# Or: lsof -i :8080 && kill -9 <PID>
```

---

## 📚 Documentation Files

- `FRONTEND_STRUCTURE.md` - Detailed architecture & config
- `QUICK_START.md` - This file
- `.github/workflows/` - CI/CD pipeline configs

---

## 🔗 Useful Links

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

