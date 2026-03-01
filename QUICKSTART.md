# Quick Start Guide

Get the Land Use Optimizer running in 2 minutes.

## Prerequisites

- Node.js 18+ installed ([download](https://nodejs.org/))
- Terminal/Command line access

## Installation & Run

```bash
# 1. Navigate to the project
cd /Users/rookbot/.openclaw/workspace/land-optimizer

# 2. Install dependencies (first time only)
npm install

# 3. Run development server
npm run dev
```

**Open browser:** http://localhost:3000

That's it! 🚀

## Available Commands

```bash
npm run dev      # Start development server (with hot reload)
npm run build    # Build for production
npm start        # Run production build locally
npm run lint     # Check code quality
```

## Project Structure (Where to Find Things)

```
land-optimizer/
├── app/
│   ├── page.tsx           # Main app (state management, flow control)
│   ├── layout.tsx         # Metadata, global layout
│   └── globals.css        # Styles
│
├── components/
│   ├── Hero.tsx           # Landing page
│   ├── FacilitySelector.tsx   # Choose facility type
│   ├── MapInterface.tsx   # Draw property boundaries
│   ├── ConstraintForm.tsx # Budget/parking/requirements
│   ├── ResultsDisplay.tsx # Show optimized layout
│   └── EmailCapture.tsx   # Email lead capture
│
├── README.md              # Full documentation
├── DEPLOYMENT.md          # How to deploy to Vercel
├── INTEGRATION.md         # Backend API integration guide
└── QUICKSTART.md          # This file
```

## User Flow

1. **Hero Page** → Click "Start Designing Now"
2. **Facility Selector** → Choose facility type (paintball, airsoft, etc.)
3. **Map Interface** → Draw property boundaries on map
4. **Constraint Form** → Enter budget, parking, requirements
5. **Results Display** → View optimized layout + get insurance quote

## Making Changes

### Change Colors

Edit `tailwind.config.ts`:
```typescript
neon: {
  green: '#39FF14',      // Change this
  greenDark: '#2DD10D',  // And this
}
```

### Add Facility Type

Edit `components/FacilitySelector.tsx`:
```typescript
const facilities = [
  // ... existing
  {
    type: 'new_type',
    name: 'New Facility Type',
    icon: '🎪',
    description: 'Description here'
  }
];
```

Update type in `app/page.tsx`:
```typescript
export type FacilityType = 'paintball' | 'airsoft' | ... | 'new_type' | null;
```

### Change Default Map Location

Edit `components/MapInterface.tsx`:
```typescript
const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
//                                           ^^^ LAT   ^^^ LNG    ^^ ZOOM
```

## Common Issues

### Port 3000 already in use?

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Map not loading?

- Check browser console for errors
- Leaflet CSS must be imported in `globals.css`
- Try clearing browser cache

### Build errors?

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

- **Deploy:** See `DEPLOYMENT.md` for Vercel deployment
- **Backend:** See `INTEGRATION.md` for AI layout generation API
- **Customize:** Edit components to match your branding

## Support

Questions? Check the full `README.md` or contact:
- **Email:** mark.walters@joinalliancerisk.com
- **Project:** Alliance Risk Insurance Services LLC

---

**Ready to build?** `npm run dev` and start coding! 💻
