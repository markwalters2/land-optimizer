# Deployment Guide

## Quick Deployment to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. **Create GitHub repository:**
   ```bash
   cd /Users/rookbot/.openclaw/workspace/land-optimizer
   git init
   git add .
   git commit -m "Initial commit: Land Use Optimizer frontend"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"
   - Your app will be live in ~2 minutes at `https://<project-name>.vercel.app`

3. **Custom Domain:**
   - In Vercel dashboard → Settings → Domains
   - Add your custom domain (e.g., `land-optimizer.specialtyinsurance.sc`)
   - Update DNS records as instructed by Vercel
   - SSL certificate is automatically provisioned

### Option 2: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd /Users/rookbot/.openclaw/workspace/land-optimizer
   vercel
   ```

4. **Follow prompts:**
   - Link to existing project or create new
   - Confirm settings
   - Deploy

### Option 3: Manual Build + Static Hosting

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Export static files (if needed):**
   ```bash
   npm run export  # If you add this script to package.json
   ```

3. **Upload to hosting:**
   - Upload `.next/` folder to your server
   - Configure Node.js server to run `npm start`
   - Or use static export for CDN hosting

## Environment Variables

For production, set these in Vercel dashboard (Settings → Environment Variables):

```env
# Email service (when integrated)
RESEND_API_KEY=your_resend_api_key_here

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# API endpoints (when AI generation is ready)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Post-Deployment Checklist

- [ ] Test all user flows (hero → facility → map → constraints → results)
- [ ] Test email capture modal
- [ ] Verify map drawing works (Leaflet loads correctly)
- [ ] Test mobile responsiveness
- [ ] Test "Get Insurance Quote" CTA redirects correctly
- [ ] Check performance with Lighthouse
- [ ] Set up analytics tracking
- [ ] Monitor error tracking (Sentry, etc.)

## Performance Optimization

### Images
- Add facility type images to `public/` folder
- Use Next.js `<Image>` component for optimization
- Enable image optimization in `next.config.ts`

### Fonts
- Currently using system fonts (Arial)
- Consider adding custom fonts via `next/font`

### Code Splitting
- Already handled by Next.js automatically
- Each component is lazy-loaded as needed

### Caching
- Static assets cached by default
- API routes can add cache headers when integrated

## Monitoring

### Recommended Tools
- **Vercel Analytics** - Built-in, free tier available
- **Google Analytics 4** - User behavior tracking
- **Sentry** - Error tracking and monitoring
- **Plausible** - Privacy-friendly analytics alternative

### Key Metrics to Track
1. **Conversion funnel:**
   - Hero → Facility selector (%)
   - Facility → Map complete (%)
   - Map → Constraints submit (%)
   - Constraints → Results view (%)
   - Results → Email capture (%)
   - Email capture → Quote request (%)

2. **Technical metrics:**
   - Page load time
   - Time to interactive
   - Map load time
   - Mobile vs desktop usage

3. **Lead quality:**
   - Email capture rate
   - Quote request rate
   - Facility type distribution

## Troubleshooting

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Check that `node_modules/` is not in `.gitignore` for build

### Map not loading
- Check browser console for Leaflet errors
- Verify Leaflet CSS is imported correctly
- Ensure dynamic imports are working (SSR issue)

### Slow build times
- Current build time: ~10-15 seconds
- If slower, check for large dependencies
- Consider code splitting optimization

### Email capture not working
- API route needs to be implemented
- Check environment variables are set
- Verify email service credentials

## Rollback Procedure

If deployment has issues:

1. **Vercel:** Go to Deployments → Select previous working deployment → Promote to Production
2. **Git:** `git revert <commit-hash>` → `git push`
3. **Instant rollback** - No downtime

## Scaling Considerations

Current setup supports:
- **Traffic:** 10k+ concurrent users (Vercel handles this)
- **API calls:** None yet (future consideration)
- **Database:** None (future consideration for lead storage)

When you add backend features:
- Consider Vercel Edge Functions for low latency
- Use Vercel KV or Postgres for data storage
- Implement rate limiting on API routes
- Add caching layer (Redis, CDN)

---

**Support:** For deployment issues, contact mark.walters@joinalliancerisk.com
