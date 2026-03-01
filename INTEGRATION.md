# Integration Guide for AI Layout Generation

This document describes how to integrate the AI layout generation backend with this frontend.

## Current State

The frontend is **complete and functional** but uses placeholder logic for:
1. Layout generation (simulated with 2-second delay)
2. Email capture (logs to console)
3. PDF generation (not implemented)

## What's Ready for Integration

### Data Flow

```
User Input → Frontend State → API Request → AI Processing → Results Display
```

**Frontend collects:**
- Facility type: `'paintball' | 'airsoft' | 'trampoline' | 'gellyball' | 'fec'`
- Property bounds: GeoJSON polygon with coordinates
- Budget: Number (USD)
- Parking spaces: Number
- Existing structures: String description
- Additional notes: String

**Frontend expects:**
- Optimized layout data structure (see below)
- Map visualization data
- Cost breakdown
- Recommendations

## API Endpoints to Implement

### 1. Generate Layout

**Endpoint:** `POST /api/generate-layout`

**Request Body:**
```typescript
{
  facilityType: 'paintball' | 'airsoft' | 'trampoline' | 'gellyball' | 'fec',
  propertyBounds: {
    type: 'Polygon',
    coordinates: [
      [[lng, lat], [lng, lat], ...] // Array of coordinate pairs
    ]
  },
  constraints: {
    budget: number,
    existingStructures: string,
    parkingSpaces: number,
    additionalNotes: string
  }
}
```

**Response:**
```typescript
{
  layout: {
    zones: [
      {
        id: string,
        type: 'play_area' | 'parking' | 'safety_zone' | 'building' | 'restroom' | etc.,
        name: string,
        coordinates: [[lng, lat], ...], // Polygon coordinates
        area: number, // Square feet or meters
        color: string, // Hex color for map display
        description: string
      },
      // ... more zones
    ],
    totalArea: number,
    utilizationPercentage: number,
    estimatedCost: number,
    recommendations: string[]
  },
  success: boolean,
  error?: string
}
```

**Where to add in frontend:**
```typescript
// In components/ConstraintForm.tsx, update handleSubmit:

const handleSubmit = async (data: Constraints) => {
  setIsGenerating(true);
  
  try {
    const response = await fetch('/api/generate-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facilityType,
        propertyBounds,
        constraints: data
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      onSubmit(data, result.layout); // Pass layout data
    } else {
      // Handle error
      alert('Failed to generate layout: ' + result.error);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  } finally {
    setIsGenerating(false);
  }
};
```

### 2. Save Plan (Email Capture)

**Endpoint:** `POST /api/save-plan`

**Request Body:**
```typescript
{
  email: string,
  facilityType: string,
  propertyBounds: GeoJSON,
  constraints: Constraints,
  layout: LayoutData, // From generate-layout response
  timestamp: string
}
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  leadId?: string, // For tracking in CRM
  error?: string
}
```

**What to do:**
1. Generate PDF of layout with property bounds, zones, recommendations
2. Send email via Resend/SendGrid with PDF attachment
3. Store lead in database/CRM (HubSpot, Salesforce, etc.)
4. Return success confirmation

**Where to add in frontend:**
```typescript
// In components/EmailCapture.tsx, update handleSubmit:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!emailRegex.test(email)) {
    setError('Please enter a valid email address');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/save-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        facilityType,
        propertyBounds,
        constraints,
        layout,
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      onSubmit(email);
      alert('Your plan has been sent to ' + email);
    } else {
      setError(result.error || 'Failed to save plan');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Frontend Updates Needed for Integration

### 1. Update `app/page.tsx`

Add layout data to state:

```typescript
const [layoutData, setLayoutData] = useState<any>(null);

const handleConstraintsSubmit = (data: Constraints, layout: any) => {
  setConstraints(data);
  setLayoutData(layout);
  setStep('results');
};
```

### 2. Update `components/ResultsDisplay.tsx`

Add props for layout data:

```typescript
interface ResultsDisplayProps {
  // ... existing props
  layoutData: any; // Add this
}

// In component, use layoutData.zones to draw on map:
layoutData.zones.forEach(zone => {
  L.polygon(
    zone.coordinates.map(c => [c[1], c[0]]),
    {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.3,
      weight: 2
    }
  ).addTo(map).bindPopup(`
    <strong>${zone.name}</strong><br>
    ${zone.area.toLocaleString()} sq ft<br>
    ${zone.description}
  `);
});
```

### 3. Add Loading States

```typescript
// In ConstraintForm.tsx
const [isGenerating, setIsGenerating] = useState(false);

