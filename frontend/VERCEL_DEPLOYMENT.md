# Carter's Care Platform - Vercel Deployment Guide

## Overview
This is a React/Vite frontend application that connects to Supabase for authentication and data storage.

## Prerequisites
- Vercel account
- Supabase project with required tables and Edge Functions

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory

### 2. Configure Build Settings
Vercel should auto-detect these, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Set Environment Variables
In Vercel Project Settings > Environment Variables, add:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_URL` | `https://[project-id].supabase.co` |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://[project-id].supabase.co/functions/v1` |

### 4. Deploy
Click "Deploy" and Vercel will build and deploy your application.

## Post-Deployment

### Update Supabase Auth Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Custom Domain (Optional)
1. In Vercel Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase Auth settings with new domain

## Environment Variables Reference

```env
# Required
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_FUNCTIONS_URL="https://your-project.supabase.co/functions/v1"
```

## Troubleshooting

### Build Failures
- Ensure all environment variables are set in Vercel
- Check that `VITE_` prefix is used for all client-side env vars

### Auth Issues
- Verify Supabase redirect URLs include your Vercel domain
- Check browser console for CORS errors

### 404 on Page Refresh
- The `vercel.json` includes rewrites for SPA routing
- If issues persist, check that `vercel.json` is in the frontend root

## Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State**: React Query + React Context
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
