# Carter's Care Group Platform - PRD

## Original Problem Statement
Redesign the Carter's Care platform based on provided design mockups, implementing:
- **Option 1**: Professional admin dashboard with light sidebar
- **Option 3**: Friendly worker app with mobile-optimized sub-pages

Later expanded to: "Debug, fix, enhance and polish the entire platform."

Most recent request: Create dedicated mobile-optimized sub-pages for Worker App "Check-In" and "Case Notes".

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
- **Worker Pages**: WorkerHome dashboard
- **Shared Components**: ui-kit.tsx (PageHeader, PrimaryButton, StatusBadge)
- **Layout Components**: AppSidebar.tsx, AppLayout.tsx

### March 25, 2025 - Mobile Worker Pages Integration
- Created `/app/frontend/src/components/WorkerLayout.tsx` - Shared layout with gradient background, header, and bottom navigation
- Created `/app/frontend/src/pages/WorkerCheckIn.tsx` - Mobile-optimized check-in page with GPS, client selector, clock in/out
- Created `/app/frontend/src/pages/WorkerNotes.tsx` - Mobile case notes page with search, filter, and note creation
- Updated `App.tsx` with routes: `/worker/check-in`, `/worker/notes`
- Updated `WorkerHome.tsx` navigation to point to new mobile pages
- Fixed CSS @import order in index.css
- Added allowedHosts to vite.config.ts

## Architecture

```
/app
├── backend/          # FastAPI backend
├── frontend/src/
│   ├── App.tsx              # Main router
│   ├── components/
│   │   ├── AppLayout.tsx    # Admin layout
│   │   ├── AppSidebar.tsx   # Admin sidebar
│   │   ├── WorkerLayout.tsx # Worker mobile layout
│   │   └── ui-kit.tsx       # Shared UI components
│   ├── pages/
│   │   ├── Dashboard.tsx    # Admin dashboard
│   │   ├── WorkerHome.tsx   # Worker home
│   │   ├── WorkerCheckIn.tsx # Mobile check-in
│   │   ├── WorkerNotes.tsx  # Mobile notes
│   │   └── ...             # Other pages
│   └── contexts/
│       └── AuthContext.tsx  # Auth state
```

## Tech Stack
- Frontend: React, TypeScript, Vite, TailwindCSS, Framer Motion
- State: React Query, React Context
- UI: shadcn/ui + custom components
- Auth: Supabase
- Backend: FastAPI + MongoDB

## Prioritized Backlog

### P0 - Critical
- (None currently)

### P1 - High Priority
- Refine worker sub-pages based on user feedback after real usage

### P2 - Medium Priority
- Fix ESLint TypeScript parser configuration
- Backend/data improvements if needed

### P3 - Future Enhancements
- Additional mobile-optimized pages for workers (roster detail, client profiles)
- Push notifications for shift reminders
- Offline support for check-in/out
