# 🚀 MAN OF STEEL — Deployment Guide

## Completely Free Hosting Options

This guide covers **three free deployment options** for MAN OF STEEL. The app works out of the box with zero configuration.

---

## 📋 Prerequisites

```bash
# 1. Install Node.js 20+ (LTS)
#    Download from: https://nodejs.org/

# 2. Clone or copy the project
cd man-of-steel

# 3. Install dependencies
npm install

# 4. Verify it runs locally
npm run dev
# Visit http://localhost:3000
```

---

## Option 1: Vercel (Recommended — Easiest)

**Why Vercel:** Zero configuration, automatic HTTPS, global CDN, completely free tier.

### Step-by-Step

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy (from the project directory)
cd man-of-steel
npx vercel

# 3. Follow prompts:
#    - Set up and deploy → Y
#    - Which scope → your Vercel account
#    - Link to existing project → N
#    - Project name → man-of-steel (or your choice)
#    - Directory → ./
#    - Override settings → N

# 4. Your app is live at: https://man-of-steel.vercel.app
```

### Deploy from GitHub (Automatic)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Repository
3. Select `man-of-steel` repo
4. Vercel auto-detects Next.js — click **Deploy**
5. Done! Every push to `main` auto-deploys.

### Set Environment Variables (Optional)

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add OPENROUTER_API_KEY
```

Or via Vercel Dashboard:
- Go to Project → Settings → Environment Variables
- Add variables (all are optional — app works without them)

---

## Option 2: Cloudflare Pages (100% Free)

**Why Cloudflare:** Generous free tier (500 builds/month, unlimited bandwidth), global edge network.

### Step-by-Step

#### Via Cloudflare Dashboard (Manual)

1. **Build the app locally:**
   ```bash
   cd man-of-steel
   npm install
   npm run build
   ```

2. **Create output directory:**
   ```bash
   # Next.js outputs to .next/ but Cloudflare needs static export
   # For Next.js on Cloudflare Pages, use:
   npx @cloudflare/next-on-pages
   ```

3. **Deploy via Cloudflare Dashboard:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click **Create a project** → **Direct Upload**
   - Upload the `.vercel/output/static/` folder

#### Via Git (Recommended)

1. Push to GitHub/GitLab
2. Go to Cloudflare Pages → Create project → Connect Git
3. Select repo
4. Build settings:
   ```plaintext
   Framework preset: Next.js (or None)
   Build command: npx @cloudflare/next-on-pages
   Build output: .vercel/output/static
   ```
5. Click **Save and Deploy**

---

## Option 3: Netlify (Free Tier)

**Why Netlify:** 100GB bandwidth, 300 build minutes/month, instant rollbacks.

### Step-by-Step

#### Via Git

1. Push code to GitHub/GitLab
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select repo
4. Build settings (auto-detected):
   ```plaintext
   Base directory: /
   Build command: npm run build
   Publish directory: .next
   ```
5. Click **Deploy site**

#### Via CLI

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
netlify init

# 4. Deploy
netlify deploy --prod --dir=.next
```

---

## Option 4: Railway (Free Tier + $5 Credit)

**Why Railway:** Easy Node.js hosting with no config needed.

### Step-by-Step

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select repo
4. Railway auto-detects Next.js — no config needed
5. Add environment variables (optional):
   - `NODE_ENV=production`
   - `PORT=3000` (Railway sets this automatically)

---

## Option 5: Render (Free Tier)

**Why Render:** 750 hours/month free, auto HTTPS, persistent disks.

### Step-by-Step

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → **Connect Git**
3. Select repo
4. Configure:
   ```plaintext
   Name: man-of-steel
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Plan: Free
   ```
5. Click **Create Web Service**

---

## 📦 Environment Variables Reference

All variables are **optional** — the app works without any of them:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL for persistent DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase admin key (for seeding) |
| `OPENROUTER_API_KEY` | No | Enables LLM-powered agent responses |
| `OPENROUTER_MODEL` | No | LLM model (default: claude-3.5-sonnet) |

---

## 🔧 Post-Deployment Verification

After deploying, verify everything works:

```bash
# Check the main page
curl https://your-domain.vercel.app/mission-control

# Check API endpoints
curl https://your-domain.vercel.app/api/mission-control
curl https://your-domain.vercel.app/api/assets
```

**Manual checks:**
- [ ] Mission Control loads with metrics and charts
- [ ] Asset Explorer shows all 10 assets
- [ ] AI Copilot accepts queries
- [ ] Reports Center generates PDFs
- [ ] Knowledge Vault searches documents

---

## 💡 Pro Tips

### Tip 1: Custom Domain (Free)
- **Vercel:** Settings → Domains → Add your domain (free with Vercel DNS)
- **Cloudflare:** Pages → Custom domains → Add domain
- **Netlify:** Domain settings → Add custom domain

### Tip 2: Speed Up Deployments
Create `vercel.json` in root:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Tip 3: Monitor Deployments
- **Vercel:** Dashboard → Deployments → View logs
- **Cloudflare:** Pages → Deployment → Build log
- **Netlify:** Deploys → Deploy log

### Tip 4: Rollback if Needed
- **Vercel:** Deployments → Click ⋮ → Promote to Production
- **Cloudflare:** Pages → Deployments → Select version → Rollback
- **Netlify:** Deploys → Click ⋮ → Publish to production

---

## 🐛 Troubleshooting

### "Application error" after deployment
```bash
# Check build logs
# Most common cause: missing node_modules
npm install
npm run build
```

### "Module not found" errors
```bash
# Ensure all dependencies are installed
rm -rf node_modules
npm install
```

### Blank page on load
```bash
# Check browser console for JS errors
# Ensure environment variables are correctly set
# Try: npm run dev locally to verify
```

### API routes return 500
```bash
# The app uses in-memory data — no database needed
# If using Supabase, check connection strings
# Check server logs in hosting dashboard
```

---

## 🏁 Quick Deploy Checklist

- [ ] `npm install` succeeded
- [ ] `npm run build` completed without errors
- [ ] `npm start` works locally
- [ ] All 5 pages render correctly
- [ ] API routes return data (mission-control, assets, etc.)
- [ ] Git repository is pushed to GitHub
- [ ] Deployment platform configured
- [ ] Site is live at custom URL
- [ ] Tested all features in production

---

## 📞 Need Help?

- **Vercel Support:** [vercel.com/docs](https://vercel.com/docs)
- **Cloudflare Pages:** [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Netlify:** [docs.netlify.com](https://docs.netlify.com)
- **Project Issues:** Check README or open GitHub issue

---

*Deployed with ❤️ — making industrial AI accessible to everyone.*
