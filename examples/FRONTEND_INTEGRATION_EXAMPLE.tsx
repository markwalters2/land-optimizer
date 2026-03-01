/**
 * Frontend Integration Example
 * 
 * This file demonstrates how to integrate the layout optimizer API
 * into a Next.js + React + Google Maps application.
 */

'use client';

import { useState } from 'react';
import { GoogleMap, DrawingManager, Polygon } from '@react-google-maps/api';
import type { OptimizedLayout, FacilityType } from '@/lib/layoutOptimizer';

// ============================================================================
// TYPES
// ============================================================================

interface Coordinate {
  lat: number;
  lng: number;
}

interface PropertyData {
  coordinates: Coordinate[];
  area: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LayoutOptimizer() {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [facilityType, setFacilityType] = useState<FacilityType>('paintball');
  const [budget, setBudget] = useState<number>(150000);
  const [utilities, setUtilities] = useState({
    water: true,
    sewer: false,
    electricity: true,
  });
  const [layout, setLayout] = useState<OptimizedLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle polygon complete from Google Maps Drawing
  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coordinates: Coordinate[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        lat: point.lat(),
        lng: point.lng(),
      });
    }

    // Calculate area using Google Maps geometry library
    const area = google.maps.geometry.sphericalUtil.computeArea(path);
    const areaSquareFeet = area * 10.7639; // Convert m² to sq ft

    setProperty({
      coordinates,
      area: areaSquareFeet,
    });

    // Clear the drawn polygon (we'll render our own)
    polygon.setMap(null);
  };

  // Generate layout
  const generateLayout = async () => {
    if (!property) {
      setError('Please draw a property boundary first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          facilityType,
          constraints: {
            budget,
            utilities,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate layout');
      }

      if (!data.success) {
        throw new Error('Layout generation failed');
      }

      setLayout(data.layout);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Land Use Optimizer</h1>

        {/* Step 1: Draw Property */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1. Draw Property Boundary</h2>
          <p className="text-sm text-gray-600 mb-2">
            Use the drawing tool on the map to outline your property.
          </p>
          {property && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800">
                ✓ Property drawn: {(property.area / 43560).toFixed(2)} acres
              </p>
            </div>
          )}
        </section>

        {/* Step 2: Facility Type */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2. Select Facility Type</h2>
          <select
            className="w-full border rounded p-2"
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value as FacilityType)}
          >
            <option value="paintball">Paintball</option>
            <option value="airsoft">Airsoft</option>
            <option value="trampoline">Trampoline Park</option>
            <option value="gellyball">Gellyball</option>
            <option value="fec">Family Entertainment Center (FEC)</option>
          </select>
        </section>

        {/* Step 3: Budget */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3. Set Budget</h2>
          <input
            type="range"
            min="10000"
            max="2000000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-center font-bold mt-2">
            ${budget.toLocaleString()}
          </p>
          <div className="text-xs text-gray-600 mt-1">
            {budget < 100000 && '💡 Low budget - modular facilities'}
            {budget >= 100000 && budget < 300000 && '💡 Medium budget - mixed facilities'}
            {budget >= 300000 && '💡 High budget - permanent facilities'}
          </div>
        </section>

        {/* Step 4: Utilities */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4. Available Utilities</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={utilities.water}
                onChange={(e) => setUtilities({ ...utilities, water: e.target.checked })}
                className="mr-2"
              />
              Municipal Water
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={utilities.sewer}
                onChange={(e) => setUtilities({ ...utilities, sewer: e.target.checked })}
                className="mr-2"
              />
              Sewer Connection
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={utilities.electricity}
                onChange={(e) => setUtilities({ ...utilities, electricity: e.target.checked })}
                className="mr-2"
              />
              Electricity
            </label>
          </div>
        </section>

        {/* Generate Button */}
        <button
          onClick={generateLayout}
          disabled={!property || loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Layout'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Layout Results */}
        {layout && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Layout Results</h2>

            {/* Fields */}
            <section className="mb-4">
              <h3 className="font-semibold mb-2">Playing Fields ({layout.fields.length})</h3>
              <ul className="text-sm space-y-1">
                {layout.fields.map((field, i) => (
                  <li key={i} className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded mr-2"></span>
                    {field.name} ({field.dimensions.width}' × {field.dimensions.length}')
                  </li>
                ))}
              </ul>
            </section>

            {/* Facilities */}
            <section className="mb-4">
              <h3 className="font-semibold mb-2">Support Facilities</h3>
              <ul className="text-sm space-y-1">
                {layout.supportFacilities.map((facility, i) => (
                  <li key={i} className="text-gray-700">
                    • {facility.name} ({facility.type})
                  </li>
                ))}
              </ul>
            </section>

            {/* Parking */}
            <section className="mb-4">
              <h3 className="font-semibold mb-2">Parking</h3>
              <p className="text-sm text-gray-700">
                {layout.parking.spaces} spaces ({layout.parking.type})
              </p>
            </section>

            {/* Cost */}
            <section className="mb-4">
              <h3 className="font-semibold mb-2">Estimated Cost</h3>
              <p className="text-2xl font-bold text-green-600">
                ${layout.costEstimate.total.toLocaleString()}
              </p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">
                  View Breakdown
                </summary>
                <div className="mt-2 space-y-2">
                  {layout.costEstimate.breakdown.map((category, i) => (
                    <div key={i}>
                      <p className="font-semibold">{category.category}</p>
                      <p className="text-gray-700">${category.subtotal.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </details>
            </section>

            {/* Utilization */}
            <section className="mb-4">
              <h3 className="font-semibold mb-2">Site Utilization</h3>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${Math.min(layout.utilizationPercent, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {layout.utilizationPercent.toFixed(1)}% utilized
              </p>
            </section>

            {/* Warnings */}
            {layout.warnings && layout.warnings.length > 0 && (
              <section className="mb-4">
                <h3 className="font-semibold mb-2 text-yellow-700">⚠️ Warnings</h3>
                <ul className="text-sm space-y-1 text-yellow-800">
                  {layout.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recommendations */}
            {layout.recommendations && layout.recommendations.length > 0 && (
              <section className="mb-4">
                <h3 className="font-semibold mb-2 text-blue-700">💡 Recommendations</h3>
                <ul className="text-sm space-y-1 text-blue-800">
                  {layout.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 33.7490, lng: -84.3880 }}
          zoom={15}
          options={{
            mapTypeId: 'satellite',
            mapTypeControl: true,
          }}
        >
          {/* Drawing Manager */}
          {!property && (
            <DrawingManager
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                  fillColor: '#2196F3',
                  fillOpacity: 0.3,
                  strokeWeight: 2,
                  strokeColor: '#1976D2',
                  clickable: false,
                  editable: true,
                  zIndex: 1,
                },
              }}
              onPolygonComplete={handlePolygonComplete}
            />
          )}

          {/* Property Boundary */}
          {property && (
            <Polygon
              paths={property.coordinates}
              options={{
                fillColor: '#4CAF50',
                fillOpacity: 0.2,
                strokeColor: '#2E7D32',
                strokeWeight: 2,
              }}
            />
          )}

          {/* Fields (when layout generated) */}
          {layout?.fields.map((field, i) => (
            field.coordinates && (
              <Polygon
                key={i}
                paths={field.coordinates}
                options={{
                  fillColor: '#2196F3',
                  fillOpacity: 0.5,
                  strokeColor: '#1565C0',
                  strokeWeight: 2,
                }}
              />
            )
          ))}

          {/* Support Facilities */}
          {layout?.supportFacilities.map((facility, i) => (
            facility.coordinates && (
              <Polygon
                key={i}
                paths={facility.coordinates}
                options={{
                  fillColor: '#FF9800',
                  fillOpacity: 0.5,
                  strokeColor: '#F57C00',
                  strokeWeight: 2,
                }}
              />
            )
          ))}

          {/* Parking */}
          {layout?.parking.coordinates && (
            <Polygon
              paths={layout.parking.coordinates}
              options={{
                fillColor: '#9E9E9E',
                fillOpacity: 0.5,
                strokeColor: '#616161',
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate polygon area (if not using Google Maps geometry library)
 */
function calculatePolygonArea(coordinates: Coordinate[]): number {
  // Shoelace formula (simplified)
  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lng * coordinates[j].lat;
    area -= coordinates[j].lng * coordinates[i].lat;
  }

  const areaSquareDegrees = Math.abs(area / 2);
  
  // Very rough approximation to square feet
  // Real implementation should use Turf.js area() function
  const approxSqFeet = areaSquareDegrees * 364000 * 364000;

  return approxSqFeet;
}

// ============================================================================
// SETUP INSTRUCTIONS
// ============================================================================

/**
 * 1. Install dependencies:
 *    npm install @react-google-maps/api
 * 
 * 2. Set up Google Maps API key:
 *    - Enable Maps JavaScript API, Drawing Library, Geometry Library
 *    - Add to .env.local: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
 * 
 * 3. Wrap app in LoadScript provider (in layout.tsx or _app.tsx):
 * 
 *    import { LoadScript } from '@react-google-maps/api';
 * 
 *    const libraries = ['drawing', 'geometry'];
 * 
 *    export default function RootLayout({ children }) {
 *      return (
 *        <LoadScript
 *          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
 *          libraries={libraries}
 *        >
 *          {children}
 *        </LoadScript>
 *      );
 *    }
 * 
 * 4. Use this component:
 *    <LayoutOptimizer />
 */
