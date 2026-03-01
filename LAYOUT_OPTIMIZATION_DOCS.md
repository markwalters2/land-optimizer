# Layout Optimization Algorithm Documentation

## Overview

The Land Use Layout Optimizer generates optimized facility layouts for specialty recreation properties (paintball, airsoft, trampoline, gellyball, FEC) using deterministic rule-based heuristics combined with industry-standard dimensions and best practices.

## Core Design Principles

### 1. Deterministic Over AI

**Why:** AI-based layout optimization (genetic algorithms, neural networks) is expensive at scale and non-deterministic. For a production SaaS tool, predictable, explainable results are critical.

**Approach:**
- Rule-based placement using industry standards
- Geometric calculations for space allocation
- Budget-tier-based facility selection
- Predictable cost estimation

**When to use AI:**
- Complex multi-objective optimization (research projects)
- Very large properties with 10+ constraints
- Custom one-off high-budget projects ($5M+)

For 95% of use cases, deterministic rules provide better UX and lower operating costs.

### 2. Safety First

Safety zones and regulatory setbacks are **non-negotiable**. The algorithm prioritizes:
1. Perimeter buffer zones (200-375 ft depending on facility type)
2. Road setbacks (30 ft minimum)
3. Emergency vehicle access (20 ft wide clear path)
4. Player safety zones (staging areas, spectator zones)

Fields are placed **after** safety zones are allocated.

### 3. Traffic Flow Optimization

Standard flow sequence:
```
Parking → Registration → Equipment/Briefing → Fields → Canteen
```

**Rules:**
- Minimize crossing paths
- Separate incoming and exiting players
- Keep spectators away from active play areas
- Emergency exits never blocked

### 4. Budget-Tier Facility Selection

Three tiers determine facility types:

| Budget | Tier | Registration | Bathrooms | Canteen | Parking |
|--------|------|--------------|-----------|---------|---------|
| <$100k | Low | Shipping container | Porta-potties | Food truck pad | Gravel |
| $100k-$300k | Medium | Modular building | Permanent block | Modular w/ window | Mixed (partial paved) |
| $300k+ | High | Custom building | Full-service | Full café | Fully paved |

## Algorithm Flow

### Step 1: Calculate Usable Area

```typescript
usableArea = propertyArea
  - existingStructures.area
  - preserveAreas.area
  - irregularShapeReduction (15%)
```

**Rationale:** Real properties are never perfectly rectangular. The 15% reduction accounts for:
- Irregular boundaries
- Mandatory setbacks
- Utility easements
- Topography challenges

### Step 2: Determine Budget Tier

```typescript
if (budget < 100000) tier = 'low'
else if (budget < 300000) tier = 'medium'
else tier = 'high'
```

Budget tier affects:
- Support facility types (permanent vs modular vs temporary)
- Parking surface (gravel vs paved)
- Equipment quality
- Permitting/contingency percentages

### Step 3: Generate Playing Fields

Field generation is **facility-type specific**:

#### Paintball/Airsoft (Field-Based)

```typescript
// Determine field type based on available space
fieldType = usableArea > 100000 ? 'tactical' : 'tournament'

// Calculate field footprint (field + buffer)
fieldArea = width * length
bufferArea = (bufferZone * 2)²
totalFootprint = fieldArea + bufferArea

// Allocate 60% of usable area to fields
maxFields = floor(usableArea * 0.6 / totalFootprint)
numFields = clamp(maxFields, 1, 4)
```

**Constraints:**
- Minimum 1 field
- Maximum 4 fields (diminishing returns, operational complexity)
- 60% allocation (leaves room for parking, facilities, circulation)

#### Trampoline Park (Indoor Single-Area)

```typescript
// Main court is primary attraction
mainCourtArea = 8000-15000 sq ft

// Add attractions based on available space
if (usableArea > 15000) {
  attractions.push('dodgeball', 'foamPit', 'basketball')
}
```

**Constraints:**
- Minimum 22 ft ceiling height (verified during site assessment)
- Indoor only (climate control, safety, year-round operation)
- Contiguous space (no separate buildings)

