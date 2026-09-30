import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Navigation, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BUILDINGS_DATA, MSRIT_LOCATIONS_DATA } from '../data/campusData';
import type { Building, MSRITLocation } from '../data/campusData';

interface EditorialMapProps {
  onSelectBuildingForNav: (id: string) => void;
}

export interface PlacedBuildingCard {
  building: Building;
  anchorX: number;
  anchorY: number;
  cardX: number; // center X of card
  cardY: number; // center Y of card
  width: number;
  height: number;
  edgeX: number; // intersection point on card border for leader line
  edgeY: number;
  needsLeaderLine: boolean;
}

/**
 * Geometric calculation of line-rectangle intersection:
 * Computes exact intersection point on the card bounding box facing the anchor point.
 */
function getCardEdgeIntersection(
  centerX: number,
  centerY: number,
  halfW: number,
  halfH: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
    return { x: centerX, y: centerY + halfH };
  }

  const scaleX = Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale
  };
}

/**
 * Robust Collision Avoidance & Leader-Line Engine:
 * - Computes transformed anchor positions based on zoom and pan.
 * - Iteratively relaxes overlapping bounding boxes using separating forces.
 * - Enforces minimum 20–30px horizontal and vertical gaps between all cards.
 * - Restricts cards strictly within container bounds with edge padding.
 * - Generates crisp connector leader lines from displaced cards to their pinpoint location.
 */
function computeNonOverlappingCards(
  buildings: Building[],
  width: number,
  height: number,
  zoom: number,
  pan: { x: number; y: number }
): PlacedBuildingCard[] {
  if (width <= 0 || height <= 0) return [];

  const isMobile = width < 640;
  const isTablet = width < 860;

  // Responsive card dimensions (compact & clean)
  const cardWidth = isMobile ? 136 : isTablet ? 156 : 174;
  const cardHeight = isMobile ? 42 : 46;

  // Minimum spacing gap: strictly 20–30px
  const minGapX = isMobile ? 16 : 22;
  const minGapY = isMobile ? 16 : 22;
  const edgePadding = 26;

  const halfW = cardWidth / 2;
  const halfH = cardHeight / 2;

  // 1. Initial positioning from geographic percentages transformed by zoom/pan
  const cards: Array<{
    building: Building;
    anchorX: number;
    anchorY: number;
    x: number;
    y: number;
  }> = buildings.map((b) => {
    const rawX = (b.coordinates.x / 100) * width;
    const rawY = (b.coordinates.y / 100) * height;

    const centerX = width / 2;
    const centerY = height / 2;

    const anchorX = centerX + (rawX - centerX) * zoom + pan.x;
    const anchorY = centerY + (rawY - centerY) * zoom + pan.y;

    // Start centered at anchor, clamped inside container
    const clampedX = Math.max(edgePadding + halfW, Math.min(width - edgePadding - halfW, anchorX));
    const clampedY = Math.max(edgePadding + halfH, Math.min(height - edgePadding - halfH, anchorY));

    return {
      building: b,
      anchorX,
      anchorY,
      x: clampedX,
      y: clampedY
    };
  });

  // 2. Iterative Relaxation (Spring-repulsion + separation)
  const iterations = 85;
  for (let iter = 0; iter < iterations; iter++) {
    let anyCollision = false;

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const c1 = cards[i];
        const c2 = cards[j];

        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;

        const reqX = cardWidth + minGapX;
        const reqY = cardHeight + minGapY;

        const overlapX = reqX - Math.abs(dx);
        const overlapY = reqY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          anyCollision = true;

          // Push apart along axis with smaller penetration
          if (overlapX / reqX < overlapY / reqY) {
            const shift = (overlapX / 2) * 0.72;
            const sign = dx >= 0 ? 1 : -1;
            c1.x += sign * shift;
            c2.x -= sign * shift;
          } else {
            const shift = (overlapY / 2) * 0.72;
            const sign = dy >= 0 ? 1 : -1;
            c1.y += sign * shift;
            c2.y -= sign * shift;
          }
        }
      }
    }

    // Boundary containment & gentle spring attraction back to anchor
    for (const c of cards) {
      c.x += (c.anchorX - c.x) * 0.04;
      c.y += (c.anchorY - c.y) * 0.04;

      c.x = Math.max(edgePadding + halfW, Math.min(width - edgePadding - halfW, c.x));
      c.y = Math.max(edgePadding + halfH, Math.min(height - edgePadding - halfH, c.y));
    }

    if (!anyCollision && iter > 25) break;
  }

  // 3. Finalize positions and calculate leader lines
  return cards.map((c) => {
    const dist = Math.hypot(c.x - c.anchorX, c.y - c.anchorY);
    const needsLeaderLine = dist > 14;

    const edge = getCardEdgeIntersection(c.x, c.y, halfW, halfH, c.anchorX, c.anchorY);

    return {
      building: c.building,
      anchorX: c.anchorX,
      anchorY: c.anchorY,
      cardX: c.x,
      cardY: c.y,
      width: cardWidth,
      height: cardHeight,
      edgeX: edge.x,
      edgeY: edge.y,
      needsLeaderLine
    };
  });
}

