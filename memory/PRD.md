# Carter's Care Group Platform - PRD

## Original Problem Statement
Redesign the Carter's Care platform based on provided design mockups, with comprehensive portal upgrades.

## User Personas
1. **Admin Users**: Manage staff, clients, roster, compliance, financials, reports
2. **Worker Users**: Clock in/out for shifts, write case notes, view roster and clients on mobile

## What's Been Implemented

### April 2025 - Latest Updates (Current Session)

#### Timesheet Approval Workflow (P2)
- Status filter dropdown (all, pending, submitted, approved, rejected, paid)
- Checkbox selection for pending/submitted timesheets
- "Select All Pending" button for bulk selection
- Approval dialog with approve/reject options and notes
- Bulk approve/reject multiple timesheets at once

#### Invoice Generation from Timesheets (P1)
- Invoice generator dialog for approved timesheets
- Staff/subcontractor selector
- Configurable hourly rate
- Auto-calculated total hours and amount
- CSV invoice download with line items

#### Document Upload for HR Docs (P1)
- Expandable staff list showing document status
- 8 HR document types (contract, police check, WWCC, first aid, NDIS screening, driver's license, qualifications, visa)
- Upload dialog with document type, number, and expiry date
- File upload support (PDF, JPG, PNG, DOC up to 10MB)
- Visual status indicators (valid, expiring soon, expired)

#### Maureen AI Avatar Upgrade
- Updated Maureen's chatbot with new uploaded avatar image

### April 2025 - Portal Upgrades (Previous Session)

#### New Navigation Structure
**Staff Section (Admin):**
- All Staff - Main staff list
- HR & Onboarding - Employment docs, police checks, WWCC, qualifications
- Training - NDIS worker training, aged care modules (dementia, Parkinson's, stroke/heart attack)
- Compliance - Staff compliance records

**Clients Section:**
- All Clients - Main client list with notes integration
- Care Plans - "About Me", daily living, health, goals, support network
- Risk & Safety - Risk assessments, safety plans, emergency protocols

**My Profile Section (Workers):**
- My Roster - Personal weekly roster with shift details
- My Certs - Personal compliance/certification documents
- My Timesheets - Auto-generated from check-ins, submit for approval

**Other Updates:**
- Incidents - Can be linked to client or general work incident
- Financials - Unchanged
- Reports - Unchanged
- Settings - Unchanged

#### UI/UX Improvements
1. **Collapsible Sidebar Groups** - Staff and Clients sections collapse/expand
2. **Fixed Sidebar Scroll** - No longer jumps to top when clicking nav items
3. **Maureen Chatbot Photo** - Replaced speech bubble with welcoming photo

#### New Pages Created
- `/app/frontend/src/pages/StaffHR.tsx` - HR documents management
- `/app/frontend/src/pages/StaffTraining.tsx` - Training modules with NDIS & aged care content
- `/app/frontend/src/pages/ClientCarePlans.tsx` - Care plan management
- `/app/frontend/src/pages/ClientRisk.tsx` - Risk assessments & safety plans
- `/app/frontend/src/pages/MyRoster.tsx` - Worker's personal roster view
- `/app/frontend/src/pages/MyTimesheets.tsx` - Worker's timesheet management

### Previous Sessions
- Complete platform redesign (Option 1 admin, Option 3 worker)
- Mobile-optimized worker pages (Check-In, Notes)
- Error boundaries, loading skeletons, empty states
- Form validation improvements
- Accessibility enhancements

## Architecture

```
/app/frontend/src/
├── App.tsx                    # Routes with new structure
├── components/
│   ├── AppSidebar.tsx         # Collapsible navigation
│   ├── AIChatbot.tsx          # Maureen with photo
│   ├── ErrorBoundary.tsx
│   ├── LoadingSkeletons.tsx
│   └── EmptyStates.tsx
├── pages/
│   ├── Staff.tsx              # All Staff
│   ├── StaffHR.tsx            # HR & Onboarding
│   ├── StaffTraining.tsx      # Training Modules
│   ├── Clients.tsx            # All Clients
│   ├── ClientCarePlans.tsx    # Care Plans
│   ├── ClientRisk.tsx         # Risk & Safety
│   ├── MyRoster.tsx           # Worker Roster
│   ├── MyTimesheets.tsx       # Worker Timesheets
│   └── ...
└── assets/
    └── maureen.png            # Maureen's photo
```

## Tech Stack
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- State: React Query, React Context
- UI: shadcn/ui + custom components
- Auth: Supabase
- Backend: FastAPI + MongoDB (Supabase for most features)

## Mocked Features (Demo Data)
- Training completion percentages (StaffTraining.tsx)
- My Roster shifts (MyRoster.tsx)
- My Timesheets entries (MyTimesheets.tsx)

## Routes Summary

| Route | Access | Description |
|-------|--------|-------------|
| / | Admin | Dashboard |
| /staff | Admin | All Staff |
| /staff/hr | Admin | HR & Onboarding |
| /staff/training | Admin | Training Modules |
| /staff/compliance | Admin | Staff Compliance |
| /clients | All | All Clients |
| /clients/care-plans | All | Care Plans |
| /clients/risk | All | Risk & Safety |
| /roster | All | Main Roster |
| /timesheets | All | All Timesheets |
| /invoices | All | Invoices |
| /incidents | All | Incidents |
| /my-roster | All | My Roster |
| /my-compliance | All | My Certs |
| /my-timesheets | All | My Timesheets |
| /financials | Admin | Financials |
| /reports | Admin | Reports |
| /settings | Admin | Settings |
| /worker | All | Worker Dashboard |
| /worker/check-in | All | Mobile Check-In |
| /worker/notes | All | Mobile Notes |

## Prioritized Backlog

### P0 - Critical
- (None - all requested features implemented)

### P1 - High Priority
- Connect training modules to actual LMS/training provider
- Add Supabase storage bucket for HR documents (currently records without files)

### P2 - Medium Priority
- Add timesheet approval notifications (email/push)
- Fix ESLint TypeScript parser configuration
- Add notification for expiring compliance documents

### P3 - Future Enhancements
- Dark mode support
- Push notifications for shift reminders
- Offline support for check-in/out
- Export timesheets/invoices to PDF