#### Gellyball (Smaller Fields)

```typescript
// Similar to paintball but smaller dimensions
standardField = 60' x 80'
maxFields = floor(usableArea * 0.5 / (fieldArea * 1.5))
numFields = clamp(maxFields, 2, 4)
```

**Constraints:**
- Minimum 2 fields (business viability)
- 50% allocation (younger customers = more support facilities needed)

#### FEC (Multi-Attraction)

```typescript
// Fixed attraction mix based on industry standards
attractions = {
  arcade: 4500 sq ft,
  laserTag: 4000 sq ft,
  miniGolf: 6500 sq ft,
  softPlay: 3000 sq ft,
  vr: 750 sq ft
}
```

**Constraints:**
- Minimum 20,000 sq ft total (viable FEC floor)
- Indoor preferred (climate control, lighting, sound)
- Modular design (attractions can be added/removed)

### Step 4: Generate Support Facilities

Support facilities scale with field count and budget tier:

```typescript
// Core facilities (all facility types)
facilities = [
  registration (300-800 sq ft),
  bathrooms (100-400 sq ft),
  canteen (200-800 sq ft, optional for low budget)
]

// FEC-specific additions
if (facilityType === 'fec') {
  facilities.push(
    redemptionCounter,
    partyRooms (2-6 depending on budget)
  )
}
```

**Modular vs Permanent Decision Tree:**

```
Budget Tier: Low
├─ Registration: Shipping container ($3-5k)
├─ Bathrooms: Porta-potties ($250/month rental)
└─ Canteen: Canopy tent + food truck pad ($1.5k)

Budget Tier: Medium
├─ Registration: Modular building ($18k)
├─ Bathrooms: Permanent block ($50k)
└─ Canteen: Modular w/ service window ($25k)

Budget Tier: High
├─ Registration: Custom building ($120k)
├─ Bathrooms: Full-service restrooms ($80k)
└─ Canteen: Full café ($150k)
```

### Step 5: Calculate Parking

```typescript
sessionSize = FACILITY_SPECS[facilityType].sessionSize
parkingRatio = FACILITY_SPECS[facilityType].parkingRatio

spaces = ceil(sessionSize / parkingRatio) + 2 // +2 for ADA
areaPerSpace = 320 sq ft // 9'x18' + circulation
totalArea = spaces * areaPerSpace
```

**Parking Ratios by Facility Type:**

| Facility | Session Size | Ratio | Spaces (typical) |
|----------|--------------|-------|------------------|
| Paintball | 30 | 1:4 | 10 |
| Airsoft | 24 | 1:3 | 10 |
| Trampoline | 40 | 1:3 | 16 |
| Gellyball | 20 | 1:5 | 6 |
| FEC | 100 | 1:2 | 52 |

**Why these ratios:**
- Paintball/Airsoft: Adult customers, carpooling common
- Trampoline: Family groups (parents + kids)
- Gellyball: Kids' parties, carpooling dominant
- FEC: Family destination, longer visits

### Step 6: Generate Safety Zones

Safety zones are **facility-type dependent**:

```typescript
safetyZones = [
  perimeterBuffer (200-375 ft, varies by facility),
  emergencyAccess (20 ft wide),
  roadSetback (30 ft)
]
```

**Buffer Zone Requirements:**

| Facility | Buffer (ft) | Rationale |
|----------|-------------|-----------|
| Paintball | 375 | Paintballs travel 300+ ft, projectile hazard |
| Airsoft | 300 | BBs travel 200+ ft, lower velocity than paintball |
| Gellyball | 200 | Low velocity, family-friendly |
| Trampoline | N/A | Indoor facility, building envelope is buffer |
| FEC | N/A | Indoor, multi-attraction spacing handled internally |

**Regulatory Compliance:**

The algorithm assumes typical suburban zoning. **Critical:** Always verify with local AHJ (Authority Having Jurisdiction):
- Zoning ordinances (commercial recreation, special use permits)
- Building codes (IBC, NFPA for fire safety)
- Health department (food service, bathrooms)
- Environmental (stormwater, wetlands)