// Show loading UI while waiting for API
{isGenerating && (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-green mx-auto mb-4"></div>
      <p className="text-neon-green text-xl">Generating optimized layout...</p>
    </div>
  </div>
)}
```

## Backend Implementation Recommendations

### Tech Stack Options

1. **Next.js API Routes** (simplest, same repo)
   - Create `app/api/generate-layout/route.ts`
   - Use OpenAI, Anthropic, or custom AI model
   - Deploy alongside frontend on Vercel

2. **Separate Backend** (microservice approach)
   - Python/FastAPI for AI/ML processing
   - Node.js/Express for API layer
   - Deploy on separate service (Railway, Render, etc.)

3. **Serverless Functions** (scalable)
   - AWS Lambda + API Gateway
   - Cloudflare Workers (if logic is lightweight)
   - Google Cloud Functions

### AI Model Considerations

**For layout optimization:**
- LLM with structured output (GPT-4, Claude)
- Custom trained model on facility layouts
- Rule-based system with AI enhancement
- Constraint satisfaction solver (OR-Tools, etc.)

**Input to AI:**
- Property polygon coordinates
- Total area calculation
- Facility type requirements (from standards database)
- Budget constraints
- Parking requirements
- Existing structure locations

**Output from AI:**
- Zones with coordinates and types
- Safety buffers
- Parking layout
- Building placements
- Cost estimates
- Recommendations

### Database Schema (for leads)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50),
  property_bounds JSON,
  budget DECIMAL(10, 2),
  parking_spaces INTEGER,
  existing_structures TEXT,
  additional_notes TEXT,
  layout_data JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  pdf_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'new' -- new, contacted, quoted, converted
);
```

### Email Template

**Subject:** Your Optimized Facility Layout - [Facility Type]

**Body:**
```
Hi there,

Thank you for using our Land Use Optimizer! 

Attached is your personalized facility layout for your [Facility Type] project.

Your Design Summary:
- Total Area: [X] sq ft
- Estimated Budget: $[X]
- Parking Spaces: [X]
- Utilization: [X]%

Next Steps:
1. Review the attached PDF with your optimized layout
2. Get a customized insurance quote for your facility
3. Schedule a consultation with our team

[Get Insurance Quote Button]

Questions? Reply to this email or call us at [PHONE]

Best regards,
Alliance Risk Insurance Services
```

## Testing the Integration

### Manual Testing Checklist

1. **Happy Path:**
   - [ ] Complete entire flow from hero to email capture
   - [ ] Verify API is called with correct data
   - [ ] Check layout data is returned and displayed
   - [ ] Confirm email is sent with PDF
   - [ ] Verify lead is stored in database

2. **Error Handling:**
   - [ ] Test with invalid property bounds
   - [ ] Test with extremely low budget
   - [ ] Test with invalid email format
   - [ ] Test API timeout/failure
   - [ ] Test email service failure

3. **Edge Cases:**
   - [ ] Very small property (<1000 sq ft)
   - [ ] Very large property (>10 acres)
   - [ ] Budget below minimum viable
   - [ ] Zero parking spaces
   - [ ] Complex polygon shapes

### Automated Testing

Add tests in `__tests__/` folder:

```typescript
// __tests__/api/generate-layout.test.ts
describe('POST /api/generate-layout', () => {
  it('should generate layout for valid input', async () => {
    const response = await fetch('/api/generate-layout', {
      method: 'POST',
      body: JSON.stringify(mockValidRequest)
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.layout.zones).toBeDefined();
  });
  
  // More tests...
});
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache layout generation results for similar properties
const cacheKey = `layout_${facilityType}_${propertyArea}_${budget}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Generate new layout
const layout = await generateLayout(...);

// Cache for 1 hour
await cache.set(cacheKey, layout, 3600);
```

### Rate Limiting

```typescript
// Limit to 10 layout generations per IP per hour
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many layout requests, please try again later'
});

app.use('/api/generate-layout', limiter);
```

## Cost Estimation

**AI API calls:**
- Average tokens per layout: ~5,000 tokens
- Cost per generation (GPT-4): ~$0.15
- Cost per generation (Claude): ~$0.07
- Daily volume estimate: 50-100 generations
- Monthly AI cost: $100-$300 (assuming Claude)

**Email service:**
- Resend: $20/month for 50k emails
- SendGrid: Free tier for 100 emails/day

**Total monthly backend cost:** ~$150-$350

## Next Steps

1. **Immediate:**
   - Implement `POST /api/generate-layout` route
   - Test with frontend using dummy data
   - Verify data flow end-to-end

2. **Short-term:**
   - Integrate actual AI model for layout generation
   - Implement PDF generation
   - Set up email service
   - Add database for lead storage

3. **Future enhancements:**
   - 3D visualization of layout
   - Cost breakdown by zone
   - Multiple layout variations (A/B options)
   - Integration with GIS data for terrain analysis
   - Zoning regulation compliance checking

---

**Questions?** Contact the frontend developer or main agent for clarification.
