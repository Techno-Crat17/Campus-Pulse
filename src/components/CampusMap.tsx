import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { BUILDINGS_DATA } from '../data/campusData';
import type { Building } from '../data/campusData';

interface CampusMapProps {
  selectedBuildingId?: string;
  onSelectBuilding?: (building: Building) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  selectedBuildingId,
  onSelectBuilding
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(
    BUILDINGS_DATA.find((b) => b.id === selectedBuildingId) || BUILDINGS_DATA[0]
  );

  const filteredBuildings = BUILDINGS_DATA.filter((b) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'study') return b.category === 'study' || b.category === 'lab';
    if (filterCategory === 'faculty') return b.category === 'faculty';
    if (filterCategory === 'facility') return b.category === 'facility' || b.category === 'cafeteria' || b.category === 'sports';
    if (filterCategory === 'issues') return b.status === 'ISSUE REPORTED';
    return true;
  });

  const getStatusBadgeColor = (status: Building['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'BUSY':
        return 'bg-amber-500/20 border-amber-400 text-amber-300';
      case 'CROWDED':
        return 'bg-rose-500/20 border-rose-400 text-rose-400';
      case 'ISSUE REPORTED':
        return 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse';
    }
  };

  const handleMarkerClick = (building: Building) => {
    setActiveBuilding(building);
    onSelectBuilding?.(building);
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Title & Filter Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-widest px-3 py-1 border border-blue-500/20 bg-blue-950/20 mb-3">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>INTERACTIVE REAL-TIME STYLIZED CANVAS</span>
          </div>
          <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
            LIVE CAMPUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">MAP.</span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'ALL SPACES' },
            { id: 'study', label: 'STUDY & LABS' },
            { id: 'faculty', label: 'FACULTY BLOCKS' },
            { id: 'facility', label: 'FACILITIES & FOOD' },
            { id: 'issues', label: 'ISSUES REPORTED' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all border ${
                filterCategory === f.id
                  ? 'bg-blue-600 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,102,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Stylized Interactive Vector Map Container */}
        <div className="lg:col-span-8 glass-panel border-white/15 p-4 sm:p-6 relative overflow-hidden min-h-[550px] flex flex-col justify-between">
          
          {/* Map Status Bar */}
          <div className="flex items-center justify-between z-10 font-mono text-xs text-slate-400 border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-bold">MODE: STYLIZED RASTER NETWORK</span>
            </div>
            <div className="flex items-center gap-4">
              <span>USER LOC: <span className="text-cyan-400">MAIN BLOCK GATE</span></span>
            </div>
          </div>

          {/* SVG Map Canvas Layer */}
          <div className="relative w-full h-[460px] bg-[#030612] border border-white/10 overflow-hidden bg-grid-pattern group">
            
            {/* SVG Background Path Decorators & Walk Routes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Campus Walkway Grid Lines */}
              <path d="M 150 100 L 450 250 L 700 180" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
              <path d="M 450 250 L 380 350 L 220 300" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
              <path d="M 450 250 L 620 320 L 800 360" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />

              {/* Animated Route Line */}
              {activeBuilding && (
                <g filter="url(#glow)">
                  <path
                    d={`M 360 240 Q 300 200 ${((activeBuilding?.coordinates.x || 38) * 8)} ${((activeBuilding?.coordinates.y || 35) * 4.6)}`}
                    stroke="url(#routeGrad)"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    fill="none"
                    className="animate-pulse"
                  />
                </g>
              )}

              {/* User Location Marker */}
              <circle cx="360" cy="240" r="8" fill="#DC2626" opacity="0.4" className="animate-ping" />
              <circle cx="360" cy="240" r="4" fill="#EF4444" />
              <text x="375" y="245" fill="#EF4444" fontSize="10" fontFamily="monospace" fontWeight="bold">YOU ARE HERE (MAIN BLOCK)</text>
            </svg>

            {/* Building Markers */}
            {filteredBuildings.map((building) => {
              const isSelected = activeBuilding?.id === building.id;

              return (
                <motion.div
                  key={building.id}
                  style={{
                    left: `${building.coordinates.x}%`,
                    top: `${building.coordinates.y}%`
                  }}
                  whileHover={{ scale: 1.15 }}
                  onClick={() => handleMarkerClick(building)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/marker"
                >
                  <div className={`w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-cyan-500/30 scale-125 shadow-[0_0_20px_rgba(0,229,255,0.6)] border-cyan-300' : 'bg-blue-950/60 hover:border-cyan-400'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      building.status === 'AVAILABLE' ? 'bg-emerald-400' :
                      building.status === 'BUSY' ? 'bg-amber-400' :
                      building.status === 'CROWDED' ? 'bg-rose-500' : 'bg-purple-400 animate-pulse'
                    }`} />
                  </div>

                  <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap px-2.5 py-1 border text-[10px] font-mono tracking-wider transition-all pointer-events-none ${
                    isSelected
                      ? 'bg-[#080d1f] border-cyan-400 text-white z-30 shadow-xl'
                      : 'bg-[#050812]/90 border-white/10 text-slate-300 opacity-90 group-hover/marker:opacity-100 group-hover/marker:border-cyan-500/50'
                  }`}>
                    <div className="font-bold font-syne text-[11px] text-white flex items-center gap-1">
                      {building.name}
                    </div>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="text-cyan-400">{building.occupancy}% BUSY</span>
                      <span>•</span>
                      <span className="text-slate-400">{building.walkTimeMinutes}m WALK</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Map Legend Footer */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 bg-[#050811]/90 border border-white/10 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> AVAILABLE (&lt;50%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> BUSY (50-80%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> CROWDED (&gt;80%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> ISSUE REPORTED
                </span>
              </div>
              <div className="text-slate-500">CLICK ANY BUILDING PIN FOR DETAILS</div>
            </div>

          </div>

        </div>

        {/* Right 4 Cols: Contextual Building Details Drawer Panel */}
        <div className="lg:col-span-4 glass-panel border-white/15 p-6 space-y-6">
          {activeBuilding ? (
            <motion.div
              key={activeBuilding.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 border text-[10px] font-mono uppercase font-bold tracking-widest ${getStatusBadgeColor(activeBuilding.status)}`}>
                    {activeBuilding.status}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {activeBuilding.category.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="font-syne text-3xl font-extrabold text-white tracking-tight">
                  {activeBuilding.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeBuilding.floor}
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-300">LIVE OCCUPANCY</span>
                  <span className="text-cyan-400 font-bold text-base">{activeBuilding.occupancy}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-none overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeBuilding.occupancy > 80
                        ? 'bg-rose-500'
                        : activeBuilding.occupancy > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${activeBuilding.occupancy}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                  <div>WALK TIME: <span className="text-white font-bold">{activeBuilding.walkTimeMinutes} MIN</span></div>
                  <div>DISTANCE: <span className="text-white font-bold">{activeBuilding.distanceMeters} M</span></div>
                  <div>NOISE LEVEL: <span className="text-cyan-300 font-bold">{activeBuilding.noiseLevel}</span></div>
                  <div>STATUS: <span className="text-white font-bold">{activeBuilding.status}</span></div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {activeBuilding.description}
              </p>

              <div className="space-y-2">
                <div className="font-mono text-[11px] text-slate-400 uppercase tracking-widest">
                  AMENITIES & TECH INFRASTRUCTURE
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeBuilding.amenities.map((item, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              {activeBuilding.rooms && activeBuilding.rooms.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="font-mono text-[11px] text-slate-400 uppercase tracking-widest">
                    ROOM AVAILABILITY BREAKDOWN
                  </div>
                  <div className="space-y-2">
                    {activeBuilding.rooms.map((room, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{room.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            CAPACITY: {room.capacity} SEATS
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className={room.status === 'FULL' || room.status === 'CROWDED' ? 'text-rose-400' : 'text-emerald-400'}>
                            {room.occupancy} / {room.capacity} ({room.status})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



            </motion.div>
          ) : (
            <div className="text-center py-20 text-slate-500 font-mono text-xs">
              SELECT A BUILDING ON THE MAP TO VIEW REAL-TIME METRICS & ROOM BREAKDOWN
            </div>
          )}
        </div>

      </div>

    </section>
  );
};
