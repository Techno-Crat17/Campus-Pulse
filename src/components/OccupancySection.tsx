import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BUILDINGS_DATA } from '../data/campusData';

interface OccupancySectionProps {
  onNavigateToMapWithBuilding?: (buildingId: string) => void;
}

export const OccupancySection: React.FC<OccupancySectionProps> = ({ onNavigateToMapWithBuilding }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredBuildings = BUILDINGS_DATA.filter((b) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'STUDY') return b.category === 'study';
    if (filterCategory === 'LABS') return b.category === 'lab';
    if (filterCategory === 'CAFETERIA') return b.category === 'cafeteria';
    if (filterCategory === 'SPORTS') return b.category === 'sports';
    return true;
  });

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Editorial Heading */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-widest px-3 py-1 border border-blue-500/20 bg-blue-950/20 mb-3">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>REAL-TIME OCCUPANCY MONITORING ENGINE</span>
          </div>
          <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
            HOW BUSY IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">YOUR CAMPUS?</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mt-2 font-light">
            Live telemetry sensor updates every 15 seconds across study halls, computer labs, food courts, and athletics centers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'STUDY', 'LABS', 'CAFETERIA', 'SPORTS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
                filterCategory === cat
                  ? 'bg-blue-600 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hourly Busyness Peak Visualizer Ticker */}
      <div className="glass-panel p-6 border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">HOURLY CAMPUS TRAFFIC FORECAST</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400">● QUIET HOURS (8 AM - 11 AM)</span>
            <span className="text-amber-400">● PEAK BUSY (1 PM - 4 PM)</span>
            <span className="text-indigo-400">● EVENING STABLE (5 PM - 9 PM)</span>
          </div>
        </div>

        {/* Mini Peak Chart Grid */}
        <div className="grid grid-cols-12 gap-1 h-16 items-end pt-2 border-b border-white/10 pb-2">
          {[25, 30, 45, 60, 85, 90, 80, 75, 65, 50, 35, 20].map((val, idx) => (
            <div key={idx} className="h-full flex flex-col justify-end items-center group relative">
              <div
                className={`w-full transition-all duration-500 rounded-t-sm ${
                  val > 75 ? 'bg-rose-500' : val > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ height: `${val}%` }}
              />
              <span className="text-[9px] font-mono text-slate-500 mt-1">
                {8 + idx}h
              </span>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black px-2 py-1 text-[9px] font-mono text-cyan-300 border border-cyan-400 z-20 whitespace-nowrap">
                {8 + idx}:00 — {val}% BUSY
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buildings Occupancy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredBuildings.map((building) => {
          const isHigh = building.occupancy >= 80;
          const isLow = building.occupancy <= 30;

          return (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 border-white/10 hover:border-cyan-400/50 transition-all group space-y-4 relative overflow-hidden"
            >
              {/* Top Row: Title & Percentage */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    {building.category.toUpperCase()} • {building.floor}
                  </div>
                  <h3 className="font-syne text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {building.name}
                  </h3>
                </div>

                <div className="text-right">
                  <div className={`font-syne text-4xl font-extrabold ${
                    isHigh ? 'text-rose-400' : isLow ? 'text-emerald-400' : 'text-cyan-300'
                  }`}>
                    {building.occupancy}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {building.status}
                  </div>
                </div>
              </div>

              {/* Progress Bar with glowing gradient */}
              <div className="w-full h-3 bg-slate-900 border border-white/10 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${building.occupancy}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full ${
                    isHigh
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : isLow
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                />
              </div>

              {/* Stats Footer Details */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
                <div>
                  NOISE: <span className="text-white font-bold">{building.noiseLevel}</span>
                </div>
                <div>
                  WALK: <span className="text-cyan-300 font-bold">{building.walkTimeMinutes} MIN</span>
                </div>
                <div className="text-right">
                  DIST: <span className="text-white font-bold">{building.distanceMeters} M</span>
                </div>
              </div>

              {/* View on Map CTA */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onNavigateToMapWithBuilding?.(building.id)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  <span>VIEW ON LIVE MAP</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          );
        })}
      </div>

    </section>
  );
};