### Step 7: Generate Traffic Flow

Traffic flow is **template-based** with minor adjustments:

```typescript
sequence = [
  'Parking',
  'Registration',
  'Equipment/Safety Briefing',
  'Playing Fields',
  'Canteen (optional)'
]

paths = [
  { from: 'Parking', to: 'Registration', width: 8, type: 'pedestrian' },
  { from: 'Registration', to: 'Fields', width: 10, type: 'pedestrian' },
  { from: 'Road', to: 'Parking', width: 24, type: 'vehicle' },
  { from: 'Road', to: 'Emergency', width: 20, type: 'emergency' }
]
```

**Path Widths:**
- Pedestrian: 8-10 ft (ADA-compliant, allows wheelchair passage)
- Vehicle: 24 ft (two-way traffic, emergency access)
- Emergency: 20 ft (fire truck access per NFPA standards)

### Step 8: Calculate Costs

Cost estimation uses **bottom-up component costing**:

```typescript
costEstimate = {
  fieldSetup: netting + bunkers + equipment,
  supportFacilities: registration + bathrooms + canteen,
  parkingAndSite: parking surface + grading + drainage,
  permitsAndContingency: (subtotal * permitRate) + (subtotal * 0.10)
}
```

**Cost Models:**

#### Field Setup (Paintball/Airsoft/Gellyball)

| Component | Unit | Paintball | Airsoft | Gellyball |
|-----------|------|-----------|---------|-----------|
| Netting | per linear ft | $25 | $20 | $18 |
| Bunkers/Barriers | per field | $8,000 | $6,000 | $4,000 |
| Equipment | per field | $15,000 | $12,000 | $8,000 |

**Netting calculation:**
```typescript
perimeter = 2 * (width + length)
nettingCost = perimeter * costPerLinearFoot * numFields
```

#### Support Facilities

See budget tier tables in Step 4.

#### Parking

| Surface | Cost per sq ft | Lifespan | Maintenance |
|---------|----------------|----------|-------------|
| Gravel | $3.50 | 5-7 years | Low |
| Mixed (partial paved) | $4.50 | 10-15 years | Medium |
| Paved (asphalt) | $6.00 | 15-20 years | Low |

#### Permits & Contingency

```typescript
permitRate = budgetTier === 'high' ? 0.25 
           : budgetTier === 'medium' ? 0.18 
           : 0.12

permitsAndEngineering = subtotal * permitRate * 0.6
contingency = subtotal * permitRate * 0.4
```

**Why higher rates for higher budgets:**
- High-budget projects: Custom buildings, extensive engineering, longer approval
- Low-budget projects: Modular/temporary structures, simpler permits

### Step 9: Calculate Utilization

```typescript
totalUsedArea = 
  fieldsArea + 
  supportFacilitiesArea + 
  parkingArea + 
  safetyZonesEstimate

utilizationPercent = (totalUsedArea / usableArea) * 100
```

**Utilization Targets:**

| Range | Assessment | Action |
|-------|------------|--------|
| <40% | Under-utilized | Add fields or attractions |
| 40-60% | Low | Consider expansion options |
| 60-75% | Good | Balanced development |
| 75-85% | Optimal | Maximum efficiency |
| 85%+ | High | Limited expansion room |

### Step 10: Generate Warnings & Recommendations

**Warnings** (potential blockers):

```typescript
if (totalCost > budget * 1.1) {
  warn('Cost exceeds budget by X%')
}

if (propertyArea < 43560) { // 1 acre
  warn('Property under 1 acre, limited expansion')
}

if (!utilities.water) {
  warn('No water connection, well/delivery required')
}
```

**Recommendations** (optimization suggestions):

```typescript
if (utilizationPercent < 40) {
  recommend('Low site utilization, add fields/attractions')
}

if (budgetTier === 'low') {
  recommend('Phased development: Start 1-2 fields, expand as revenue grows')
}

if (facilityType === 'paintball' || 'airsoft') {
  recommend('Add pro shop for equipment sales (15-25% revenue)')
  recommend('Host tournaments for additional revenue')
}
```

