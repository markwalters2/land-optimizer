/**
 * Land Optimizer AI Engine
 * Deterministic rule-based layout optimization for specialty recreation facilities
 */

// Facility type definitions
export type FacilityTypeValue = 'paintball' | 'airsoft' | 'trampoline' | 'gellyball' | 'fec';
export type FacilityType = FacilityTypeValue | null;

export interface PropertyBounds {
  type: 'Polygon';
  coordinates: number[][][];
}
export type BudgetTier = 'low' | 'medium' | 'high';

// Input types
export interface PropertyData {
  coordinates: [number, number][]; // Polygon coordinates
  area: number; // Square feet
  address?: string;
}

export interface Constraints {
  budget: number;
  utilities?: {
    water: boolean;
    electric: boolean;
    sewer: boolean;
  };
  maxFields?: number;
  existingStructures?: string | { x: number; y: number; width: number; height: number }[];
  parkingSpaces?: number;
  additionalNotes?: string;
}

export type EntrySide = 'north' | 'south' | 'east' | 'west';

export interface EntryPoint {
  side: EntrySide;
  fraction: number; // 0–1 position along that edge
  roadName?: string;
}

// Elevation / topography data (fetched server-side from OpenTopoData)
export interface ElevationData {
  grid: number[][];       // [row][col] elevation in meters
  slopeGrid: number[][];  // [row][col] max slope to cardinal neighbor in percent
  rows: number;
  cols: number;
  cellSizeFt: number;     // approximate cell size in feet (avg of W and H)
  datasetUsed: 'ned10m' | 'srtm30m' | 'none';
}

export interface OptimizationRequest {
  property: PropertyData;
  facilityType: FacilityTypeValue;
  constraints: Constraints;
  entryPoint?: EntryPoint;      // road access direction from Overpass detection
  elevationData?: ElevationData; // topography grid, injected by route.ts
}

// Output types
export interface Field {
  id: string;
  type: string;
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
  cost: number;
  slopePct?: number; // average slope in percent over this field zone (from topo data)
}

export interface Facility {
  id: string;
  name: string;
  area: number;
  position: { x: number; y: number };
  cost: number;
}

export interface Walkway {
  id: string;
  type: 'entrance' | 'spine' | 'perimeter' | 'inter-field';
  path: { x: number; y: number }[];
  widthFt: number;
  surface: 'paved' | 'gravel' | 'grass';
  label?: string;
}

export interface CostBreakdown {
  fields: number;
  facilities: number;
  parking: number;
  grading: number;  // terrain grading based on slope analysis
  permits: number;
  total: number;
}

export interface ParkingLot {
  position: { x: number; y: number };  // top-left corner, local ft coords
  width: number;
  height: number;
  spaces: number;
  roadSide: 'north' | 'south' | 'east' | 'west'; // which edge faces the road
  entranceGaps: { offset: number; width: number }[]; // offset along road-facing edge
  spacesPerRow: number;
}

export interface OptimizationResult {
  success: boolean;
  layout: {
    fields: Field[];
    facilities: Facility[];
    parking: { spaces: number; area: number };
    parkingLot?: ParkingLot;
    bufferZone: number;
    entryPoint?: EntryPoint;
    walkways: Walkway[];
    elevationData?: ElevationData; // passed through for frontend heatmap rendering
  };
  costEstimate: CostBreakdown;
  metrics: {
    totalArea: number;
    usableArea: number;
    utilizationPercent: number;
    fieldCount: number;
    maxCapacity: number;
  };
  recommendations: string[];
  warnings: string[];
}

