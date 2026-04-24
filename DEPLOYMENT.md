# Vercel Deployment Guide - Primo Pools

## Quick Start

### 1. Prerequisites
- GitHub account with `cdxidigital/primogroup` access
- Vercel account (free tier OK)
- Node.js 20+

### 2. Initial Setup

#### Step A: Create Vercel Project
```bash
npm install -g vercel
vercel login
vercel link
```

#### Step B: Set GitHub Secrets
In GitHub repo → Settings → Secrets and variables → Actions

**Required Secrets:**
```
VERCEL_TOKEN          → Get from Vercel dashboard
VERCEL_PROJECT_ID     → From vercel.json or Vercel dashboard
VERCEL_ORG_ID         → From Vercel account settings
```

#### Step C: Deploy
```bash
git push origin main  # Auto-triggers GitHub Actions → Vercel deploy
```

### 3. Configure Environment

**In Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Add from `.env.example`:
   - `VITE_API_URL`
   - `DATABASE_URL` (if using Neon)
   - `SMTP_HOST`, `SMTP_PASSWORD`
   - `CONTACT_EMAIL`

### 4. Connect Custom Domain

**In Vercel Dashboard:**
1. Settings → Domains
2. Add `primopools.com.au`
3. Update DNS records:
   ```
   A       primopools.com.au     76.76.19.120
   CNAME   www                   cname.vercel-dns.com
   ```

### 5. Monitor Deployments

**Via Vercel Dashboard:**
- Deployments tab shows all deploys
- Logs tab for debugging

**Via GitHub Actions:**
- Actions tab shows CI/CD pipeline
- PR comments show preview URLs

### 6. Rollback (if needed)
```bash
vercel rollback          # Revert to previous deployment
```

## Troubleshooting

**Build fails?**
- Check `npm run build` locally: `npm run build`
- Verify Node version: `node --version`
- Check GitHub Actions logs

**404 on routes?**
- Ensure `vercel.json` routes configured
- SPA catch-all: `"src": "/(.*)", "dest": "/index.html"`

**Environment variables not loading?**
- Add to Vercel dashboard (not GitHub Secrets)
- Prefix frontend vars with `VITE_`
- Restart deployment after adding

## Performance Tips

✅ **Enable Caching**
- Vercel → Settings → Caching
- `dist/` files: 1 year
- HTML: No-cache

✅ **Optimize Images**
- Use Vercel Image Optimization
- `<Image src={} priority />`

✅ **Monitor Core Web Vitals**
- Vercel Dashboard → Analytics
- Target: LCP < 2.5s, CLS < 0.1, FID < 100ms

## Cost Estimation

| Plan | Price | Best For |
|------|-------|----------|
| **Hobby (Free)** | $0 | Dev/testing |
| **Pro** | $20/mo | Production sites |
| **Enterprise** | Custom | High-traffic |

**Primo Pools → Pro plan recommended** (~500+ projects, e-commerce potential)

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Contact**: Support via Vercel dashboard