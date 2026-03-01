# Land Optimizer

> AI-powered site layout tool for paintball, airsoft, archery, and specialty recreation facilities.
> Lead-gen front-end for [Specialty Insurance SC](http://specialtyinsurancesc.com).

**Live:** https://land-optimizer.vercel.app

---

## What It Does

Land Optimizer takes a user-drawn property boundary and generates an optimized facility layout including:

- Playing field placement (orientation-aware, slope-aware)
- Parking lot with entrance/exit gaps sized to road access
- Support facilities: Registration, Staging Area, Restrooms, Air Station
- Walkway network: perimeter, spine, entrance (threads through parking lot IN gap), inter-field
- Grading cost estimate from real elevation data (NED 10m for US, SRTM 30m fallback)
- Budget breakdown and feasibility PDF export
- Email lead capture → Cloudflare KV → routed to SISC insurance quote

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native, SSR for API routes |
| Map drawing | Leaflet + leaflet-draw | Free, no API key |
| Satellite tiles | Esri World Imagery | Free, global coverage |
| Geocoding | Nominatim (OSM) | Free, no key |
| Road detection | Overpass API (OSM) | Free, detects `highway=*` near property |
| Elevation | OpenTopoData (NED 10m / SRTM 30m) | Free, US + global |
| PDF export | jsPDF + jspdf-autotable | Client-side, no Puppeteer |
| Lead storage | Cloudflare KV (REST API) | Free tier, Mark's existing CF account |
| Deploy | Vercel | Auto-deploy on push to `main` |

---

## Project Structure

```
land-optimizer/
├── app/
│   ├── page.tsx                  # Main wizard (4 steps)
│   ├── globals.css
│   └── api/
│       ├── generate-layout/
│       │   └── route.ts          # POST: runs optimizer, fetches elevation
│       ├── capture-lead/
│       │   └── route.ts          # POST: writes lead to CF KV
│       └── leads/
│           └── route.ts          # GET: admin endpoint (secret-gated, CSV export)
├── components/
│   ├── MapInterface.tsx          # Leaflet draw + address search + mobile block
│   ├── ResultsDisplay.tsx        # Leaflet results map + canvas site plan + PDF export
│   └── EmailCapture.tsx          # Modal email capture with lead context
├── lib/
│   ├── layoutOptimizer.ts        # Core optimizer engine (all geometry + costs)
│   ├── facilityStandards.ts      # Field specs by facility type + budget tier
│   └── generatePDF.ts            # jsPDF multi-page feasibility report
├── public/
└── package.json
```

---

## Optimizer Engine (`lib/layoutOptimizer.ts`)

### Key Types

```typescript
OptimizationRequest {
  property: PropertyBounds;       // GeoJSON polygon from Leaflet draw
  facilityType: FacilityType;     // 'paintball' | 'airsoft' | 'archery' | 'multi'
  constraints: {
    budget: number;
    utilities?: { water, electric, sewer };
  };
  entryPoint?: EntryPoint;        // { side, fraction, roadName } — detected via Overpass
  elevationData?: ElevationData;  // 8x8 grid from OpenTopoData
}

OptimizationResult {
  layout: {
    fields: Field[];              // Playing fields with position, dims, slope%, cost
    facilities: Facility[];       // Support buildings (Registration always nearest parking)
    walkways: Walkway[];          // perimeter / spine / entrance / inter-field
    parking: { spaces, area, cost };
    parkingLot?: ParkingLot;      // Full lot geometry with entrance/exit gaps
    entryPoint?: EntryPoint;
  };
  metrics: { totalArea, usableArea, utilizationPercent, fieldCount, maxCapacity };
  costEstimate: { fields, facilities, parking, grading, permits, total };
  warnings: string[];
  recommendations: string[];
}
```

### Layout Algorithm

1. **Coordinate system** — local feet from bounding box top-left (x right, y down)
2. **Entry detection** — Overpass query finds nearest road; picks `south/north/east/west` side
3. **Facility strip** — bottom (south entry) or relevant edge; depth = `min(150ft, shortEdge × 0.22)`
4. **Field placement** — tries both orientations; more fields wins; slope tie-breaks
5. **Slope filtering** — fields on >15% slope auto-removed with warning
6. **Parking lot** — right 45% of facility strip; 24ft drive aisle, 9×18ft stalls, 2 gaps (IN at 25%, OUT at 65%)
7. **Facility placement** — right-to-left from parking edge so Registration is always first (nearest parking)
8. **Walkways** — entrance path threads through parking lot IN gap → across to Registration → center

### Elevation & Grading Costs

| Slope | Cost/sq ft |
|---|---|
| <2% (flat) | $0 |
| 2–5% (gentle) | $3 |
| 5–10% (moderate) | $8 |
| >10% (steep) | $20 |

Fields on >15% slope are removed entirely (unsafe without major earthworks).

---

## API Routes

### `POST /api/generate-layout`

```json
{
  "property": { "type": "Polygon", "coordinates": [[...]] },
  "facilityType": "paintball",
  "constraints": { "budget": 300000 },
  "entryPoint": { "side": "south", "fraction": 0.5, "roadName": "Commerce St" }
}
```

Returns full `OptimizationResult`. Elevation fetch is server-side (6s timeout, graceful fallback).

### `POST /api/capture-lead`

```json
{
  "email": "owner@example.com",
  "facilityType": "paintball",
  "budget": 300000,
  "fieldCount": 3,
  "totalArea": 217800,
  "address": "123 Main St, Dallas TX",
  "source": "email-capture | mobile-block"
}
```

Writes to CF KV key `lead:{timestamp}:{email}`.

### `GET /api/leads?secret=land-optimizer-leads-2026`

Returns all leads as JSON. Add `&format=csv` for spreadsheet export.

---

## Cloudflare KV (Lead Storage)

- **Namespace:** `LAND_OPTIMIZER_LEADS`
- **Namespace ID:** `d4ccfa6db3e5429da0e533ada64ef9c0`
- **Account:** `dd378e45fd765350c7894447ca060904` (mark.walters.2@gmail.com)
- **Admin URL:** `https://land-optimizer.vercel.app/api/leads?secret=land-optimizer-leads-2026`

---

## Environment Variables (Vercel)

| Var | Purpose |
|---|---|
| `CF_ACCOUNT_ID` | Cloudflare account for KV writes |
| `CF_API_KEY` | Cloudflare global API key |
| `CF_API_EMAIL` | Cloudflare account email |
| `CF_KV_NS_ID` | KV namespace ID |
| `LEADS_SECRET` | Admin endpoint auth token |

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build check
npx tsc --noEmit  # type check only
```

---

## Deploy

Pushes to `main` auto-deploy via Vercel GitHub integration.

Manual deploy (fallback):
```bash
npx vercel --prod
```

---

## Insurance CTA

The insurance quote CTA links to:
```
http://specialtyinsurancesc.com  (swap to production domain once DNS resolves)
```

TODO: add URL params (`?facilityType=paintball&budget=300000&fields=3`) once SISC WP site has a landing page that accepts them.

---

## Mobile

The map drawing step (Leaflet draw) requires a mouse and does not work on touch screens. Mobile visitors see a graceful block screen with email capture ("Remind me on desktop"). The landing page, constraints form, and results display are fully responsive.

---

## Remaining Roadmap

| # | Feature | Status |
|---|---|---|
| ② | Insurance CTA with URL params | Pending |
| ③ | Demo/example button (one-click pre-fill) | Pending |
| ⑤ | Shareable URL (`?data=base64`) | Pending |
| ⑧ | PDF export ✓ | Done |

---

## Credits

Built by [Rook](https://openclaw.ai) for [Specialty Insurance SC](http://specialtyinsurancesc.com) / Alliance Risk.
