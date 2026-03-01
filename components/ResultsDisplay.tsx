'use client';

import { useEffect, useRef, useState } from 'react';
import { FacilityType, PropertyBounds, Constraints, OptimizationResult, EntryPoint, Walkway } from '@/lib/layoutOptimizer';

interface ResultsDisplayProps {
  facilityType: FacilityType;
  propertyBounds: PropertyBounds;
  constraints: Constraints;
  onSave: () => void;
  onBack: () => void;
  isExample?: boolean;
  onStartOwn?: () => void;
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

function computePolygonAreaSqFt(coords: number[][]): number {
  if (coords.length < 3) return 0;
  const refLat = coords[0][1];
  const refLng = coords[0][0];
  const FPL = 364000;
  const FPN = 364000 * Math.cos(refLat * Math.PI / 180);
  const local = coords.map(c => [(c[0] - refLng) * FPN, (c[1] - refLat) * FPL]);
  let area = 0;
  for (let i = 0; i < local.length; i++) {
    const j = (i + 1) % local.length;
    area += local[i][0] * local[j][1] - local[j][0] * local[i][1];
  }
  return Math.abs(area) / 2;
}

function feetToLatLng(
  xFt: number, yFt: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): [number, number] {
  const avgLat = (bounds.minLat + bounds.maxLat) / 2;
  const FPL = 364000;
  const FPN = 364000 * Math.cos(avgLat * Math.PI / 180);
  return [bounds.maxLat - yFt / FPL, bounds.minLng + xFt / FPN];
}

// ─── Overpass road detection ─────────────────────────────────────────────────

async function detectRoadAccess(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<EntryPoint | null> {
  try {
    const pad = 0.003;
    const query = `[out:json][timeout:10];
(
  way["highway"~"^(primary|secondary|tertiary|residential|service|unclassified|road)$"](${bounds.minLat - pad},${bounds.minLng - pad},${bounds.maxLat + pad},${bounds.maxLng + pad});
);
out body;
>;
out skel qt;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const propW = bounds.maxLng - bounds.minLng;
    const propH = bounds.maxLat - bounds.minLat;

    // Build name lookup from way tags
    const wayNames: Record<number, string> = {};
    for (const el of data.elements) {
      if (el.type === 'way' && el.tags?.name) {
        for (const nodeId of (el.nodes || [])) wayNames[nodeId] = el.tags.name;
      }
    }

    // Find road node closest to property boundary (but outside it)
    let closest: { lat: number; lon: number; name?: string } | null = null;
    let minDist = Infinity;
    for (const el of data.elements) {
      if (el.type !== 'node') continue;
      // Skip nodes inside the property
      if (el.lat > bounds.minLat && el.lat < bounds.maxLat &&
          el.lon > bounds.minLng && el.lon < bounds.maxLng) continue;
      const dist = Math.hypot(el.lat - centerLat, el.lon - centerLng);
      if (dist < minDist) {
        minDist = dist;
        closest = { lat: el.lat, lon: el.lon, name: wayNames[el.id] };
      }
    }
    if (!closest) return null;

    // Determine which edge the road approaches from
    const dLat = closest.lat - centerLat;
    const dLng = closest.lon - centerLng;
    let side: 'north' | 'south' | 'east' | 'west';
    if (Math.abs(dLat / propH) > Math.abs(dLng / propW)) {
      side = dLat > 0 ? 'north' : 'south';
    } else {
      side = dLng > 0 ? 'east' : 'west';
    }

    const fraction = (side === 'north' || side === 'south')
      ? Math.max(0.1, Math.min(0.9, (closest.lon - bounds.minLng) / propW))
      : Math.max(0.1, Math.min(0.9, (closest.lat - bounds.minLat) / propH));

    return { side, fraction, roadName: closest.name };
  } catch {
    return null;
  }
}

// ─── Canvas site plan ────────────────────────────────────────────────────────

function generateSitePlanCanvas(
  result: OptimizationResult,
  propertyBounds: PropertyBounds,
  facilityType: FacilityType,
  constraints: Constraints
): HTMLCanvasElement {
  const CW = 1600, CH = 950, MAP_W = 980, MARGIN = 50;
  const PANEL_X = MAP_W + 20, PANEL_W = CW - PANEL_X - 20;

  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MAP_W + 10, 0); ctx.lineTo(MAP_W + 10, CH); ctx.stroke();

  // Geometry
  const coords = propertyBounds.coordinates[0];
  const lats = coords.map(c => c[1]), lngs = coords.map(c => c[0]);
  const bounds = {
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
    minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
  };
  const avgLat = (bounds.minLat + bounds.maxLat) / 2;
  const FPL = 364000, FPN = 364000 * Math.cos(avgLat * Math.PI / 180);
  const bboxW_ft = (bounds.maxLng - bounds.minLng) * FPN;
  const bboxH_ft = (bounds.maxLat - bounds.minLat) * FPL;
  const drawW = MAP_W - MARGIN * 2, drawH = CH - MARGIN * 2 - 70;
  const scale = Math.min(drawW / bboxW_ft, drawH / bboxH_ft) * 0.88;
  const offsetX = MARGIN + (drawW - bboxW_ft * scale) / 2;
  const offsetY = 70 + MARGIN + (drawH - bboxH_ft * scale) / 2;

  const toPixel = (lng: number, lat: number): [number, number] => [
    offsetX + (lng - bounds.minLng) * FPN * scale,
    offsetY + (bounds.maxLat - lat) * FPL * scale,
  ];
  const ftToPx = (xFt: number, yFt: number): [number, number] => [
    offsetX + xFt * scale,
    offsetY + yFt * scale,
  ];

  // Header
  ctx.fillStyle = '#39FF14'; ctx.font = 'bold 22px monospace';
  ctx.fillText('FACILITY SITE PLAN', MARGIN, 36);
  ctx.fillStyle = '#555'; ctx.font = '11px monospace';
  const facilityLabel = ({ paintball: 'Paintball Facility', airsoft: 'Airsoft Arena', trampoline: 'Trampoline Park', gellyball: 'Gellyball Field', fec: 'Family Entertainment Center' } as Record<string, string>)[facilityType ?? ''] ?? 'Facility';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillText(`${facilityLabel}  ·  ${dateStr}  ·  SPECIALTY INSURANCE SC`, MARGIN, 54);
  ctx.strokeStyle = '#39FF14'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MARGIN, 60); ctx.lineTo(MAP_W - MARGIN, 60); ctx.stroke();

  // Compass
  const [cx, cy] = [MAP_W - 45, 100];
  ctx.strokeStyle = '#39FF14'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy + 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 18, cy); ctx.lineTo(cx + 18, cy); ctx.stroke();
  ctx.fillStyle = '#39FF14'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - 23); ctx.textAlign = 'left';

  // ── Slope heatmap on canvas (drawn before boundary + fields) ────────────────
  const elevData = result.layout.elevationData;
  if (elevData && elevData.datasetUsed !== 'none') {
    const { slopeGrid, rows: eRows, cols: eCols } = elevData;
    const latStep = (bounds.maxLat - bounds.minLat) / (eRows - 1);
    const lngStep = (bounds.maxLng - bounds.minLng) / (eCols - 1);
    const canvasSlopeColor = (pct: number): string => {
      if (pct < 2)  return 'rgba(0,180,60,0.28)';
      if (pct < 5)  return 'rgba(210,180,0,0.32)';
      if (pct < 10) return 'rgba(255,110,0,0.35)';
      return 'rgba(200,0,0,0.38)';
    };
    for (let r = 0; r < eRows; r++) {
      for (let c = 0; c < eCols; c++) {
        const cellS = r === 0       ? bounds.minLat : bounds.minLat + (r - 0.5) * latStep;
        const cellN = r === eRows-1  ? bounds.maxLat : bounds.minLat + (r + 0.5) * latStep;
        const cellW = c === 0       ? bounds.minLng : bounds.minLng + (c - 0.5) * lngStep;
        const cellE = c === eCols-1  ? bounds.maxLng : bounds.minLng + (c + 0.5) * lngStep;
        const [px1, py1] = toPixel(cellW, cellN);
        const [px2, py2] = toPixel(cellE, cellS);
        ctx.fillStyle = canvasSlopeColor(slopeGrid[r][c]);
        ctx.fillRect(px1, py1, px2 - px1, py2 - py1);
      }
    }
    // Topo source label
    ctx.fillStyle = '#555'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`⛰ ${elevData.datasetUsed === 'ned10m' ? 'NED 10m' : 'SRTM 30m'} topo`, MAP_W - MARGIN, offsetY - 4);
    ctx.textAlign = 'left';
  }

  // Property boundary
  ctx.beginPath();
  coords.forEach((c, i) => { const [px, py] = toPixel(c[0], c[1]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  ctx.closePath();
  ctx.fillStyle = 'rgba(57,255,20,0.05)'; ctx.fill();
  ctx.strokeStyle = '#39FF14'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);

  // Playing fields
  result.layout.fields.forEach((field, i) => {
    const [px, py] = ftToPx(field.position.x, field.position.y);
    const fw = field.dimensions.width * scale, fh = field.dimensions.height * scale;
    ctx.fillStyle = 'rgba(57,255,20,0.22)'; ctx.fillRect(px, py, fw, fh);
    ctx.strokeStyle = '#39FF14'; ctx.lineWidth = 1.5; ctx.strokeRect(px, py, fw, fh);
    const fs = Math.max(8, Math.min(12, fw / 8));
    ctx.fillStyle = '#39FF14'; ctx.font = `bold ${fs}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(`F${i + 1}`, px + fw / 2, py + fh / 2 - 4);
    ctx.font = `${Math.max(7, fs - 2)}px monospace`; ctx.fillStyle = 'rgba(57,255,20,0.8)';
    ctx.fillText(field.type.split(' ')[0], px + fw / 2, py + fh / 2 + 10);
    ctx.textAlign = 'left';
  });

  // Support facilities — use actual optimizer positions so canvas matches Leaflet map.
  // Optimizer places Registration nearest to parking, so this naturally renders correctly.
  {
    const facs = result.layout.facilities;
    facs.forEach((fac, i) => {
      const [px, py] = ftToPx(fac.position.x, fac.position.y);
      const fw = Math.max(60, Math.sqrt(fac.area) * scale);
      const fh = Math.max(52, Math.sqrt(fac.area) * scale);
      ctx.fillStyle = 'rgba(0,191,255,0.22)'; ctx.fillRect(px, py, fw, fh);
      ctx.strokeStyle = '#00BFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(px, py, fw, fh);
      const parts = fac.name.split('/').map(s => s.trim());
      const line1 = parts[0];
      const line2 = parts[1] ?? '';
      const fs = Math.max(9, Math.min(11, fw / 8));
      ctx.fillStyle = '#00BFFF'; ctx.font = `bold ${fs}px monospace`;
      ctx.textAlign = 'center';
      if (line2) {
        ctx.fillText(line1, px + fw / 2, py + fh / 2 - 2);
        ctx.font = `${Math.max(8, fs - 1)}px monospace`;
        ctx.fillText(line2, px + fw / 2, py + fh / 2 + fs + 1);
      } else {
        ctx.fillText(line1, px + fw / 2, py + fh / 2 + fs / 2);
      }
      ctx.textAlign = 'left';
    });
  }

  // Parking lot
  const pLot = result.layout.parkingLot;
  if (pLot) {
    const [plPx, plPy] = ftToPx(pLot.position.x, pLot.position.y);
    const plW = pLot.width * scale;
    const plH = pLot.height * scale;

    // Base fill + border
    ctx.fillStyle = 'rgba(100,100,120,0.35)';
    ctx.fillRect(plPx, plPy, plW, plH);
    ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.strokeRect(plPx, plPy, plW, plH);

    // Drive aisle stripes (horizontal or vertical depending on orientation)
    const STALL_D_PX = 18 * scale;
    const AISLE_PX  = 24 * scale;
    const isHoriz = pLot.roadSide === 'north' || pLot.roadSide === 'south';
    ctx.strokeStyle = 'rgba(200,200,200,0.25)'; ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    if (isHoriz) {
      for (let y = plPy + STALL_D_PX; y < plPy + plH - 2; y += STALL_D_PX + AISLE_PX) {
        ctx.beginPath(); ctx.moveTo(plPx, y); ctx.lineTo(plPx + plW, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(plPx, y + STALL_D_PX); ctx.lineTo(plPx + plW, y + STALL_D_PX); ctx.stroke();
      }
      // Stall dividers
      const stallWPx = (pLot.spacesPerRow > 0) ? plW / pLot.spacesPerRow : plW;
      ctx.strokeStyle = 'rgba(180,180,180,0.15)'; ctx.lineWidth = 0.5; ctx.setLineDash([]);
      for (let x = plPx + stallWPx; x < plPx + plW - 1; x += stallWPx) {
        ctx.beginPath(); ctx.moveTo(x, plPy); ctx.lineTo(x, plPy + plH); ctx.stroke();
      }
    } else {
      for (let x = plPx + STALL_D_PX; x < plPx + plW - 2; x += STALL_D_PX + AISLE_PX) {
        ctx.beginPath(); ctx.moveTo(x, plPy); ctx.lineTo(x, plPy + plH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + STALL_D_PX, plPy); ctx.lineTo(x + STALL_D_PX, plPy + plH); ctx.stroke();
      }
      const stallWPx = (pLot.spacesPerRow > 0) ? plH / pLot.spacesPerRow : plH;
      ctx.strokeStyle = 'rgba(180,180,180,0.15)'; ctx.lineWidth = 0.5; ctx.setLineDash([]);
      for (let y = plPy + stallWPx; y < plPy + plH - 1; y += stallWPx) {
        ctx.beginPath(); ctx.moveTo(plPx, y); ctx.lineTo(plPx + plW, y); ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(200,200,200,0.8)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`P  PARKING  ${pLot.spaces} spaces`, plPx + plW / 2, plPy + plH / 2 + 4);
    ctx.textAlign = 'left';

    // Entrance/exit gaps — yellow overlay on road-facing edge
    pLot.entranceGaps.forEach((gap, gi) => {
      const GAP_PX = gap.width * scale;
      const OFFSET_PX = gap.offset * scale;
      let gx: number, gy: number, gw: number, gh: number;
      let lx: number, ly: number;
      if (pLot.roadSide === 'south') {
        gx = plPx + OFFSET_PX; gy = plPy + plH - 4; gw = GAP_PX; gh = 8;
      } else if (pLot.roadSide === 'north') {
        gx = plPx + OFFSET_PX; gy = plPy - 4; gw = GAP_PX; gh = 8;
      } else if (pLot.roadSide === 'east') {
        gx = plPx + plW - 4; gy = plPy + OFFSET_PX; gw = 8; gh = GAP_PX;
      } else {
        gx = plPx - 4; gy = plPy + OFFSET_PX; gw = 8; gh = GAP_PX;
      }
      lx = gx + gw / 2; ly = gy + gh / 2;
      ctx.fillStyle = '#FFD700'; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = '#000'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText(gi === 0 ? 'IN' : 'OUT', lx, ly + 3);
    });
    ctx.textAlign = 'left';
  }

  // Walkways — rendered last so they sit on top of everything
  const walkwayCanvasStyle: Record<string, { color: string; width: number; dash?: number[]; glow?: string }> = {
    perimeter:     { color: 'rgba(255,80,80,0.85)',   width: 2.5, dash: [8, 4], glow: 'rgba(255,80,80,0.4)' },
    spine:         { color: 'rgba(255,255,255,0.95)', width: 4,                 glow: 'rgba(255,255,255,0.5)' },
    entrance:      { color: 'rgba(255,215,0,0.97)',   width: 4,                 glow: 'rgba(255,215,0,0.5)' },
    'inter-field': { color: 'rgba(150,255,150,0.85)', width: 2.5, dash: [5, 4], glow: 'rgba(150,255,150,0.3)' },
  };
  result.layout.walkways.forEach(w => {
    const style = walkwayCanvasStyle[w.type] ?? { color: 'rgba(200,200,200,0.7)', width: 2 };
    // Glow pass first (blurred, wider line behind)
    if (style.glow) {
      ctx.shadowColor = style.glow;
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash ?? []);
    ctx.beginPath();
    w.path.forEach((p, i) => {
      const [px, py] = ftToPx(p.x, p.y);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([]);
  });

  // Entry point arrow
  if (result.layout.entryPoint) {
    const ep = result.layout.entryPoint;
    let ax: number, ay: number, dx: number, dy: number;
    const bwPx = bboxW_ft * scale, bhPx = bboxH_ft * scale;
    switch (ep.side) {
      case 'south': ax = offsetX + ep.fraction * bwPx; ay = offsetY + bhPx + 30; dx = 0; dy = -1; break;
      case 'north': ax = offsetX + ep.fraction * bwPx; ay = offsetY - 30; dx = 0; dy = 1; break;
      case 'east':  ax = offsetX + bwPx + 30; ay = offsetY + (1 - ep.fraction) * bhPx; dx = -1; dy = 0; break;
      case 'west':  ax = offsetX - 30; ay = offsetY + (1 - ep.fraction) * bhPx; dx = 1; dy = 0; break;
    }
    const alen = 40;
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax!, ay!); ctx.lineTo(ax! + dx! * alen, ay! + dy! * alen); ctx.stroke();
    ctx.fillStyle = '#FFD700'; ctx.beginPath();
    ctx.moveTo(ax! + dx! * alen, ay! + dy! * alen);
    ctx.lineTo(ax! + dx! * (alen - 12) - dy! * 8, ay! + dy! * (alen - 12) + dx! * 8);
    ctx.lineTo(ax! + dx! * (alen - 12) + dy! * 8, ay! + dy! * (alen - 12) - dx! * 8);
    ctx.closePath(); ctx.fill();
    // Label positions: always outside property boundary, road name below ENTRY
    // ax/ay is the arrow BASE (outside property); arrow tip points inward
    // For vertical arrows (north/south): dx=0, offset labels along y from base
    // For horizontal arrows (east/west): dy=0, offset labels along x from base
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    const labelX = ax! + dx! * (alen * 0.15);
    const labelY = dy! ? ay! + dy! * (-8) : ay! - 13;   // pull back toward base
    ctx.fillText('ENTRY', labelX, labelY);
    if (ep.roadName) {
      ctx.font = '9px monospace';
      const roadY = dy! ? labelY + dy! * (-13) : labelY + 13;
      ctx.fillText(ep.roadName, labelX, roadY);
    }
    ctx.textAlign = 'left';
  }

  // Scale bar
  const sbFt = 100, sbPx = sbFt * scale, sbX = MARGIN + 10, sbY = CH - 28;
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sbX, sbY); ctx.lineTo(sbX + sbPx, sbY);
  ctx.moveTo(sbX, sbY - 4); ctx.lineTo(sbX, sbY + 4);
  ctx.moveTo(sbX + sbPx, sbY - 4); ctx.lineTo(sbX + sbPx, sbY + 4);
  ctx.stroke();
  ctx.fillStyle = '#666'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('100 ft', sbX + sbPx / 2, sbY - 7); ctx.textAlign = 'left';

  // Info panel
  let py2 = 20;
  const lh = 22;
  const pt = (text: string, size: number, color: string, bold = false) => {
    ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${size}px monospace`;
    ctx.fillText(text, PANEL_X, py2); py2 += lh;
  };
  const pl = () => {
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PANEL_X, py2); ctx.lineTo(PANEL_X + PANEL_W, py2); ctx.stroke();
    py2 += 10;
  };
  const pr = (label: string, value: string, vc = '#fff') => {
    ctx.fillStyle = '#777'; ctx.font = '11px monospace'; ctx.fillText(label, PANEL_X, py2);
    ctx.fillStyle = vc; ctx.textAlign = 'right'; ctx.fillText(value, PANEL_X + PANEL_W, py2);
    ctx.textAlign = 'left'; py2 += lh;
  };

  pt('LAYOUT SUMMARY', 14, '#39FF14', true); py2 += 4; pl();

  // Entry detection badge
  if (result.layout.entryPoint) {
    ctx.fillStyle = '#2a1f00';
    ctx.fillRect(PANEL_X - 4, py2 - 14, PANEL_W + 8, 26);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px monospace';
    ctx.fillText(`⤷ ${result.layout.entryPoint.side.toUpperCase()} ENTRY DETECTED${result.layout.entryPoint.roadName ? ': ' + result.layout.entryPoint.roadName : ''}`, PANEL_X + 2, py2);
    py2 += 28;
  }

  // Metrics
  const mw = (PANEL_W - 6) / 2, mh = 54;
  const mbox = (label: string, val: string, x: number, y: number) => {
    ctx.fillStyle = '#111'; ctx.fillRect(x, y, mw, mh);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.strokeRect(x, y, mw, mh);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
    ctx.fillText(val, x + mw / 2, y + mh / 2 + 2);
    ctx.fillStyle = '#555'; ctx.font = '9px monospace';
    ctx.fillText(label.toUpperCase(), x + mw / 2, y + mh / 2 + 15);
    ctx.textAlign = 'left';
  };
  mbox('Playing Fields', String(result.metrics.fieldCount), PANEL_X, py2);
  mbox('Max Players', String(result.metrics.maxCapacity), PANEL_X + mw + 6, py2); py2 += mh + 6;
  mbox('Space Utilized', `${result.metrics.utilizationPercent}%`, PANEL_X, py2);
  mbox('Parking Spaces', String(result.layout.parking.spaces), PANEL_X + mw + 6, py2); py2 += mh + 14;
  pl();

  pt('PROPERTY', 11, '#39FF14', true); py2 += 2;
  pr('Total Area', `${result.metrics.totalArea.toLocaleString()} sq ft`);
  pr('Acreage', `${(result.metrics.totalArea / 43560).toFixed(2)} acres`);
  pr('Usable Area', `${result.metrics.usableArea.toLocaleString()} sq ft`);
  py2 += 4; pl();

  pt('COST ESTIMATE', 11, '#39FF14', true); py2 += 2;
  pr('Fields', `$${result.costEstimate.fields.toLocaleString()}`);
  pr('Support Facilities', `$${result.costEstimate.facilities.toLocaleString()}`);
  pr(`Parking (${result.layout.parking.spaces})`, `$${result.costEstimate.parking.toLocaleString()}`);
  if (result.costEstimate.grading > 0) {
    pr('Site Grading', `$${result.costEstimate.grading.toLocaleString()}`, '#FFD700');
  }
  pr('Permits & Fees', `$${result.costEstimate.permits.toLocaleString()}`);
  const over = result.costEstimate.total > constraints.budget;
  if (over) { ctx.fillStyle = 'rgba(255,50,50,0.1)'; ctx.fillRect(PANEL_X - 4, py2 - 14, PANEL_W + 8, lh + 2); }
  pr('TOTAL ESTIMATE', `$${result.costEstimate.total.toLocaleString()}`, over ? '#ff4444' : '#39FF14');
  pr('Budget', `$${constraints.budget.toLocaleString()}`, '#666');
  py2 += 4; pl();

  pt('FIELDS', 11, '#39FF14', true); py2 += 2;
  result.layout.fields.forEach((f, i) => {
    ctx.fillStyle = '#666'; ctx.font = '10px monospace';
    ctx.fillText(`F${i + 1}  ${f.type}`, PANEL_X, py2);
    ctx.fillStyle = '#999'; ctx.textAlign = 'right';
    const isRot = f.dimensions.width > f.dimensions.height;
    const dimStr = `${f.dimensions.width}×${f.dimensions.height}ft${isRot ? ' ↺' : ''}${f.slopePct != null ? '  ' + f.slopePct + '%' : ''}`;
    ctx.fillText(dimStr, PANEL_X + PANEL_W, py2);
    ctx.textAlign = 'left'; py2 += 17;
  });
  py2 += 4; pl();

  pt('SUPPORT FACILITIES', 11, '#00BFFF', true); py2 += 2;
  result.layout.facilities.forEach(fac => {
    ctx.fillStyle = '#666'; ctx.font = '10px monospace';
    ctx.fillText(fac.name.length > 24 ? fac.name.substring(0, 24) + '…' : fac.name, PANEL_X, py2);
    ctx.fillStyle = '#999'; ctx.textAlign = 'right';
    ctx.fillText(`${fac.area.toLocaleString()} sqft`, PANEL_X + PANEL_W, py2);
    ctx.textAlign = 'left'; py2 += 17;
  });
  py2 += 6; pl();

  // Legend
  pt('LEGEND', 11, '#39FF14', true); py2 += 4;
  const lswatch = (color: string, label: string) => {
    ctx.fillStyle = color; ctx.fillRect(PANEL_X, py2 - 10, 14, 12);
    ctx.fillStyle = '#999'; ctx.font = '10px monospace'; ctx.fillText(label, PANEL_X + 20, py2); py2 += 17;
  };
  lswatch('rgba(57,255,20,0.4)', 'Playing Fields');
  lswatch('rgba(0,191,255,0.4)', 'Support Facilities');
  lswatch('rgba(100,100,120,0.5)', 'Parking Lot');
  lswatch('rgba(255,215,0,0.8)', 'Vehicle Entry / Road Access');
  // Slope heatmap legend (only shown when topo data present)
  if (elevData && elevData.datasetUsed !== 'none') {
    py2 += 4;
    ctx.fillStyle = '#555'; ctx.font = '9px monospace';
    ctx.fillText(`SLOPE (${elevData.datasetUsed === 'ned10m' ? 'NED 10m' : 'SRTM 30m'})`, PANEL_X, py2); py2 += 14;
    lswatch('rgba(0,180,60,0.5)',   '< 2%  flat');
    lswatch('rgba(210,180,0,0.5)',  '2–5%  gentle');
    lswatch('rgba(255,110,0,0.5)',  '5–10% moderate');
    lswatch('rgba(200,0,0,0.5)',    '> 10% steep');
  }
  // Walkway legend lines
  const wlegend = [
    { color: 'rgba(255,255,255,0.7)', label: 'Main Circulation (12ft paved)' },
    { color: 'rgba(255,215,0,0.85)',  label: 'Entrance Path (10ft paved)' },
    { color: 'rgba(150,255,150,0.6)', label: 'Field Access (6ft grass)' },
    { color: 'rgba(255,80,80,0.6)',   label: 'Emergency Perimeter (8ft gravel)' },
  ];
  wlegend.forEach(({ color, label }) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PANEL_X, py2 - 5); ctx.lineTo(PANEL_X + 14, py2 - 5); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.font = '10px monospace'; ctx.fillText(label, PANEL_X + 20, py2); py2 += 17;
  });
  ctx.strokeStyle = '#39FF14'; ctx.setLineDash([4, 2]); ctx.lineWidth = 1.5;
  ctx.strokeRect(PANEL_X, py2 - 10, 14, 12); ctx.setLineDash([]);
  ctx.fillStyle = '#999'; ctx.font = '10px monospace'; ctx.fillText('Property Boundary', PANEL_X + 20, py2); py2 += 17;

  // Footer
  ctx.fillStyle = '#2a2a2a'; ctx.font = '9px monospace';
  ctx.fillText('Generated by Specialty Insurance SC — specialtyinsurancesc.com', PANEL_X, CH - 14);

  return canvas;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FACILITY_NAMES: Record<string, string> = {
  paintball: 'Paintball Facility', airsoft: 'Airsoft Arena',
  trampoline: 'Trampoline Park', gellyball: 'Gellyball Field', fec: 'Family Entertainment Center',
};
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
const SISC_URL = 'http://178.156.252.103:8095/';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsDisplay({
  facilityType, propertyBounds, constraints, onSave, onBack, isExample = false, onStartOwn,
}: ResultsDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [statusText, setStatusText] = useState('Detecting road access...');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sitePlanUrl, setSitePlanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const coords = propertyBounds.coordinates[0];
    const lats = coords.map(c => c[1]), lngs = coords.map(c => c[0]);
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    const bounds = {
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
      minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
    };
    const areaSqFt = computePolygonAreaSqFt(coords);

    const init = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([centerLat, centerLng], 16);
      mapInstanceRef.current = map;

      L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 }).addTo(map);

      const boundary = L.polygon(
        coords.map(c => [c[1], c[0]] as [number, number]),
        { color: '#39FF14', weight: 3, fillColor: '#39FF14', fillOpacity: 0.06 }
      ).addTo(map);
      map.fitBounds(boundary.getBounds());

      // Step 1: detect road access via Overpass
      setStatusText('Detecting road access...');
      const entryPoint = await detectRoadAccess(bounds);

      // Mark entry point on map if found
      if (entryPoint) {
        const FPL = 364000, FPN = 364000 * Math.cos(centerLat * Math.PI / 180);
        const bboxW = bounds.maxLng - bounds.minLng;
        const bboxH = bounds.maxLat - bounds.minLat;
        let eLat: number, eLng: number;
        switch (entryPoint.side) {
          case 'south': eLat = bounds.minLat; eLng = bounds.minLng + entryPoint.fraction * bboxW; break;
          case 'north': eLat = bounds.maxLat; eLng = bounds.minLng + entryPoint.fraction * bboxW; break;
          case 'east':  eLat = bounds.minLat + entryPoint.fraction * bboxH; eLng = bounds.maxLng; break;
          case 'west':  eLat = bounds.minLat + entryPoint.fraction * bboxH; eLng = bounds.minLng; break;
        }
        const entryIcon = L.divIcon({
          html: `<div style="background:#FFD700;color:#000;font-weight:bold;font-size:10px;padding:3px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 0 6px rgba(255,215,0,0.6)">🚗 ENTRY${entryPoint.roadName ? ': ' + entryPoint.roadName : ''}</div>`,
          className: '',
          iconAnchor: [40, 12],
        });
        L.marker([eLat!, eLng!], { icon: entryIcon }).addTo(map);
      }

      // Step 2: generate layout
      setStatusText('Generating optimized layout...');
      try {
        const res = await fetch('/api/generate-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property: { coordinates: coords, area: areaSqFt },
            facilityType,
            constraints,
            entryPoint,
          }),
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error || `API error ${res.status}`);
        }
        const optResult: OptimizationResult = await res.json();
        setResult(optResult);

        // ── Slope heatmap (drawn under everything else) ──────────────────────
        const elevData = optResult.layout.elevationData;
        if (elevData && elevData.datasetUsed !== 'none') {
          const { slopeGrid, rows, cols } = elevData;
          const latStep = (bounds.maxLat - bounds.minLat) / (rows - 1);
          const lngStep = (bounds.maxLng - bounds.minLng) / (cols - 1);
          const slopeColor = (pct: number) => {
            if (pct < 2)  return 'rgba(0,200,80,0.30)';
            if (pct < 5)  return 'rgba(220,200,0,0.35)';
            if (pct < 10) return 'rgba(255,120,0,0.38)';
            return 'rgba(220,0,0,0.42)';
          };
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cellS = r === 0      ? bounds.minLat : bounds.minLat + (r - 0.5) * latStep;
              const cellN = r === rows-1 ? bounds.maxLat : bounds.minLat + (r + 0.5) * latStep;
              const cellW = c === 0      ? bounds.minLng : bounds.minLng + (c - 0.5) * lngStep;
              const cellE = c === cols-1 ? bounds.maxLng : bounds.minLng + (c + 0.5) * lngStep;
              const slope = slopeGrid[r][c];
              L.rectangle(
                [[cellS, cellW], [cellN, cellE]],
                { color: 'transparent', weight: 0, fillColor: slopeColor(slope), fillOpacity: 1 }
              ).bindTooltip(`Slope: ${slope}% (${elevData.datasetUsed})`, { sticky: true })
               .addTo(map);
            }
          }
          // Legend badge
          const legendHtml = `
            <div style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;padding:6px 8px;border-radius:4px;line-height:1.6">
              <b>SLOPE</b><br/>
              <span style="color:#00c850">■</span> &lt;2% flat&nbsp;&nbsp;
              <span style="color:#dcc800">■</span> 2–5% gentle<br/>
              <span style="color:#ff7800">■</span> 5–10% moderate&nbsp;&nbsp;
              <span style="color:#dc0000">■</span> &gt;10% steep
            </div>`;
          L.marker([bounds.maxLat, bounds.maxLng], {
            icon: L.divIcon({ html: legendHtml, className: '', iconAnchor: [0, 0] }),
            interactive: false,
          }).addTo(map);
        }

        // Draw fields
        optResult.layout.fields.forEach(field => {
          const sw = feetToLatLng(field.position.x, field.position.y + field.dimensions.height, bounds);
          const ne = feetToLatLng(field.position.x + field.dimensions.width, field.position.y, bounds);
          const slopeLabel = field.slopePct != null ? `<br/>Slope: ${field.slopePct}%` : '';
          const rotLabel = field.dimensions.width > field.dimensions.height ? ' ↺ rotated' : '';
          L.rectangle([sw, ne], { color: '#39FF14', weight: 2, fillColor: '#39FF14', fillOpacity: 0.35 })
            .bindTooltip(`<b>${field.type}${rotLabel}</b><br/>$${field.cost.toLocaleString()}${slopeLabel}`, { sticky: true })
            .addTo(map);
        });

        // Draw facilities
        optResult.layout.facilities.forEach(fac => {
          const size = Math.sqrt(fac.area);
          const sw = feetToLatLng(fac.position.x, fac.position.y + size, bounds);
          const ne = feetToLatLng(fac.position.x + size, fac.position.y, bounds);
          L.rectangle([sw, ne], { color: '#00BFFF', weight: 2, fillColor: '#00BFFF', fillOpacity: 0.35 })
            .bindTooltip(`<b>${fac.name}</b><br/>$${fac.cost.toLocaleString()}`, { sticky: true })
            .addTo(map);
        });

        // Draw parking lot
        const pLot = optResult.layout.parkingLot;
        if (pLot) {
          const plSW = feetToLatLng(pLot.position.x, pLot.position.y + pLot.height, bounds);
          const plNE = feetToLatLng(pLot.position.x + pLot.width, pLot.position.y, bounds);
          L.rectangle([plSW, plNE], { color: '#AAAAAA', weight: 2, fillColor: '#555555', fillOpacity: 0.45 })
            .bindTooltip(`<b>Parking Lot</b><br/>${pLot.spaces} spaces`, { sticky: true })
            .addTo(map);

          // Entrance/exit gap markers + arrows on road-facing edge
          pLot.entranceGaps.forEach((gap, gi) => {
            const isHoriz = pLot.roadSide === 'north' || pLot.roadSide === 'south';
            let gapSW: [number, number], gapNE: [number, number];
            let arrowA: [number, number], arrowB: [number, number];

            if (isHoriz) {
              const edgeY = pLot.roadSide === 'south' ? pLot.position.y + pLot.height : pLot.position.y;
              const arrowOffsetFt = pLot.roadSide === 'south' ? 30 : -30;
              gapSW = feetToLatLng(pLot.position.x + gap.offset, edgeY + 2, bounds);
              gapNE = feetToLatLng(pLot.position.x + gap.offset + gap.width, edgeY - 2, bounds);
              arrowA = feetToLatLng(pLot.position.x + gap.offset + gap.width / 2, edgeY, bounds);
              arrowB = feetToLatLng(pLot.position.x + gap.offset + gap.width / 2, edgeY + arrowOffsetFt, bounds);
            } else {
              const edgeX = pLot.roadSide === 'east' ? pLot.position.x + pLot.width : pLot.position.x;
              const arrowOffsetFt = pLot.roadSide === 'east' ? 30 : -30;
              gapSW = feetToLatLng(edgeX - 2, pLot.position.y + gap.offset, bounds);
              gapNE = feetToLatLng(edgeX + 2, pLot.position.y + gap.offset + gap.width, bounds);
              arrowA = feetToLatLng(edgeX, pLot.position.y + gap.offset + gap.width / 2, bounds);
              arrowB = feetToLatLng(edgeX + arrowOffsetFt, pLot.position.y + gap.offset + gap.width / 2, bounds);
            }

            // Yellow gap overlay (drives over parking lot fill)
            L.rectangle([gapSW, gapNE], { color: '#FFD700', weight: 0, fillColor: '#FFD700', fillOpacity: 0.85 })
              .bindTooltip(gi === 0 ? '🚗 Entrance' : '🚙 Exit', { sticky: true })
              .addTo(map);

            // Arrow line from road toward interior
            L.polyline([arrowA, arrowB], { color: '#FFD700', weight: 3, dashArray: '6 3' }).addTo(map);
          });
        }

        // Draw walkways
        const walkwayStyle: Record<string, { color: string; weight: number; dashArray?: string; opacity: number }> = {
          perimeter:   { color: '#ff5555', weight: 3, dashArray: '8 4', opacity: 0.9 },
          spine:       { color: '#ffffff', weight: 5, opacity: 0.95 },
          entrance:    { color: '#FFD700', weight: 5, opacity: 0.97 },
          'inter-field': { color: '#aaffaa', weight: 3, dashArray: '5 4', opacity: 0.85 },
        };
        optResult.layout.walkways.forEach(w => {
          const style = walkwayStyle[w.type] ?? { color: '#888', weight: 2, opacity: 0.6 };
          const latLngs = w.path.map(p => feetToLatLng(p.x, p.y, bounds));
          L.polyline(latLngs, { ...style })
            .bindTooltip(`<b>${w.label ?? w.type}</b><br/>${w.widthFt}ft ${w.surface}`, { sticky: true })
            .addTo(map);
        });

        setIsGenerating(false);
      } catch (err: any) {
        setError(err.message || 'Layout generation failed.');
        setIsGenerating(false);
      }
    };

    init();
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  const [isPDFGenerating, setIsPDFGenerating] = useState(false);

  const handleViewSitePlan = () => {
    if (!result) return;
    const canvas = generateSitePlanCanvas(result, propertyBounds, facilityType, constraints);
    setSitePlanUrl(canvas.toDataURL('image/png'));
  };

  const handleDownloadSitePlan = () => {
    if (!sitePlanUrl) return;
    const link = document.createElement('a');
    link.download = `site-plan-${facilityType}-${Date.now()}.png`;
    link.href = sitePlanUrl;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!result || isPDFGenerating) return;
    setIsPDFGenerating(true);
    try {
      // Generate the site plan canvas (same as PNG export)
      const canvas = generateSitePlanCanvas(result, propertyBounds, facilityType, constraints);
      const sitePlanDataUrl = canvas.toDataURL('image/png');

      const { generateFeasibilityPDF } = await import('@/lib/generatePDF');
      await generateFeasibilityPDF({
        result,
        facilityType: facilityType ?? 'unknown',
        sitePlanDataUrl,
        constraints,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed — try again.');
    } finally {
      setIsPDFGenerating(false);
    }
  };

  const facilityLabel = FACILITY_NAMES[facilityType || ''] ?? 'Facility';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="h-[calc(100vh-64px)] flex flex-col">

        {/* Example mode banner */}
        {isExample && (
          <div className="bg-blue-950 border-b border-blue-700 px-4 py-2 flex items-center justify-between">
            <p className="text-blue-300 text-sm font-medium">
              ⚡ Example Layout — 5-Acre Paintball Facility, Dallas TX ($300K budget)
            </p>
            <button
              onClick={onStartOwn}
              className="ml-4 px-4 py-1.5 bg-neon-green text-black text-sm font-bold rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
            >
              Design My Property →
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#111111] border-b border-white/[0.08] p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={onBack} className="text-gray-400 hover:text-neon-green transition-colors">← Back</button>
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold">Your Optimized Layout</h2>
              <p className="text-gray-400 text-sm">AI-generated facility design for your property</p>
            </div>
            <div className="flex gap-3">
              {result && (
                <>
                  <button onClick={handleViewSitePlan}
                    className="px-5 py-2 bg-[#1a1a1a] border border-neon-green text-neon-green rounded-lg font-semibold hover:bg-[#222222] transition-all text-sm">
                    📄 Site Plan
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isPDFGenerating}
                    className="px-5 py-2 bg-[#1a1a1a] border border-blue-400 text-blue-400 rounded-lg font-semibold hover:bg-[#222222] transition-all text-sm disabled:opacity-50 disabled:cursor-wait">
                    {isPDFGenerating ? '⏳ Building PDF…' : '📑 Export PDF'}
                  </button>
                </>
              )}
              <button onClick={onSave}
                className="px-5 py-2 bg-[#1a1a1a] border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-[#222222] transition-all text-sm">
                📥 Save
              </button>
              <button onClick={() => window.open(SISC_URL, '_blank')}
                className="px-5 py-2 bg-neon-green text-black rounded-lg font-semibold hover:opacity-90 transition-all text-sm">
                Get Insurance Quote →
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] bg-opacity-80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-green mx-auto mb-4" />
                  <div className="text-neon-green text-xl font-semibold">{statusText}</div>
                  <div className="text-gray-400 text-sm mt-2">This takes a few seconds</div>
                </div>
              </div>
            )}
            {!isGenerating && result && (
              <div className="absolute bottom-4 left-4 bg-[#111111] bg-opacity-95 rounded-lg p-3 border border-white/[0.12] text-sm space-y-1">
                <div className="font-bold text-white mb-2">Legend</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(57,255,20,0.5)', border: '1px solid #39FF14' }} />
                  <span className="text-gray-300">Playing Fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(0,191,255,0.5)', border: '1px solid #00BFFF' }} />
                  <span className="text-gray-300">Support Facilities</span>
                </div>
                {result.layout.parkingLot && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(100,100,120,0.6)', border: '1px solid #AAAAAA' }} />
                    <span className="text-gray-300">Parking Lot ({result.layout.parkingLot.spaces} spaces)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-4 border-t-2 border-white opacity-70" />
                  <span className="text-gray-300">Main Circulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 border-t-2 border-red-400 opacity-60" style={{ borderStyle: 'dashed' }} />
                  <span className="text-gray-300">Emergency Perimeter</span>
                </div>
                {result.layout.entryPoint && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">🚗</span>
                    <span className="text-yellow-300">
                      {result.layout.entryPoint.side.charAt(0).toUpperCase() + result.layout.entryPoint.side.slice(1)} entry
                      {result.layout.entryPoint.roadName && ` — ${result.layout.entryPoint.roadName}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-96 bg-[#111111] border-l border-white/[0.08] overflow-y-auto flex-shrink-0">
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-900/40 border border-red-500/60 rounded-lg p-5 text-red-300">
                  <p className="font-bold text-red-400 mb-2">⚠ Layout generation failed</p>
                  <p className="text-sm mb-4">{error.includes('property.area') || error.includes('coordinates')
                    ? 'Your property boundary couldn\'t be read — this usually means the drawn shape was too small or the drawing tool wasn\'t active when you dragged. Go back and redraw a larger rectangle.'
                    : error}</p>
                  <button
                    onClick={onBack}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >← Go Back & Redraw</button>
                </div>
              )}

              <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">Facility Type</h3>
                <p className="text-white font-semibold">{facilityLabel}</p>
              </div>

              {result ? (
                <>
                  {result.layout.entryPoint && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3 text-sm">
                      <span className="text-yellow-400 font-semibold">🚗 Vehicle Access Detected</span>
                      <p className="text-yellow-200 mt-1">
                        Road approach from {result.layout.entryPoint.side}
                        {result.layout.entryPoint.roadName && ` via ${result.layout.entryPoint.roadName}`}.
                        Parking and entrance facilities positioned accordingly.
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold mb-3 text-neon-green">Layout Results</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: result.metrics.fieldCount, l: 'Playing Fields' },
                        { v: result.metrics.maxCapacity, l: 'Max Players' },
                        { v: `${result.metrics.utilizationPercent}%`, l: 'Space Utilized' },
                        { v: result.layout.parking.spaces, l: 'Parking Spaces' },
                      ].map(({ v, l }) => (
                        <div key={l} className="bg-[#1a1a1a] rounded-lg p-3">
                          <div className="text-3xl font-bold text-white">{v}</div>
                          <div className="text-xs text-gray-400 mt-1">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3 text-neon-green">Cost Estimate</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { l: `Fields (${result.metrics.fieldCount}x)`, v: result.costEstimate.fields },
                        { l: 'Support Facilities', v: result.costEstimate.facilities },
                        { l: `Parking (${result.layout.parking.spaces})`, v: result.costEstimate.parking },
                        ...(result.costEstimate.grading > 0 ? [{ l: '⛰ Site Grading', v: result.costEstimate.grading }] : []),
                        { l: 'Permits & Fees', v: result.costEstimate.permits },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex justify-between">
                          <span className="text-gray-400">{l}</span>
                          <span className="text-white">${v.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-white/[0.12] pt-2 font-bold text-base">
                        <span className="text-white">Total Estimate</span>
                        <span className={result.costEstimate.total > constraints.budget ? 'text-red-400' : 'text-neon-green'}>
                          ${result.costEstimate.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Your Budget</span><span>${constraints.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3 text-neon-green">Property Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Area</span>
                        <span className="text-white">{result.metrics.totalArea.toLocaleString()} sq ft <span className="text-gray-500">({(result.metrics.totalArea / 43560).toFixed(2)} ac)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Usable Area</span>
                        <span className="text-white">{result.metrics.usableArea.toLocaleString()} sq ft</span>
                      </div>
                    </div>
                  </div>

                  {result.warnings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 text-yellow-400">⚠ Heads Up</h3>
                      <ul className="space-y-2">
                        {result.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-900/40 rounded-lg p-3">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 text-neon-green">Recommendations</h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-300">
                            <span className="text-neon-green flex-shrink-0 mt-0.5">→</span><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-[#1a1a1a] border border-neon-green/20 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-400 mb-3">Export your layout for a feasibility study, investor deck, or site plan review.</p>
                    <button onClick={handleViewSitePlan}
                      className="w-full px-4 py-3 bg-[#222222] border border-neon-green text-neon-green font-bold rounded-lg hover:bg-gray-600 transition-all">
                      📄 View Site Plan (PNG)
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isPDFGenerating}
                      className="w-full px-4 py-3 bg-blue-900/40 border border-blue-400 text-blue-300 font-bold rounded-lg hover:bg-blue-900/60 transition-all disabled:opacity-50 disabled:cursor-wait">
                      {isPDFGenerating ? '⏳ Generating PDF…' : '📑 Export Full PDF Report'}
                    </button>
                  </div>
                </>
              ) : !isGenerating ? (
                <div>
                  <p className="text-gray-400 text-sm">Budget: ${constraints.budget.toLocaleString()}</p>
                </div>
              ) : null}

              {!error && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <div className="bg-[#1a1a1a] border border-neon-green/30 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-3">
                      <strong className="text-neon-green">Next Step:</strong> Get specialized insurance for your {facilityLabel.toLowerCase()}. Most clients are underinsured by 40%+.
                    </p>
                    <button onClick={() => window.open(SISC_URL, '_blank')}
                      className="w-full px-4 py-3 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition-all">
                      Request Insurance Quote →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Site Plan Modal */}
      {sitePlanUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a0a] bg-opacity-90 flex flex-col"
          onClick={() => setSitePlanUrl(null)}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-6 py-3 bg-[#111111] border-b border-white/[0.12] flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg">📄 Site Plan</h3>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadSitePlan}
                className="px-5 py-2 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition-all text-sm"
              >
                ⬇ Download PNG
              </button>
              <button
                onClick={() => setSitePlanUrl(null)}
                className="px-4 py-2 bg-[#222222] text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm"
              >
                ✕ Close
              </button>
            </div>
          </div>
          {/* Plan image */}
          <div
            className="flex-1 overflow-auto p-4 flex items-start justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sitePlanUrl}
              alt="Site Plan"
              className="max-w-none rounded-lg shadow-2xl border border-white/[0.12]"
              style={{ width: '100%', maxWidth: '1600px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
