import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, MapPin, CheckCircle2, Cpu } from 'lucide-react';
import { BUILDINGS_DATA } from '../data/campusData';
import type { Building } from '../data/campusData';

interface StudyRecommendationSectionProps {
  onNavigateToMapWithBuilding?: (buildingId: string) => void;
}

export const StudyRecommendationSection: React.FC<StudyRecommendationSectionProps> = ({
  onNavigateToMapWithBuilding
}) => {
  const [purpose, setPurpose] = useState<'study' | 'coding' | 'group' | 'solo'>('coding');
  const [noisePref, setNoisePref] = useState<'Quiet' | 'Moderate' | 'Any'>('Quiet');
  const [distancePref, setDistancePref] = useState<'nearby' | 'anywhere'>('nearby');
  const [needSockets, setNeedSockets] = useState<boolean>(true);
  const [needAC, setNeedAC] = useState<boolean>(true);

  const calculateRecommendation = () => {
    let bestMatch: Building = BUILDINGS_DATA[0];
    let matchScore = 98;
    let reasons: string[] = [];

    if (purpose === 'coding') {
      bestMatch = BUILDINGS_DATA.find((b) => b.id === 'ise-lab-2') || BUILDINGS_DATA[0];
      matchScore = 98;
      reasons = [
        'ISE Lab 2 is only 20% occupied with 32 open workstation desks.',
        'Equipped with dual monitors, high-speed fiber Wi-Fi, and climate control.',
        'Quiet acoustic soundscape optimal for deep coding focus.',
        '3-minute walk from Main Academic Block (220 meters).'
      ];
    } else if (purpose === 'study' && noisePref === 'Quiet') {
      bestMatch = BUILDINGS_DATA.find((b) => b.id === 'computer-lab-3') || BUILDINGS_DATA[0];
      matchScore = 95;
      reasons = [
        'Computer Lab 3 currently at 42% capacity with quiet GPU workstation bays.',
        'Silent reading ambience with active air conditioning.',
        '4-minute walk from Main Gate.'
      ];
    } else if (purpose === 'group') {
      bestMatch = BUILDINGS_DATA.find((b) => b.id === 'cafeteria') || BUILDINGS_DATA[0];
      matchScore = 91;
      reasons = [
        'Central Food Court Outdoor Garden Terrace allows open dialogue.',
        '68% occupied with ample large table seating.',
        'Adjacent to coffee and snacks.'
      ];
    } else {
      bestMatch = BUILDINGS_DATA.find((b) => b.id === 'ise-lab-2') || BUILDINGS_DATA[0];
      matchScore = 96;
      reasons = [
        'ISE Lab 2 offers optimal balance of low crowd density (20%) and tech infrastructure.',
        'Immediate availability with zero waiting queues.'
      ];
    }

    return { bestMatch, matchScore, reasons };
  };

  const { bestMatch, matchScore, reasons } = calculateRecommendation();

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-400 uppercase tracking-widest px-3 py-1 border border-cyan-500/20 bg-blue-950/20">
          <Compass className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
          <span>REAL-TIME MATCHING ALGORITHM</span>
        </div>
        <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
          AI STUDY-SPOT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-400">RECOMMENDER.</span>
        </h2>
        <p className="text-slate-400 text-sm max-w-xl font-light">
          Specify your session goals, noise preference, and required hardware. Campus Pulse matches you with the ideal space instantly.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 6 Cols */}
        <div className="lg:col-span-6 glass-panel border-white/10 p-6 space-y-6">
          <h3 className="font-syne text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            CONFIGURE YOUR STUDY SESSION
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              1. PRIMARY PURPOSE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'coding', label: 'SOFTWARE & CODING' },
                { id: 'study', label: 'SOLO INTENSIVE STUDY' },
                { id: 'group', label: 'GROUP DISCUSSION' },
                { id: 'solo', label: 'CASUAL READING' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPurpose(p.id as any)}
                  className={`p-3 text-left font-mono text-xs border transition-all ${
                    purpose === p.id
                      ? 'bg-blue-600/30 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              2. NOISE PREFERENCE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Quiet', label: 'SILENT / QUIET' },
                { id: 'Moderate', label: 'MODERATE SOUND' },
                { id: 'Any', label: "DOESN'T MATTER" }
              ].map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNoisePref(n.id as any)}
                  className={`p-3 text-center font-mono text-xs border transition-all ${
                    noisePref === n.id
                      ? 'bg-cyan-500/30 border-cyan-300 text-cyan-200 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              3. MAXIMUM WALK DISTANCE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'nearby', label: 'NEARBY (&lt; 3 MIN WALK)' },
                { id: 'anywhere', label: 'ANYWHERE ON CAMPUS' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDistancePref(d.id as any)}
                  className={`p-3 text-center font-mono text-xs border transition-all ${
                    distancePref === d.id
                      ? 'bg-blue-600/30 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              4. REQUIRED AMENITIES
            </label>
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={needSockets}
                  onChange={(e) => setNeedSockets(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
                POWER SOCKETS
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={needAC}
                  onChange={(e) => setNeedAC(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
                AIR CONDITIONING
              </label>
            </div>
          </div>

        </div>

        {/* Right 6 Cols */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div
            key={bestMatch.id + purpose}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-panel border-cyan-400/40 p-8 space-y-6 relative overflow-hidden shadow-[0_0_35px_rgba(0,102,255,0.15)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>TOP MATCH RECOMMENDATION</span>
              </div>
              <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold">
                {matchScore}% MATCH SCORE
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">
                RECOMMENDED SPACE
              </div>
              <h3 className="font-syne text-4xl sm:text-5xl font-black text-white tracking-tight">
                {bestMatch.name}
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                <span className="text-emerald-400 font-bold">{bestMatch.occupancy}% OCCUPIED</span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">{bestMatch.noiseLevel} SOUNDSCAPE</span>
                <span>•</span>
                <span className="text-white font-bold">{bestMatch.walkTimeMinutes} MIN WALK</span>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-white/10 space-y-3">
              <div className="font-mono text-xs text-cyan-400 uppercase font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                WHY CAMPUS PULSE RECOMMENDS THIS SPACE:
              </div>
              <ul className="space-y-2">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => onNavigateToMapWithBuilding?.(bestMatch.id)}
                className="w-full py-3.5 bg-transparent border border-cyan-400 text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>VIEW ON MAP</span>
              </button>
            </div>

          </motion.div>
        </div>

      </div>

    </section>
  );
};