## Geometric Placement Algorithm

**Current implementation:** Simplified centroid-based placement (coordinates are placeholders).

**Future enhancement:** Actual coordinate calculation based on:

1. **Property Orientation**
   - Identify longest axis
   - Align fields along longest dimension (maximize fit)

2. **Road Frontage Priority**
   - Place registration/parking near road access
   - Minimize driveway length (cost savings)

3. **Buffer Zone Compliance**
   - Calculate inset polygons for buffer zones
   - Place fields within safe zones

4. **Optimize Solar Orientation**
   - North-south field alignment (minimize sun glare)
   - East-west for indoor facilities (solar heat gain)

5. **Drainage Flow**
   - Parking and facilities on higher ground
   - Fields in lower areas (natural drainage)

**Implementation Approach:**

```typescript
// Pseudo-code for coordinate calculation
function calculateFieldCoordinates(
  property: Polygon,
  field: FacilityConfig,
  constraints: LayoutConstraints
): Coordinate[] {
  
  // 1. Calculate property centroid
  const centroid = calculateCentroid(property.coordinates)
  
  // 2. Determine property orientation (long axis)
  const orientation = calculateOrientation(property.coordinates)
  
  // 3. Inset polygon for buffer zones
  const safeZone = insetPolygon(property.coordinates, bufferDistance)
  
  // 4. Place first field near centroid, aligned to orientation
  const field1 = placeRectangle(
    safeZone, 
    field.width, 
    field.length, 
    orientation, 
    centroid
  )
  
  // 5. Place subsequent fields in grid pattern
  const field2 = placeAdjacentRectangle(field1, spacing, orientation)
  
  // 6. Place support facilities near road frontage
  const registration = placeNearRoadFrontage(
    safeZone,
    constraints.roadFrontage,
    facility.dimensions
  )
  
  return field1.coordinates
}
```

**Libraries for production:**

- **Turf.js**: Geospatial calculations (buffer, centroid, area, intersection)
- **polygon-clipping**: Boolean operations on polygons
- **earcut**: Polygon triangulation (for area calculation of complex shapes)

## Performance Considerations

### Computational Complexity

- **Time complexity**: O(n) where n = number of fields
- **Space complexity**: O(n) for field storage
- **Typical execution time**: <100ms for properties with 1-10 fields

### Scalability

**Current implementation:**
- Handles properties up to 20 acres
- Max 10 fields per property
- Suitable for 95% of specialty recreation facilities

**For larger projects (theme parks, resort complexes):**
- Use AI/ML optimization (genetic algorithms)
- Multi-phase development planning
- Spawn sub-agent for complex scenarios

### Caching Strategy

For production SaaS:

```typescript
// Cache common property configurations
const cacheKey = `${facilityType}_${Math.round(area)}_${budget}`

if (cache.has(cacheKey)) {
  const template = cache.get(cacheKey)
  return customizeTemplate(template, property, constraints)
}
```

Benefits:
- Sub-10ms response for cached configurations
- Reduced compute costs
- Consistent results for similar properties

## Cost Optimization Strategies

### Budget Shortfall Scenarios

When `estimatedCost > budget`:

1. **Reduce field count**
   ```typescript
   if (cost > budget * 1.1 && numFields > 1) {
     numFields -= 1
     recalculate()
   }
   ```

2. **Downgrade facilities**
   ```typescript
   if (cost > budget) {
     if (budgetTier === 'high') budgetTier = 'medium'
     else if (budgetTier === 'medium') budgetTier = 'low'
     recalculate()
   }
   ```

3. **Phased development**
   ```typescript
   phase1 = {
     fields: [field1],
     facilities: ['registration', 'bathrooms'],
     cost: budget * 0.7
   }
   
   phase2 = {
     fields: [field2, field3],
     facilities: ['canteen', 'pro shop'],
     cost: budget * 0.3
   }
   ```

### Value Engineering

**Cost reduction without compromising safety:**

