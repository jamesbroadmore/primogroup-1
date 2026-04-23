# Carter's Care Group Platform - PRD

## Original Problem Statement
Redesign the Carter's Care platform based on provided design mockups, implementing:
- **Option 1**: Professional admin dashboard with light sidebar
- **Option 3**: Friendly worker app with mobile-optimized sub-pages

Later expanded to: "Debug, fix, enhance and polish the entire platform."

## User Personas
1. **Admin Users**: Manage staff, clients, roster, compliance, financials, reports
2. **Worker Users**: Clock in/out for shifts, write case notes, view roster and clients on mobile

## Core Requirements

### Admin Dashboard (Option 1)
- Professional light sidebar design
- Redesigned header with user info
- Metric cards with clean styling
- Consistent UI across all admin pages

### Worker App (Option 3)
- Friendly mobile-first dashboard
- Bottom navigation bar
- Quick action cards for Check-In and Notes
- Mobile-optimized sub-pages for critical tasks

## What's Been Implemented

### March 2025 - Complete Platform Redesign
- **Admin Pages**: Dashboard, Staff, Clients, Roster, CaseNotes, Incidents, ShiftCheckIn, Timesheets, Compliance, Reports, Financials, MyCompliance, Onboarding, SettingsPage, Invoices
- **Worker Pages**: WorkerHome dashboard, WorkerCheckIn, WorkerNotes
- **Shared Components**: ui-kit.tsx (PageHeader, PrimaryButton, StatusBadge)
- **Layout Components**: AppSidebar.tsx, AppLayout.tsx, WorkerLayout.tsx

### April 2025 - Debug, Fix, Enhance & Polish
**Fixes:**
- Fixed CSS @import order - moved Google Fonts to HTML head
- Added React Router v7 future flags (v7_startTransition, v7_relativeSplatPath) - eliminated console warnings
- Fixed vite.config.ts port configuration for deployment

**Enhancements:**
- Added ErrorBoundary component with graceful error handling and retry functionality
- Implemented lazy loading with Suspense for non-critical pages (improves initial load time)
- Created LoadingSkeletons.tsx with various skeleton components (PageSkeleton, CardSkeleton, ListSkeleton, etc.)
- Created EmptyStates.tsx with pre-configured empty state components for common scenarios
- Created PageTransition.tsx with smooth page transition animations

**Polish:**
- Enhanced Login page with:
  - Real-time form validation with animated error messages
  - Proper accessibility attributes (aria-invalid, aria-describedby, autocomplete)
  - Labels associated with inputs using htmlFor
  - Focus ring styles
  - Loading state feedback
- Redesigned 404 page with:
  - Large visual "404" with search icon overlay
  - Go Back and Go Home buttons
  - Displays attempted path
- Added CSS utilities for:
  - Focus ring styles for keyboard navigation
  - Skip link styles for accessibility
  - Reduced motion preference support
  - Custom scrollbar styles
  - Scrollbar-none utility

**Code Quality:**
- Added data-testid attributes throughout for testing
- Optimized React Query defaults (staleTime, refetchOnWindowFocus)
- TypeScript compiles without errors

## Architecture

```
/app
├── backend/          # FastAPI backend
├── frontend/src/
│   ├── App.tsx              # Main router with ErrorBoundary & Suspense
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles with accessibility utilities
│   ├── components/
│   │   ├── AppLayout.tsx    # Admin layout
│   │   ├── AppSidebar.tsx   # Admin sidebar
│   │   ├── WorkerLayout.tsx # Worker mobile layout
│   │   ├── ErrorBoundary.tsx    # Error boundary component
│   │   ├── LoadingSkeletons.tsx # Skeleton loading components
│   │   ├── EmptyStates.tsx      # Empty state components
│   │   ├── PageTransition.tsx   # Page transition animations
│   │   └── ui-kit.tsx       # Shared UI components
│   ├── pages/
│   │   ├── Dashboard.tsx    # Admin dashboard
│   │   ├── WorkerHome.tsx   # Worker home
│   │   ├── WorkerCheckIn.tsx # Mobile check-in
│   │   ├── WorkerNotes.tsx  # Mobile notes
│   │   ├── Login.tsx        # Enhanced login with validation
│   │   ├── NotFound.tsx     # Polished 404 page
│   │   └── ...             # Other pages
│   └── contexts/
│       └── AuthContext.tsx  # Auth state
```

## Tech Stack
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- State: React Query, React Context
- UI: shadcn/ui + custom components
- Auth: Supabase
- Backend: FastAPI + MongoDB

## Deployment
- **Emergent**: Ready (health check passed)
- **Vercel**: Ready (vercel.json configured)

## Prioritized Backlog

### P0 - Critical
- (None currently - all critical items resolved)

### P1 - High Priority
- Refine worker sub-pages based on user feedback after real usage

### P2 - Medium Priority
- Fix ESLint TypeScript parser configuration (non-blocking)
- Backend/data improvements if requested

### P3 - Future Enhancements
- Additional mobile-optimized pages for workers (roster detail, client profiles)
- Push notifications for shift reminders
- Offline support for check-in/out
- Dark mode support