// Industry standards
const FACILITY_STANDARDS: Record<FacilityTypeValue, {
  bufferZone: number;
  fieldSizes: { name: string; width: number; height: number; cost: number }[];
  minArea: number;
  parkingRatio: number; // spaces per player
  supportFacilities: { name: string; area: number; cost: { low: number; medium: number; high: number } }[];
}> = {
  paintball: {
    bufferZone: 375,
    fieldSizes: [
      { name: 'Tournament (NXL)', width: 150, height: 120, cost: 75000 },
      { name: 'Recreational', width: 75, height: 150, cost: 45000 },
      { name: 'Speedball', width: 120, height: 170, cost: 60000 },
    ],
    minArea: 87120, // 2 acres
    parkingRatio: 0.33, // 1 space per 3 players
    supportFacilities: [
      { name: 'Registration/Pro Shop', area: 1200, cost: { low: 15000, medium: 45000, high: 120000 } },
      { name: 'Staging Area', area: 2000, cost: { low: 5000, medium: 15000, high: 40000 } },
      { name: 'Restrooms', area: 400, cost: { low: 8000, medium: 25000, high: 60000 } },
      { name: 'Air Station', area: 200, cost: { low: 3000, medium: 8000, high: 20000 } },
    ],
  },
  airsoft: {
    bufferZone: 300,
    fieldSizes: [
      { name: 'CQB Arena', width: 100, height: 150, cost: 50000 },
      { name: 'Tactical Field', width: 300, height: 500, cost: 80000 },
      { name: 'MilSim', width: 500, height: 800, cost: 120000 },
    ],
    minArea: 65340, // 1.5 acres
    parkingRatio: 0.25,
    supportFacilities: [
      { name: 'Registration/Armory', area: 1500, cost: { low: 20000, medium: 50000, high: 150000 } },
      { name: 'Safe Zone', area: 3000, cost: { low: 8000, medium: 20000, high: 50000 } },
      { name: 'Restrooms', area: 400, cost: { low: 8000, medium: 25000, high: 60000 } },
    ],
  },
  trampoline: {
    bufferZone: 50,
    fieldSizes: [
      { name: 'Main Court', width: 100, height: 80, cost: 150000 },
      { name: 'Dodgeball Arena', width: 40, height: 70, cost: 45000 },
      { name: 'Foam Pit', width: 30, height: 30, cost: 35000 },
      { name: 'Ninja Course', width: 60, height: 40, cost: 80000 },
    ],
    minArea: 8000,
    parkingRatio: 0.2,
    supportFacilities: [
      { name: 'Lobby/Reception', area: 800, cost: { low: 20000, medium: 60000, high: 150000 } },
      { name: 'Party Rooms', area: 600, cost: { low: 10000, medium: 30000, high: 80000 } },
      { name: 'Cafe/Snack Bar', area: 500, cost: { low: 15000, medium: 45000, high: 120000 } },
      { name: 'Restrooms', area: 500, cost: { low: 10000, medium: 30000, high: 70000 } },
    ],
  },
  gellyball: {
    bufferZone: 200,
    fieldSizes: [
      { name: 'Standard Arena', width: 60, height: 80, cost: 30000 },
      { name: 'Mini Arena', width: 40, height: 50, cost: 18000 },
      { name: 'Mobile Setup', width: 50, height: 60, cost: 12000 },
    ],
    minArea: 10000,
    parkingRatio: 0.2,
    supportFacilities: [
      { name: 'Check-in Tent/Booth', area: 200, cost: { low: 2000, medium: 8000, high: 25000 } },
      { name: 'Equipment Storage', area: 300, cost: { low: 3000, medium: 10000, high: 30000 } },
      { name: 'Restrooms (Portable)', area: 100, cost: { low: 2000, medium: 5000, high: 15000 } },
    ],
  },
  fec: {
    bufferZone: 30,
    fieldSizes: [
      { name: 'Laser Tag Arena', width: 80, height: 100, cost: 120000 },
      { name: 'Mini Golf (18 holes)', width: 150, height: 200, cost: 180000 },
      { name: 'Arcade Zone', width: 60, height: 80, cost: 200000 },
      { name: 'Bowling (8 lanes)', width: 100, height: 80, cost: 350000 },
      { name: 'Go-Kart Track', width: 200, height: 300, cost: 280000 },
    ],
    minArea: 20000,
    parkingRatio: 0.5,
    supportFacilities: [
      { name: 'Main Lobby', area: 1500, cost: { low: 40000, medium: 120000, high: 300000 } },
      { name: 'Restaurant/Cafe', area: 2000, cost: { low: 60000, medium: 180000, high: 450000 } },
      { name: 'Party/Event Space', area: 1200, cost: { low: 25000, medium: 75000, high: 200000 } },
      { name: 'Restrooms', area: 800, cost: { low: 20000, medium: 60000, high: 150000 } },
      { name: 'Prize Counter', area: 400, cost: { low: 10000, medium: 30000, high: 80000 } },
    ],
  },
};

// Determine budget tier
function getBudgetTier(budget: number): BudgetTier {
  if (budget < 100000) return 'low';
  if (budget < 300000) return 'medium';
  return 'high';
}

