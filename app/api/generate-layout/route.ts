import { NextRequest, NextResponse } from 'next/server';
import { optimizeLayout, OptimizationRequest, ElevationData } from '@/lib/layoutOptimizer';

// ── Elevation fetch ────────────────────────────────────────────────────────────

const GRID_ROWS = 8;
const GRID_COLS = 8;

/** True if the bbox center falls within CONUS + Alaska/Hawaii bounds */
function isUSBbox(minLat: number, maxLat: number, minLng: number, maxLng: number): boolean {
  const cLat = (minLat + maxLat) / 2;
  const cLng = (minLng + maxLng) / 2;
  return cLat >= 18 && cLat <= 72 && cLng >= -180 && cLng <= -65;
}

async function fetchElevationGrid(
  minLat: number, maxLat: number,
  minLng: number, maxLng: number
): Promise<ElevationData> {
  // Build evenly-spaced sample grid
  const points: { lat: number; lng: number }[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const lat = minLat + (r / (GRID_ROWS - 1)) * (maxLat - minLat);
      const lng = minLng + (c / (GRID_COLS - 1)) * (maxLng - minLng);
      points.push({ lat, lng });
    }
  }

  const dataset = isUSBbox(minLat, maxLat, minLng, maxLng) ? 'ned10m' : 'srtm30m';
  const locStr = points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');

  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/${dataset}?locations=${locStr}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) throw new Error(`OpenTopoData HTTP ${res.status}`);

    const data = await res.json();
    const rawResults: { elevation: number | null }[] = data.results;

    // Build elevation grid — handle null elevations gracefully
    const rawGrid: (number | null)[][] = [];
    let nullCount = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      rawGrid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const val = rawResults[r * GRID_COLS + c]?.elevation ?? null;
        rawGrid[r][c] = val;
        if (val === null) nullCount++;
      }
    }
    // >25% null = insufficient coverage, fall back to flat
    if (nullCount > GRID_ROWS * GRID_COLS * 0.25) {
      throw new Error(`Insufficient elevation coverage (${nullCount}/${GRID_ROWS * GRID_COLS} null cells)`);
    }
    // Fill null cells by averaging non-null cardinal neighbors; use grid mean as last resort
    const nonNullVals = rawGrid.flat().filter((v): v is number => v !== null);
    const gridMean = nonNullVals.length ? nonNullVals.reduce((a, b) => a + b, 0) / nonNullVals.length : 0;
    const grid: number[][] = rawGrid.map((row, r) =>
      row.map((val, c) => {
        if (val !== null) return val;
        const neighbors = [
          rawGrid[r-1]?.[c], rawGrid[r+1]?.[c],
          rawGrid[r]?.[c-1], rawGrid[r]?.[c+1],
        ].filter((v): v is number => v !== null);
        return neighbors.length ? neighbors.reduce((a, b) => a + b, 0) / neighbors.length : gridMean;
      })
    );

    // Compute cell dimensions for slope calculation
    const FPL = 364000; // feet per degree latitude
    const FPN = FPL * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const cellH_ft = ((maxLat - minLat) / (GRID_ROWS - 1)) * FPL;
    const cellW_ft = ((maxLng - minLng) / (GRID_COLS - 1)) * FPN;
    const cellH_m  = cellH_ft * 0.3048;
    const cellW_m  = cellW_ft * 0.3048;

    // Slope grid: max gradient to any cardinal neighbor (percent)
    const slopeGrid: number[][] = grid.map((row, r) =>
      row.map((elev, c) => {
        const neighbors = [
          r > 0           ? { elev: grid[r-1][c], dist: cellH_m } : null,
          r < GRID_ROWS-1 ? { elev: grid[r+1][c], dist: cellH_m } : null,
          c > 0           ? { elev: grid[r][c-1], dist: cellW_m } : null,
          c < GRID_COLS-1 ? { elev: grid[r][c+1], dist: cellW_m } : null,
        ].filter(Boolean) as { elev: number; dist: number }[];

        if (neighbors.length === 0) return 0;
        const maxSlope = Math.max(...neighbors.map(n =>
          Math.abs(n.elev - elev) / n.dist * 100
        ));
        return Math.round(maxSlope * 10) / 10;
      })
    );

    return {
      grid,
      slopeGrid,
      rows: GRID_ROWS,
      cols: GRID_COLS,
      cellSizeFt: Math.round((cellH_ft + cellW_ft) / 2),
      datasetUsed: dataset,
    };

  } catch (err) {
    console.warn(`Elevation fetch failed for ${isUSBbox(minLat, maxLat, minLng, maxLng) ? 'ned10m' : 'srtm30m'}, falling back to flat terrain:`, err instanceof Error ? err.message : err);
    // Graceful fallback — optimizer proceeds as if flat
    return {
      grid:      Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0)),
      slopeGrid: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0)),
      rows: GRID_ROWS,
      cols: GRID_COLS,
      cellSizeFt: 60,
      datasetUsed: 'none',
    };
  }
}

// ── Route handlers ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as OptimizationRequest;

    // Validate required fields
    if (!body.property?.area) {
      return NextResponse.json({ error: 'Missing required field: property.area' }, { status: 400 });
    }
    if (!body.facilityType) {
      return NextResponse.json({ error: 'Missing required field: facilityType' }, { status: 400 });
    }
    if (!body.constraints?.budget) {
      return NextResponse.json({ error: 'Missing required field: constraints.budget' }, { status: 400 });
    }

    const validTypes = ['paintball', 'airsoft', 'trampoline', 'gellyball', 'fec'];
    if (!validTypes.includes(body.facilityType)) {
      return NextResponse.json(
        { error: `Invalid facilityType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch topography if we have property coordinates
    let elevationData: ElevationData | undefined;
    const coords = body.property.coordinates;
    if (coords && coords.length >= 3) {
      const lats = coords.map(c => c[1]);
      const lngs = coords.map(c => c[0]);
      elevationData = await fetchElevationGrid(
        Math.min(...lats), Math.max(...lats),
        Math.min(...lngs), Math.max(...lngs)
      );
    }

    // Run optimization with topo data injected
    const result = optimizeLayout({ ...body, elevationData });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Layout optimization error:', error);
    return NextResponse.json({ error: 'Internal server error during layout optimization' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Land Optimizer API',
    version: '2.0.0',
    topography: 'NED 10m (US) / SRTM 30m (global) via OpenTopoData — no API key required',
    endpoints: {
      'POST /api/generate-layout': {
        description: 'Generate optimized facility layout with terrain analysis',
        notes: [
          'Elevation data fetched automatically from property coordinates',
          'Slope-aware field placement — steep zones flagged or avoided',
          'Grading costs added to estimate based on terrain',
          'elevationData returned in layout for frontend heatmap rendering',
        ],
      },
    },
  });
}