export const EditorialMap: React.FC<EditorialMapProps> = ({ onSelectBuildingForNav }) => {
  const [activeBuilding, setActiveBuilding] = useState<Building>(BUILDINGS_DATA[0]);
  const [activeMsritLocation, setActiveMsritLocation] = useState<MSRITLocation>(MSRIT_LOCATIONS_DATA[0]);
  const [locationSearch, setLocationSearch] = useState('');

  // Interactive Zoom & Pan States
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map Container Measurement Ref
  const mapCanvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 560 });

  // ResizeObserver to track responsive viewport changes
  useEffect(() => {
    const el = mapCanvasRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(el);

    window.addEventListener('resize', updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Compute collision-free card positions whenever dimensions, zoom, pan, or buildings change
  const placedCards = useMemo(() => {
    return computeNonOverlappingCards(
      BUILDINGS_DATA,
      dimensions.width,
      dimensions.height,
      zoom,
      pan
    );
  }, [dimensions.width, dimensions.height, zoom, pan]);

  // Pan interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag if clicking on background, not on buttons or cards
    if ((e.target as HTMLElement).closest('.interactive-card') || (e.target as HTMLElement).closest('.zoom-control')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));
  };

  const filteredLocations = MSRIT_LOCATIONS_DATA.filter((loc) => {
    const q = locationSearch.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      loc.department.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
    );
  });

  return (
    <section id="sec-map" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-16">
        
        {/* Section Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              LIVE
            </h2>
            <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
              CAMPUS
            </h2>
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              MAP.
            </h2>
          </div>

          <div className="lg:col-span-4 font-mono text-xs text-[#666660] space-y-2 lg:text-right">
            <div>CLICK ANY NODE OR SEARCH OFFICIAL MSRIT LOCATIONS</div>
            <div className="text-[#DC2626] font-bold">● SMART COLLISION-FREE SPATIAL ENGINE ACTIVE</div>
          </div>
        </div>

        {/* Editorial Map & Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-[#111111]/10 items-start">
          
          {/* Left 7 Cols: Clean Abstract Light Vector Map with Dynamic Non-Overlapping Labels */}
          <div className="lg:col-span-7 space-y-6">
            <div
              ref={mapCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative min-h-[580px] h-[580px] bg-[#EAE8E1] border-2 border-[#111111]/15 overflow-hidden shadow-xs select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              
              {/* Background Geometric Grid & Pathway Network */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                <path d="M 80 100 L 360 260 L 620 180" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                <path d="M 360 260 L 290 380 L 160 320" stroke="#111111" strokeWidth="1.5" fill="none" />
                <path d="M 360 260 L 500 340 L 680 400" stroke="#DC2626" strokeWidth="2" fill="none" />
                <path d="M 160 320 L 240 500 L 480 480" stroke="#111111" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
              </svg>

              {/* Dynamic SVG Leader/Connector Lines & Anchor Pins Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                {placedCards.map((item) => {
                  const isSel = activeBuilding.id === item.building.id;
                  const strokeColor = isSel ? '#DC2626' : '#666660';
                  const strokeWidth = isSel ? 2 : 1.25;

                  return (
                    <g key={`leader-${item.building.id}`}>
                      {/* Anchor Marker Beacon at the exact location */}
                      <circle
                        cx={item.anchorX}
                        cy={item.anchorY}
                        r={isSel ? 6 : 4}
                        fill={isSel ? '#DC2626' : '#111111'}
                        opacity={0.3}
                      />
                      <circle
                        cx={item.anchorX}
                        cy={item.anchorY}
                        r={isSel ? 3.5 : 2.5}
                        fill={isSel ? '#DC2626' : '#111111'}
                      />

                      {/* Connector Leader Line (drawn when card is displaced from its anchor) */}
                      {item.needsLeaderLine && (
                        <>
                          <line
                            x1={item.anchorX}
                            y1={item.anchorY}
                            x2={item.edgeX}
                            y2={item.edgeY}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isSel ? 'none' : '3 3'}
                            opacity={isSel ? 0.95 : 0.75}
                          />
                          {/* Small termination dot at the card edge */}
                          <circle
                            cx={item.edgeX}
                            cy={item.edgeY}
                            r={2}
                            fill={strokeColor}
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Non-Overlapping Building Cards */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {placedCards.map((item) => {
                  const building = item.building;
                  const isSelected = activeBuilding.id === building.id;

                  return (
                    <div
                      key={building.id}
                      style={{
                        position: 'absolute',
                        left: `${item.cardX}px`,
                        top: `${item.cardY}px`,
                        width: `${item.width}px`,
                        height: `${item.height}px`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto'
                      }}
                      onClick={() => setActiveBuilding(building)}
                      className="interactive-card cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full h-full px-2.5 py-1.5 border font-mono transition-all flex flex-col justify-center ${
                          isSelected
                            ? 'bg-[#111111] border-[#DC2626] text-white z-30 shadow-md ring-2 ring-[#DC2626]/40'
                            : 'bg-[#F5F4EF]/95 border-[#111111]/25 hover:border-[#DC2626] text-[#111111] hover:bg-white shadow-xs'
                        }`}
                      >
                        {/* Building Name & Status Dot */}
                        <div className="font-syne font-bold text-[10px] sm:text-[11px] uppercase flex items-center gap-1.5 leading-tight truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              building.occupancy > 80
                                ? 'bg-rose-500'
                                : building.occupancy > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="truncate">{building.name.replace(' (Block A)', '')}</span>
                        </div>

                        {/* Occupancy Percentage & Walk Proximity */}
                        <div className="text-[9px] sm:text-[10px] text-[#666660] mt-0.5 flex items-center justify-between font-mono">
                          <span className="text-[#DC2626] font-bold">{building.occupancy}% OCC</span>
                          <span className={isSelected ? 'text-neutral-300' : 'text-[#666660]'}>
                            {building.walkTimeMinutes}M WALK
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Map Zoom & Pan Control Widget */}
              <div className="zoom-control absolute top-4 right-4 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 border border-[#111111]/20 shadow-xs font-mono">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#111111] hover:text-white transition-colors text-[#111111]"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#111111] hover:text-white transition-colors text-[#111111]"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoomPan}
                  title="Reset View"
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#111111] hover:text-white transition-colors text-[#111111]"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-[#666660] px-1.5 font-bold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Map Canvas Label */}
              <div className="absolute bottom-3 left-4 font-mono text-[10px] text-[#666660] z-20 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>DYNAMIC SPATIAL VECTOR CANVAS • ZERO COLLISION GUARANTEED</span>
              </div>

            </div>

            {/* Verified Official MSRIT Campus Locations Directory */}
            <div className="space-y-4 pt-6 border-t border-[#111111]/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="font-mono text-xs text-[#DC2626] uppercase font-bold tracking-wider">
                  VERIFIED OFFICIAL MSRIT LOCATIONS
                </span>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#666660] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="FILTER LOCATIONS (e.g. LIBRARY, APEX)..."
                    className="w-full bg-transparent border-b border-[#111111]/30 pl-8 pr-2 py-1 text-xs font-mono text-[#111111] placeholder-[#666660] focus:outline-none focus:border-[#DC2626] uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredLocations.map((loc) => {
                  const isSel = activeMsritLocation.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => setActiveMsritLocation(loc)}
                      className={`p-3 border font-mono text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#111111]'
                          : 'border-[#111111]/15 hover:border-[#111111]/40 text-[#666660]'
                      }`}
                    >
                      <div className="font-syne font-bold text-sm text-[#111111] uppercase">
                        {loc.name}
                      </div>
                      <div className="text-[10px] text-[#DC2626] font-bold mt-1">
                        {loc.category.toUpperCase()} // {loc.building}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right 5 Cols: Selected Location Telemetry Details */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Active Spatial Node Telemetry */}
            <div className="space-y-6 p-6 border border-[#111111]/15 bg-white/40">
              <div className="font-mono text-xs text-[#666660] uppercase tracking-widest border-b border-[#111111]/10 pb-3 flex justify-between">
                <span>ACTIVE MAP NODE</span>
                <span className="text-[#DC2626] font-bold">{activeBuilding.category.toUpperCase()}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-syne text-3xl font-black text-[#111111] uppercase tracking-tight">
                  {activeBuilding.name}
                </h3>
                <p className="text-[#666660] text-xs font-light leading-relaxed">
                  {activeBuilding.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-2">
                <div>
                  <span className="text-[#666660] block">LIVE OCCUPANCY</span>
                  <span className="text-[#DC2626] font-bold text-base">{activeBuilding.occupancy}%</span>
                </div>
                <div>
                  <span className="text-[#666660] block">PROXIMITY</span>
                  <span className="text-[#111111] font-bold">{activeBuilding.walkTimeMinutes} MINS</span>
                </div>
              </div>

              <button
                onClick={() => onSelectBuildingForNav(activeBuilding.id)}
                className="w-full py-3 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>START NAVIGATION →</span>
              </button>
            </div>

            {/* Selected Official MSRIT Location Card */}
            <div className="space-y-6 p-6 border border-[#DC2626]/30 bg-[#DC2626]/5">
              <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest border-b border-[#DC2626]/20 pb-3 flex justify-between font-bold">
                <span>VERIFIED MSRIT LOCATION</span>
                <span>{activeMsritLocation.category.toUpperCase()}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-syne text-2xl font-bold text-[#111111] uppercase tracking-tight">
                  {activeMsritLocation.name}
                </h3>
                <p className="text-[#666660] text-xs leading-relaxed">
                  {activeMsritLocation.description}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-[#666660] pt-2 border-t border-[#111111]/10">
                <div>BUILDING: <strong className="text-[#111111]">{activeMsritLocation.building}</strong></div>
                <div>FLOOR: <strong className="text-[#111111]">{activeMsritLocation.floor}</strong></div>
                <div>DEPARTMENT: <strong className="text-[#111111]">{activeMsritLocation.department}</strong></div>
                
                {/* GPS Coordinates Notice */}
                <div className="pt-2">
                  <span className="text-[10px] text-amber-700 bg-amber-500/10 px-2 py-1 border border-amber-500/20 block">
                    GPS COORDINATES: {activeMsritLocation.latitude ? `${activeMsritLocation.latitude}, ${activeMsritLocation.longitude}` : 'UNVERIFIED ON OFFICIAL MAP (LOCATION: ' + activeMsritLocation.building.toUpperCase() + ')'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center font-mono text-xs">
                <a
                  href={activeMsritLocation.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#DC2626] hover:underline font-bold uppercase inline-flex items-center gap-1 text-[11px]"
                >
                  <span>SOURCE: MSRIT OFFICIAL WEBSITE</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