// Calculate parking requirements
function calculateParking(
  facilityType: FacilityTypeValue,
  fieldCount: number,
  budgetTier: BudgetTier
): { spaces: number; area: number; cost: number } {
  const standards = FACILITY_STANDARDS[facilityType];
  const playersPerField = facilityType === 'paintball' ? 20 : facilityType === 'airsoft' ? 30 : 40;
  const maxPlayers = fieldCount * playersPerField;
  const spaces = Math.ceil(maxPlayers * standards.parkingRatio);
  
  // Area: 180 sq ft per space (9x20) + 50% for lanes
  const areaPerSpace = 270;
  const area = spaces * areaPerSpace;
  
  // Cost: $3.50/sqft gravel, $4.50 base, $6 paved
  const costPerSqFt = budgetTier === 'low' ? 3.5 : budgetTier === 'medium' ? 4.5 : 6;
  const cost = area * costPerSqFt;
  
  return { spaces, area, cost };
}

// ── Slope helpers ──────────────────────────────────────────────────────────────

/** Grading cost per sq ft by slope tier */
const GRADING_COST_PER_SQFT: Record<string, number> = {
  flat:     0,   // < 2%
  gentle:   3,   // 2–5%
  moderate: 8,   // 5–10%
  steep:    20,  // > 10% — extreme grading or skip
};

/** Classify a slope percent into a tier label */
function slopeTier(pct: number): 'flat' | 'gentle' | 'moderate' | 'steep' {
  if (pct < 2)  return 'flat';
  if (pct < 5)  return 'gentle';
  if (pct < 10) return 'moderate';
  return 'steep';
}

/**
 * Map a rectangle (in local-ft coords) onto the elevation grid
 * and return avgSlope and maxSlope in percent.
 * Returns zeros when no elevation data is present.
 */
function getSlopeForRect(
  x: number, y: number, w: number, h: number,
  bboxW: number, bboxH: number,
  elevData: ElevationData | undefined
): { avgSlope: number; maxSlope: number } {
  if (!elevData || elevData.datasetUsed === 'none') return { avgSlope: 0, maxSlope: 0 };
  const { slopeGrid, rows, cols } = elevData;
  const colLo = Math.max(0, Math.floor((x / bboxW) * cols));
  const colHi = Math.min(cols, Math.ceil(((x + w) / bboxW) * cols));
  const rowLo = Math.max(0, Math.floor((y / bboxH) * rows));
  const rowHi = Math.min(rows, Math.ceil(((y + h) / bboxH) * rows));
  const values: number[] = [];
  for (let r = rowLo; r < rowHi; r++) {
    for (let c = colLo; c < colHi; c++) {
      values.push(slopeGrid[r][c]);
    }
  }
  if (values.length === 0) return { avgSlope: 0, maxSlope: 0 };
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    avgSlope: Math.round(avg * 10) / 10,
    maxSlope: Math.round(Math.max(...values) * 10) / 10,
  };
}

