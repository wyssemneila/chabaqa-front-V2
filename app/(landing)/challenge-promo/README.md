# Challenge Promotional Page

## Overview
Standalone promotional landing page for individual challenges with countdown timer, full details, and direct join functionality.

## Features

### 🎯 Core Features
- **Real-time Countdown Timer**: Live countdown to challenge start date (days, hours, minutes, seconds)
- **Complete Challenge Information**: Title, description, thumbnail, category, difficulty
- **Pricing Breakdown**: Deposit, completion reward, profit calculation, bonuses
- **Premium Features Display**: Shows all premium perks if applicable
- **Learning Resources**: Preview of available resources with type icons
- **Stats Display**: Participant count, success rate, average rating
- **Direct Join**: Join challenge directly from promo page with Stripe integration
- **Promo Code Support**: Apply discount codes during checkout

### 📱 Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Sticky Pricing Card**: Stays visible on desktop while scrolling
- **Adaptive Typography**: Scales appropriately across devices
- **Touch-friendly**: Large tap targets for mobile users

### 🎨 Design System
- **Consistent with App**: Uses same color scheme and components as main app
- **Gradient Hero**: Eye-catching gradient background with animated elements
- **Card-based Layout**: Clean, modern card design for content sections
- **Smooth Animations**: Subtle transitions and hover effects

### 🔗 Integration
- **Header & Footer**: Includes app header and footer for navigation
- **API Integration**: Fetches real challenge data and stats
- **View Tracking**: Automatically tracks page views
- **Toast Notifications**: User feedback for actions

## Usage

### Opening from Modal
The challenge selection modal includes a "View Full Details" button that opens the promo page in a new tab:

```tsx
<Button onClick={() => {
  const challengeId = String(challenge.id || challenge._id)
  const newWindow = window.open(`/challenge-promo/${challengeId}`, '_blank')
  if (newWindow) newWindow.focus()
}}>
  View Full Details
</Button>
```

### Direct URL
Access directly via: `/challenge-promo/[challengeId]`

## Data Structure

### Challenge Data
- Fetched from `challengesApi.getById(challengeId)`
- Includes: title, description, thumbnail, pricing, tasks, resources, participants

### Stats Data
- Fetched from `challengesApi.getStats(challengeId)`
- Includes: views, starts, completions, ratings

## Components Used
- `Header` & `Footer`: App navigation
- `Button`, `Badge`, `Input`, `Label`: UI components
- `useToast`: User feedback
- Lucide icons: Visual elements

## Metadata
Dynamic metadata generation in `layout.tsx` for SEO and social sharing.

## Future Enhancements
- [ ] Social sharing buttons
- [ ] Testimonials section
- [ ] FAQ section
- [ ] Video preview
- [ ] Related challenges
- [ ] Email capture for reminders
