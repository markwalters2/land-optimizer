'use client';

import { useEffect, useRef, useState } from 'react';
import { FacilityType, PropertyBounds } from '@/lib/layoutOptimizer';

interface MapInterfaceProps {
  facilityType: FacilityType;
  onComplete: (bounds: PropertyBounds) => void;
  onBack: () => void;
}

export default function MapInterface({ facilityType, onComplete, onBack }: MapInterfaceProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [drawnLayer, setDrawnLayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileEmail, setMobileEmail] = useState('');
  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const [mobileSubmitted, setMobileSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const narrow = window.innerWidth < 768;
      setIsMobile(touch || narrow);
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet to avoid SSR issues
    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet-draw');

      // Fix for default marker icons in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (mapRef.current && !mapInstance) {
        const map = L.map(mapRef.current).setView([39.5, -98.35], 5); // US center — user will search for their property

        // Esri World Imagery — free satellite tiles, no API key
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 19,
        }).addTo(map);

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new (L.Control as any).Draw({
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: {
                color: '#39FF14',
                weight: 3,
              }
            },
            rectangle: {
              shapeOptions: {
                color: '#39FF14',
                weight: 3,
              }
            },
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
          edit: {
            featureGroup: drawnItems,
            remove: true,
          }
        });

        map.addControl(drawControl);

        map.on('draw:created', (e: any) => {
          const layer = e.layer;
          drawnItems.clearLayers();
          drawnItems.addLayer(layer);
          setDrawnLayer(layer);
        });

        setMapInstance(map);
        setIsReady(true);
      }
    };

    loadMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('No results found. Try a more specific address.');
      } else {
        const { lat, lon, boundingbox } = data[0];
        if (boundingbox) {
          const L = (await import('leaflet')).default;
          mapInstance.fitBounds([
            [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])],
            [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])],
          ]);
        } else {
          mapInstance.setView([parseFloat(lat), parseFloat(lon)], 17);
        }
      }
    } catch {
      setSearchError('Search failed. Check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const [drawError, setDrawError] = useState('');

  const handleContinue = () => {
    if (!drawnLayer) return;
    const geoJSON = drawnLayer.toGeoJSON();
    const coords: [number, number][] = geoJSON.geometry.coordinates[0];
    // Quick shoelace area check — must be at least 1 acre (43,560 sq ft)
    const refLat = coords[0][1];
    const refLng = coords[0][0];
    const FPL = 364000;
    const FPN = FPL * Math.cos(refLat * Math.PI / 180);
    const local = coords.map((c: [number, number]) => [(c[0] - refLng) * FPN, (c[1] - refLat) * FPL]);
    let area = 0;
    for (let i = 0; i < local.length; i++) {
      const j = (i + 1) % local.length;
      area += local[i][0] * local[j][1] - local[j][0] * local[i][1];
    }
    const areaSqFt = Math.abs(area) / 2;
    if (areaSqFt < 43560) {
      setDrawError(`Property is too small (${(areaSqFt / 43560).toFixed(2)} ac). Draw a larger boundary — minimum 1 acre.`);
      return;
    }
    setDrawError('');
    onComplete(geoJSON.geometry as PropertyBounds);
  };

  const handleMobileEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileEmail) return;
    setMobileSubmitting(true);
    try {
      await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mobileEmail, facilityType, source: 'mobile-block' }),
      });
    } catch { /* silent */ }
    setMobileSubmitting(false);
    setMobileSubmitted(true);
  };

  // Mobile block — Leaflet draw doesn't work on touch screens
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-6">🖥️</div>
        <h2 className="text-2xl font-bold mb-3">Best on Desktop</h2>
        <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
          Drawing your property boundary requires a mouse — this step doesn't work great on a phone.
          Open Land Optimizer on a desktop or laptop browser for the full experience.
        </p>
        {!mobileSubmitted ? (
          <form onSubmit={handleMobileEmailSubmit} className="w-full max-w-sm space-y-3">
            <p className="text-sm text-gray-500">Want us to remind you?</p>
            <input
              type="email"
              required
              value={mobileEmail}
              onChange={e => setMobileEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-[#1a1a1a] border border-white/[0.12] text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neon-green"
            />
            <button
              type="submit"
              disabled={mobileSubmitting}
              className="w-full py-3 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {mobileSubmitting ? 'Saving…' : 'Remind Me on Desktop'}
            </button>
          </form>
        ) : (
          <div className="bg-[#111111] border border-neon-green/30 rounded-lg p-5 max-w-sm">
            <p className="text-neon-green font-semibold mb-1">✓ Got it!</p>
            <p className="text-gray-400 text-sm">We'll follow up with a link. In the meantime, bookmark this page and open it on your computer.</p>
          </div>
        )}
        <button
          onClick={onBack}
          className="mt-8 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="bg-[#111111] border-b border-white/[0.08] p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-neon-green transition-colors"
            >
              ← Back
            </button>
            
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold">Outline Your Property</h2>
              <p className="text-gray-400 text-sm">
                Use the drawing tools to mark your property boundaries
              </p>
            </div>
            
            <button
              onClick={handleContinue}
              disabled={!drawnLayer}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                drawnLayer
                  ? 'bg-neon-green text-black hover:bg-neon-greenDark'
                  : 'bg-[#222222] text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue →
            </button>
          </div>
        </div>
        
        {/* Address search bar */}
        <div className="bg-[#080808] border-b border-white/[0.08] px-4 py-2">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchError(''); }}
              placeholder="Search your property address or city..."
              className="flex-1 bg-[#1a1a1a] border border-white/[0.12] text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon-green transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-neon-green text-black font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all whitespace-nowrap"
            >
              {isSearching ? 'Searching...' : '🔍 Find'}
            </button>
          </form>
          {searchError && (
            <p className="text-red-400 text-xs mt-1">{searchError}</p>
          )}
        </div>

        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] bg-opacity-50">
              <div className="text-neon-green text-xl">Loading map...</div>
            </div>
          )}
          
          {drawError && (
            <div className="absolute top-4 right-4 bg-red-900/80 border border-red-500/70 rounded-lg p-4 max-w-xs text-red-300 text-sm">
              ⚠ {drawError}
            </div>
          )}
          {!drawError && (
          <div className="absolute top-4 right-4 bg-[#111111] bg-opacity-95 rounded-lg p-4 max-w-xs border border-neon-green/30">
            <h3 className="font-bold mb-2 text-neon-green">Instructions:</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Search your property address above</li>
              <li>Use the polygon or rectangle tool on the left</li>
              <li>Click to place points around your property</li>
              <li>Double-click to finish the shape</li>
              <li>Edit or redraw as needed, then hit Continue</li>
            </ol>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