// Main optimization function
export function optimizeLayout(request: OptimizationRequest): OptimizationResult {
  const { property, facilityType, constraints, elevationData } = request;
  const standards = FACILITY_STANDARDS[facilityType];
  const budgetTier = getBudgetTier(constraints.budget);
  
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Validate minimum area
  if (property.area < standards.minArea) {
    warnings.push(`Property area (${property.area.toLocaleString()} sq ft) is below minimum recommended (${standards.minArea.toLocaleString()} sq ft) for ${facilityType}`);
  }
  
  // Calculate usable area (after buffer zones)
  const bufferArea = standards.bufferZone * Math.sqrt(property.area) * 0.5; // Simplified buffer calc
  const usableArea = Math.max(0, property.area - bufferArea);
  
  // Select appropriate field size based on budget
  const fieldOptions = standards.fieldSizes;
  const selectedField = budgetTier === 'high' 
    ? fieldOptions[0] 
    : budgetTier === 'medium'
    ? fieldOptions[Math.min(1, fieldOptions.length - 1)]
    : fieldOptions[fieldOptions.length - 1];
  
  // Calculate how many fields fit
  const fieldArea = selectedField.width * selectedField.height;
  const facilitiesArea = standards.supportFacilities.reduce((sum, f) => sum + f.area, 0);
  const availableForFields = usableArea - facilitiesArea - (usableArea * 0.2); // 20% for circulation
  
  let fieldCount = Math.floor(availableForFields / (fieldArea * 1.3)); // 1.3x for spacing
  if (constraints.maxFields) {
    fieldCount = Math.min(fieldCount, constraints.maxFields);
  }
  fieldCount = Math.max(1, fieldCount); // At least 1 field
  
  // Calculate parking
  const parking = calculateParking(facilityType, fieldCount, budgetTier);
  
  // Check if parking fits
  if (parking.area > usableArea * 0.3) {
    warnings.push('Parking requirements may exceed available space. Consider offsite parking or shuttle service.');
    recommendations.push('Look into shared parking arrangements with neighboring properties');
  }
  
  // ── Entry-aware layout positioning ─────────────────────────────────────────
  // Determine where parking/facilities should sit based on road access direction.
  // Fields go in the interior; entrance strip (parking + support facilities)
  // hugs the edge nearest the road.
  const entryPoint = request.entryPoint;

  // ── Compute REAL property bounding box dimensions from coordinates ──────────
  // propSqrt (sqrt of area) assumed a square lot — wrong for any non-square property.
  // Use actual lat/lng extents converted to feet so all placement stays inside the boundary.
  const FPL = 364000; // feet per degree latitude
  let bboxW: number, bboxH: number;
  if (property.coordinates && property.coordinates.length >= 3) {
    const coordLats = property.coordinates.map((c: [number, number]) => c[1]);
    const coordLngs = property.coordinates.map((c: [number, number]) => c[0]);
    const avgLat = (Math.min(...coordLats) + Math.max(...coordLats)) / 2;
    const FPN = FPL * Math.cos(avgLat * Math.PI / 180);
    bboxW = (Math.max(...coordLngs) - Math.min(...coordLngs)) * FPN;
    bboxH = (Math.max(...coordLats) - Math.min(...coordLats)) * FPL;
  } else {
    // Fallback when no coordinates provided: assume square
    const side = Math.sqrt(property.area);
    bboxW = side;
    bboxH = side;
  }

  const buf = 20; // ft setback from property edge

  // Facility strip depth scales with the relevant edge dimension
  const shortEdge = Math.min(bboxW, bboxH);
  const facilityStripDepth = Math.min(150, shortEdge * 0.22);

  let parkingLotResult: ParkingLot | undefined;
  let stripX = buf;
  let stripY = bboxH - facilityStripDepth; // default: bottom edge
  let fieldStartX = buf;
  let fieldStartY = buf;
  let fieldMaxX = bboxW - buf;
  let fieldMaxY = stripY - 30; // default: stop before the facility strip

  if (entryPoint) {
    switch (entryPoint.side) {
      case 'south':
        stripX = buf;
        stripY = bboxH - facilityStripDepth;
        fieldStartX = buf;
        fieldStartY = buf;
        fieldMaxY = stripY - 30;
        break;
      case 'north':
        stripX = buf;
        stripY = buf;
        fieldStartX = buf;
        fieldStartY = buf + facilityStripDepth + 30;
        fieldMaxY = bboxH - buf;
        break;
      case 'east':
        stripX = bboxW - facilityStripDepth;
        stripY = buf;
        fieldStartX = buf;
        fieldStartY = buf;
        fieldMaxX = stripX - 30;
        fieldMaxY = bboxH - buf;
        break;
      case 'west':
        stripX = buf;
        stripY = buf;
        fieldStartX = buf + facilityStripDepth + 30;
        fieldStartY = buf;
        fieldMaxX = bboxW - buf;
        fieldMaxY = bboxH - buf;
        break;
    }

    // ── Parking lot polygon ─────────────────────────────────────────────────
    // Sits BESIDE the facility strip (right 45% of the entrance zone width),
    // so it does NOT reduce field zone depth — fields stay at their computed maxY/X.
    // Entrance/exit gaps face the road edge.
    const STALL_W = 9;  // ft per parking stall width
    const GAP_W   = 24; // ft per entrance/exit opening

    const buildEntranceGaps = (lotEdgeLen: number) => [
      { offset: Math.round(lotEdgeLen * 0.2), width: GAP_W },
      { offset: Math.round(lotEdgeLen * 0.6), width: GAP_W },
    ];

    if (entryPoint.side === 'south' || entryPoint.side === 'north') {
      // Parking uses right 45% of entrance strip; facilities use left 55%
      const totalW = bboxW - 2 * buf;
      const lotW = Math.round(totalW * 0.45);
      const lotH = facilityStripDepth; // same depth as facility strip — no extra space taken
      const spacesPerRow = Math.max(1, Math.floor(lotW / STALL_W));

      if (entryPoint.side === 'south') {
        // Strip is at bottom: lot sits right-side of the strip, same y
        parkingLotResult = {
          position: { x: bboxW - buf - lotW, y: stripY },
          width: lotW, height: lotH,
          spaces: parking.spaces, roadSide: 'south',
          entranceGaps: buildEntranceGaps(lotW),
          spacesPerRow,
        };
        // NO change to stripY or fieldMaxY — parking shares the existing strip zone
      } else { // north
        parkingLotResult = {
          position: { x: bboxW - buf - lotW, y: stripY },
          width: lotW, height: lotH,
          spaces: parking.spaces, roadSide: 'north',
          entranceGaps: buildEntranceGaps(lotW),
          spacesPerRow,
        };
        // NO change to fieldStartY
      }
    } else {
      // East/west: parking uses bottom 45% of the strip height
      const totalH = bboxH - 2 * buf;
      const lotH = Math.round(totalH * 0.45);
      const lotW = facilityStripDepth; // same width as the strip
      const spacesPerRow = Math.max(1, Math.floor(lotH / STALL_W));

      if (entryPoint.side === 'east') {
        parkingLotResult = {
          position: { x: stripX, y: bboxH - buf - lotH },
          width: lotW, height: lotH,
          spaces: parking.spaces, roadSide: 'east',
          entranceGaps: buildEntranceGaps(lotH),
          spacesPerRow,
        };
        // NO change to stripX or fieldMaxX
      } else { // west
        parkingLotResult = {
          position: { x: stripX, y: bboxH - buf - lotH },
          width: lotW, height: lotH,
          spaces: parking.spaces, roadSide: 'west',
          entranceGaps: buildEntranceGaps(lotH),
          spacesPerRow,
        };
        // NO change to stripX or fieldStartX
      }
    }

    recommendations.unshift(
      `Parking and entrance facilities positioned near ${entryPoint.side} edge${entryPoint.roadName ? ` (${entryPoint.roadName})` : ''} based on detected road access.`
    );
  }

  // Generate field placements
  // Try both orientations and pick whichever places more fields
  // ── Slope-aware placement: score all valid positions, sort flattest-first ──
  const tryPlacement = (fw: number, fh: number): Field[] => {
    type Candidate = { x: number; y: number; slope: number };
    const candidates: Candidate[] = [];
    for (let y = fieldStartY; y + fh <= fieldMaxY; y += fh + 50) {
      for (let x = fieldStartX; x + fw <= fieldMaxX; x += fw + 50) {
        const { avgSlope } = (elevationData && elevationData.datasetUsed !== 'none')
          ? getSlopeForRect(x, y, fw, fh, bboxW, bboxH, elevationData)
          : { avgSlope: 0 };
        candidates.push({ x, y, slope: avgSlope });
      }
    }
    // Sort flattest-first when topo data is available
    if (elevationData && elevationData.datasetUsed !== 'none') {
      candidates.sort((a, b) => a.slope - b.slope);
    }
    return candidates.slice(0, fieldCount).map((c, i) => ({
      id: `field-${i + 1}`,
      type: selectedField.name,
      dimensions: { width: fw, height: fh },
      position: { x: c.x, y: c.y },
      cost: selectedField.cost,
      slopePct: c.slope,
    }));
  };

  const fieldsNormal  = tryPlacement(selectedField.width,  selectedField.height);
  const fieldsRotated = tryPlacement(selectedField.height, selectedField.width);

  // Pick orientation: more fields wins; on tie prefer flatter average slope
  const avgSlope = (arr: Field[]) =>
    arr.length ? arr.reduce((s, f) => s + (f.slopePct ?? 0), 0) / arr.length : 0;
  let fields: Field[];
  if (fieldsRotated.length !== fieldsNormal.length) {
    fields = fieldsRotated.length > fieldsNormal.length ? fieldsRotated : fieldsNormal;
  } else {
    fields = avgSlope(fieldsRotated) <= avgSlope(fieldsNormal) ? fieldsRotated : fieldsNormal;
  }
  fields.forEach((f, i) => { f.id = `field-${i + 1}`; });

  // ── Slope annotation & grading costs ───────────────────────────────────────
  let gradingCost = 0;
  let hasSteepField = false;
  if (elevationData && elevationData.datasetUsed !== 'none') {
    // slopePct already set by tryPlacement; compute grading costs
    fields.forEach(f => {
      const tier = slopeTier(f.slopePct ?? 0);
      const fieldArea = f.dimensions.width * f.dimensions.height;
      gradingCost += fieldArea * GRADING_COST_PER_SQFT[tier];
      if (tier === 'steep') hasSteepField = true;
    });

    // ── Auto-remove fields on extreme slopes (>15%) ─────────────────────────
    const SLOPE_SKIP = 15;
    const tooSteep = fields.filter(f => (f.slopePct ?? 0) > SLOPE_SKIP);
    if (tooSteep.length > 0) {
      const removedGrading = tooSteep.reduce((s, f) => {
        const area = f.dimensions.width * f.dimensions.height;
        return s + area * GRADING_COST_PER_SQFT[slopeTier(f.slopePct ?? 0)];
      }, 0);
      gradingCost -= removedGrading;
      fields = fields
        .filter(f => (f.slopePct ?? 0) <= SLOPE_SKIP)
        .map((f, i) => ({ ...f, id: `field-${i + 1}` }));
      warnings.push(
        `${tooSteep.length} field position${tooSteep.length > 1 ? 's' : ''} removed — terrain slope exceeds ${SLOPE_SKIP}% (unsafe without major earthworks)`
      );
    }

    // Grading summary warnings
    fields.forEach(f => {
      const tier = slopeTier(f.slopePct ?? 0);
      if (tier === 'steep') {
        warnings.push(`Field ${f.id} is on steep terrain (${f.slopePct}% slope) — significant grading required`);
      } else if (tier === 'moderate') {
        warnings.push(`Field ${f.id} on moderate slope (${f.slopePct}%) — grading cost added to estimate`);
      }
    });

    if (gradingCost > 0) {
      recommendations.push(
        `Site grading estimated at $${Math.round(gradingCost).toLocaleString()} based on terrain analysis (${elevationData.datasetUsed === 'ned10m' ? 'NED 10m' : 'SRTM 30m'} data)`
      );
    }
    const maxFieldSlope = Math.max(...fields.map(f => f.slopePct ?? 0));
    if (maxFieldSlope < 2) {
      recommendations.unshift('Terrain is relatively flat — minimal grading expected');
    }
    if (hasSteepField) {
      recommendations.push('Consider retaining walls or terracing for steep-slope fields');
    }
  }

  // Recalculate from final fields array (after orientation pick + steep-skip)
  const actualFieldCount = fields.length;

  // Generate support facilities along the entrance strip.
  // When a parking lot exists on the horizontal strip (south/north entry), place facilities
  // RIGHT-TO-LEFT starting from the parking lot's left edge so Registration is always
  // the first building a visitor hits after leaving the parking lot.
  const isHorizStrip = !entryPoint || entryPoint.side === 'south' || entryPoint.side === 'north';
  let facilities: Facility[];

  if (parkingLotResult && isHorizStrip) {
    // Right-to-left placement: Registration nearest to parking on the right.
    let cur = parkingLotResult.position.x - 20; // gap between parking & first facility
    facilities = standards.supportFacilities.map((f, i) => {
      const fw = Math.sqrt(f.area);
      cur -= fw; // registration right-edge at cur + fw, positioned at cur
      const fac: Facility = {
        id: `facility-${i + 1}`,
        name: f.name,
        area: f.area,
        position: { x: Math.max(stripX, cur), y: stripY },
        cost: f.cost[budgetTier],
      };
      cur -= 20; // 20ft gap before next facility
      return fac;
    });
  } else {
    // Default: left-to-right from strip start
    let cur = stripX;
    facilities = standards.supportFacilities.map((f, i) => {
      const fac: Facility = {
        id: `facility-${i + 1}`,
        name: f.name,
        area: f.area,
        position: { x: cur, y: stripY },
        cost: f.cost[budgetTier],
      };
      cur += Math.sqrt(f.area) + 20;
      return fac;
    });
  }
  
  // Calculate costs
  const fieldsCost = fields.reduce((sum, f) => sum + f.cost, 0);
  const facilitiesCost = facilities.reduce((sum, f) => sum + f.cost, 0);
  const permitRate = budgetTier === 'low' ? 0.12 : budgetTier === 'medium' ? 0.18 : 0.25;
  const permitsCost = (fieldsCost + facilitiesCost + parking.cost + gradingCost) * permitRate;
  const totalCost = fieldsCost + facilitiesCost + parking.cost + gradingCost + permitsCost;
  
  // Check budget
  if (totalCost > constraints.budget) {
    warnings.push(`Estimated cost ($${totalCost.toLocaleString()}) exceeds budget ($${constraints.budget.toLocaleString()})`);
    
    if (actualFieldCount > 1) {
      recommendations.push(`Consider starting with ${actualFieldCount - 1} field${actualFieldCount - 1 > 1 ? 's' : ''} to reduce initial investment`);
    }
    if (budgetTier !== 'low') {
      recommendations.push('Consider lower-tier finishes for support facilities');
    }
  } else if (totalCost < constraints.budget * 0.7) {
    recommendations.push('Budget allows for premium finishes or additional amenities');
    recommendations.push(`Consider adding ${actualFieldCount + 1} fields for increased capacity`);
  }
  
  // Utilization metrics
  const actualUsedArea = fields.reduce((sum, f) => sum + f.dimensions.width * f.dimensions.height, 0) +
    facilities.reduce((sum, f) => sum + f.area, 0) + parking.area;
  const utilizationPercent = Math.round((actualUsedArea / property.area) * 100);
  
  if (utilizationPercent < 40) {
    recommendations.push('Property has significant unused space. Consider phased expansion plan.');
  } else if (utilizationPercent > 85) {
    warnings.push('High space utilization may limit future expansion options');
  }
  
  // Capacity calculation — use actualFieldCount
  const playersPerField = facilityType === 'paintball' ? 20 : facilityType === 'airsoft' ? 30 : 40;
  const maxCapacity = actualFieldCount * playersPerField;

  // Utility recommendations
  if (!constraints.utilities?.water) {
    warnings.push('No water utility access - will need well or water delivery');
    recommendations.push('Budget additional $15,000-$30,000 for water infrastructure');
  }
  if (!constraints.utilities?.electric) {
    warnings.push('No electric utility access - will need generator or solar');
  }

  // ── Walkway generation ────────────────────────────────────────────────────
  const walkways: Walkway[] = [];
  const isVerticalStrip = entryPoint?.side === 'east' || entryPoint?.side === 'west';

  // 1. Perimeter emergency access — 8ft gravel loop inside buffer zone
  walkways.push({
    id: 'perimeter',
    type: 'perimeter',
    widthFt: 8,
    surface: 'gravel',
    label: 'Emergency Access',
    path: [
      { x: buf,        y: buf },
      { x: bboxW - buf, y: buf },
      { x: bboxW - buf, y: bboxH - buf },
      { x: buf,        y: bboxH - buf },
      { x: buf,        y: buf },
    ],
  });

  // 2. Main spine — 12ft paved corridor between field zone and facility strip
  if (isVerticalStrip) {
    const spineX = entryPoint?.side === 'east' ? stripX - 15 : fieldStartX - 15;
    walkways.push({
      id: 'spine',
      type: 'spine',
      widthFt: 12,
      surface: 'paved',
      label: 'Main Circulation',
      path: [
        { x: spineX, y: buf },
        { x: spineX, y: bboxH - buf },
      ],
    });
  } else {
    const spineY = entryPoint?.side === 'north' ? fieldStartY - 15 : stripY - 15;
    walkways.push({
      id: 'spine',
      type: 'spine',
      widthFt: 12,
      surface: 'paved',
      label: 'Main Circulation',
      path: [
        { x: buf,        y: spineY },
        { x: bboxW - buf, y: spineY },
      ],
    });
  }

  // 3. Entrance walkway — 10ft paved path from road edge to Registration.
  //    When a parking lot exists, the path threads through the IN gap so it
  //    visually shows the flow: road → IN gap → across lot → Registration.
  if (facilities.length > 0) {
    const firstFac = facilities[0]; // Registration (always first)
    const facHalf = Math.sqrt(firstFac.area) / 2;
    const facCenterX = firstFac.position.x + facHalf;
    const facCenterY = firstFac.position.y + facHalf;

    // Entry point on the property boundary
    let entryBoundaryX = facCenterX, entryBoundaryY = facCenterY;
    if (entryPoint) {
      const spanX = bboxW - 2 * buf;
      const spanY = bboxH - 2 * buf;
      switch (entryPoint.side) {
        case 'south': entryBoundaryX = buf + entryPoint.fraction * spanX; entryBoundaryY = bboxH - buf; break;
        case 'north': entryBoundaryX = buf + entryPoint.fraction * spanX; entryBoundaryY = buf; break;
        case 'east':  entryBoundaryX = bboxW - buf; entryBoundaryY = buf + entryPoint.fraction * spanY; break;
        case 'west':  entryBoundaryX = buf;          entryBoundaryY = buf + entryPoint.fraction * spanY; break;
      }
    } else {
      entryBoundaryX = facCenterX;
      entryBoundaryY = bboxH - buf;
    }

    let walkwayPath: { x: number; y: number }[];

    if (parkingLotResult && isHorizStrip && parkingLotResult.entranceGaps.length > 0) {
      // Thread through the IN gap of the parking lot.
      const inGap = parkingLotResult.entranceGaps[0];
      const gapCenterX = parkingLotResult.position.x + inGap.offset + inGap.width / 2;
      const lotRoadY = entryPoint?.side === 'south'
        ? parkingLotResult.position.y + parkingLotResult.height  // south lot: road at bottom
        : parkingLotResult.position.y;                            // north lot: road at top
      const lotFacY = entryPoint?.side === 'south'
        ? parkingLotResult.position.y                             // south lot: facility strip at top
        : parkingLotResult.position.y + parkingLotResult.height;  // north lot: facility strip at bottom

      walkwayPath = [
        { x: gapCenterX, y: entryBoundaryY },  // at road boundary, above the IN gap
        { x: gapCenterX, y: lotFacY },          // through parking lot to facility strip level
        { x: facCenterX, y: lotFacY },          // across at facility level to Registration
        { x: facCenterX, y: facCenterY },       // into Registration center
      ];
    } else {
      // No parking lot — original L-shaped path from boundary to facility
      const junctionX = entryPoint?.side === 'east' || entryPoint?.side === 'west'
        ? facCenterX : entryBoundaryX;
      const junctionY = entryPoint?.side === 'north' || entryPoint?.side === 'south'
        ? facCenterY : entryBoundaryY;
      walkwayPath = [
        { x: entryBoundaryX, y: entryBoundaryY },
        { x: junctionX, y: junctionY },
        { x: facCenterX, y: facCenterY },
      ];
    }

    walkways.push({
      id: 'entrance',
      type: 'entrance',
      widthFt: 10,
      surface: 'paved',
      label: entryPoint?.roadName ? `Entry from ${entryPoint.roadName}` : 'Vehicle Entry',
      path: walkwayPath,
    });
  }

  // 4. Inter-field foot traffic paths — 6ft grass paths through the 50ft gaps
  // Use actual placed dimensions (may differ from selectedField if rotation was applied)
  const placedFW = fields[0]?.dimensions.width  ?? selectedField.width;
  const placedFH = fields[0]?.dimensions.height ?? selectedField.height;

  // Horizontal gaps between field rows
  const rowYPositions = [...new Set(fields.map(f => f.position.y))].sort((a, b) => a - b);
  for (let r = 0; r < rowYPositions.length - 1; r++) {
    const gapY = rowYPositions[r] + placedFH + 25; // center of 50ft gap between rows
    walkways.push({
      id: `row-gap-${r}`,
      type: 'inter-field',
      widthFt: 6,
      surface: 'grass',
      label: 'Field Access',
      path: [
        { x: fieldStartX, y: gapY },
        { x: fieldMaxX,   y: gapY },
      ],
    });
  }

  // Vertical gaps between field columns
  const colXPositions = [...new Set(fields.map(f => f.position.x))].sort((a, b) => a - b);
  for (let c = 0; c < colXPositions.length - 1; c++) {
    const gapX = colXPositions[c] + placedFW + 25; // center of 50ft gap between columns
    const minY = Math.min(...fields.map(f => f.position.y));
    const maxY = Math.max(...fields.map(f => f.position.y)) + placedFH;
    walkways.push({
      id: `col-gap-${c}`,
      type: 'inter-field',
      widthFt: 6,
      surface: 'grass',
      label: 'Field Access',
      path: [
        { x: gapX, y: minY },
        { x: gapX, y: maxY },
      ],
    });
  }

  return {
    success: true,
    layout: {
      fields,
      facilities,
      parking: { spaces: parking.spaces, area: parking.area },
      parkingLot: parkingLotResult,
      bufferZone: standards.bufferZone,
      entryPoint: entryPoint,
      walkways,
      elevationData,  // pass through for frontend heatmap rendering
    },
    costEstimate: {
      fields: fieldsCost,
      facilities: facilitiesCost,
      parking: parking.cost,
      grading: Math.round(gradingCost),
      permits: Math.round(permitsCost),
      total: Math.round(totalCost),
    },
    metrics: {
      totalArea: property.area,
      usableArea: Math.round(usableArea),
      utilizationPercent,
      fieldCount: actualFieldCount,
      maxCapacity,
    },
    recommendations,
    warnings,
  };
}

export default optimizeLayout;