| Item | Standard | Value-Engineered | Savings |
|------|----------|------------------|---------|
| Parking | Full paved | Gravel with paved ADA | 40% |
| Registration | Custom building | Modular/container | 60-80% |
| Bathrooms | Permanent block | Porta-potties (rental) | 95% upfront |
| Canteen | Full café | Food truck pad | 90% |
| Netting | Commercial grade | DIY installation | 30% |

**Never compromise:**
- Safety zone dimensions
- ADA compliance
- Emergency access
- Structural integrity

## Testing & Validation

### Unit Tests

```typescript
describe('LayoutOptimizer', () => {
  test('calculates usable area correctly', () => {
    const property = { area: 100000, coordinates: [...] }
    const constraints = { existingStructures: [{ area: 10000 }] }
    const usable = optimizer.calculateUsableArea(property, constraints)
    expect(usable).toBe(76500) // 100k - 10k - 15% reduction
  })
  
  test('respects minimum buffer zones', () => {
    const layout = optimizer.optimize(property, 'paintball', constraints)
    const buffer = layout.safetyZones.find(z => z.type === 'buffer')
    expect(buffer.width).toBeGreaterThanOrEqual(375)
  })
  
  test('generates cost estimate within 10% of manual calculation', () => {
    const layout = optimizer.optimize(property, 'paintball', constraints)
    const manualCost = calculateManualCost(layout)
    expect(Math.abs(layout.costEstimate.total - manualCost)).toBeLessThan(manualCost * 0.1)
  })
})
```

### Integration Tests

```typescript
describe('API Route', () => {
  test('handles valid request', async () => {
    const response = await fetch('/api/generate-layout', {
      method: 'POST',
      body: JSON.stringify(validRequest)
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.layout.fields.length).toBeGreaterThan(0)
  })
  
  test('rejects invalid budget', async () => {
    const response = await fetch('/api/generate-layout', {
      method: 'POST',
      body: JSON.stringify({ ...validRequest, constraints: { budget: 5000 } })
    })
    expect(response.status).toBe(400)
  })
})
```

## Future Enhancements

### Phase 2: AI-Assisted Refinement

Use Claude API for:
- Multi-objective optimization (cost vs utilization vs customer experience)
- Natural language layout adjustments ("Make fields closer to parking")
- Competitive analysis ("How does this compare to similar facilities?")

**Implementation:**

```typescript
async function refineWithAI(
  baseLayout: OptimizedLayout,
  userFeedback: string
): Promise<OptimizedLayout> {
  const prompt = `
    Current layout: ${JSON.stringify(baseLayout)}
    User feedback: "${userFeedback}"
    
    Adjust the layout to address the feedback while maintaining:
    - Safety zone compliance
    - Budget constraints
    - Traffic flow efficiency
  `
  
  const response = await claude.messages.create({
    model: 'claude-sonnet-4',
    messages: [{ role: 'user', content: prompt }]
  })
  
  return JSON.parse(response.content)
}
```

**Cost control:** Only invoke AI for complex adjustments, not initial generation.

### Phase 3: 3D Visualization

Generate 3D models for:
- Stakeholder presentations
- Permit applications
- Marketing materials

**Tech stack:**
- Three.js for rendering
- Blender headless for complex scenes
- Export to glTF for web viewing

### Phase 4: Real-Time Collaboration

Allow multiple stakeholders to:
- Comment on layout elements
- Suggest alternative placements
- Vote on design options

**WebSocket-based updates:**

```typescript
socket.on('layout:update', (changes) => {
  const newLayout = applyChanges(currentLayout, changes)
  if (validateConstraints(newLayout)) {
    broadcast('layout:updated', newLayout)
  }
})
```

## Conclusion

This layout optimization engine prioritizes:
1. **Safety compliance** (regulatory setbacks, buffer zones)
2. **Budget adherence** (tier-based facility selection)
3. **Operational efficiency** (traffic flow, utilization)
4. **Predictability** (deterministic rules, explainable results)

For 95% of specialty recreation facilities, deterministic rule-based optimization provides faster, cheaper, and more reliable results than AI-based approaches.

AI is reserved for edge cases: very large properties, complex multi-use developments, or custom high-budget projects where the cost of AI compute is justified by project value.
