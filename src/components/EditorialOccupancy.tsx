import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LIBRARIES, getLibraryOccupancyDetails, formatOccupancy } from '../data/libraryData';
import type { CampusLibrary } from '../data/libraryData';
import { useTimeContext } from '../context/TimeContext';
import { Clock, Users, BookOpen } from 'lucide-react';

export const EditorialOccupancy: React.FC = () => {
  const { simulatedTime } = useTimeContext();
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number>(0);

  // Recalculate dynamic estimated occupancy automatically every 30 seconds
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setSecondsSinceUpdate(0);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update second counter every 1s for "Updated X sec ago" indicator
  useEffect(() => {
    const secInterval = setInterval(() => {
      setSecondsSinceUpdate((s) => s + 1);
    }, 1000);

    return () => clearInterval(secInterval);
  }, []);

  // Calculate dynamic estimated occupancy using central model and details
  const libraryOccupancies = useMemo(() => {
    return LIBRARIES.map((lib: CampusLibrary) => {
      const details = getLibraryOccupancyDetails(lib, simulatedTime);
      return {
        ...lib,
        details
      };
    });
  }, [simulatedTime, tick]);

  const getOccupancyColor = (pctEquivalent: number, isOpen: boolean) => {
    if (!isOpen) return 'text-[#888880]';
    if (pctEquivalent >= 75) return 'text-rose-600';
    if (pctEquivalent <= 35) return 'text-emerald-600';
    return 'text-[#111111]';
  };

  const getOccupancyBarColor = (pctEquivalent: number, isOpen: boolean) => {
    if (!isOpen) return 'bg-[#888880]';
    if (pctEquivalent >= 75) return 'bg-rose-600';
    if (pctEquivalent <= 35) return 'bg-emerald-600';
    return 'bg-[#111111]';
  };

  return (
    <section id="sec-see" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-24">
        
        {/* Section Label */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#111111]/10 pb-8">
          <div>
            <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#DC2626]" />
              <span>SECTION 03 // ESTIMATED LIVE OCCUPANCY STREAM</span>
            </div>
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              SEE
            </h2>
            <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
              LIBRARY
            </h2>
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              TELEMETRY.
            </h2>
          </div>
          
          <div className="font-mono text-xs text-[#666660] md:text-right mt-4 md:mt-0 space-y-1">
            <div className="flex items-center md:justify-end gap-2 text-[#DC2626] font-bold">
              <Clock className="w-3.5 h-3.5 text-[#DC2626] animate-pulse" />
              <span>UPDATED {secondsSinceUpdate} SEC AGO (30s CYCLE)</span>
            </div>
            <div className="text-[11px] text-[#111111]">
              MODEL: DYNAMIC TIME & SCHEDULE-BASED ESTIMATION
            </div>
            <div className="text-[10px] text-[#888880]">
              LABEL: ESTIMATED LIVE OCCUPANCY (NOT DIRECT SENSOR DATA)
            </div>
          </div>
        </div>

        {/* Asymmetric Giant Numbers Flow for the Six Official Campus Libraries */}
        <div className="space-y-24 sm:space-y-28">
          {libraryOccupancies.map((lib, idx) => {
            const isRight = idx % 2 === 1;

            return (
              <motion.div
                key={lib.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7 }}
                className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'} space-y-3`}
              >
                {/* Mode Label */}
                <div className="font-mono text-xs uppercase tracking-widest font-bold text-[#666660] flex items-center gap-2">
                  <span>{lib.details.modeLabel}</span>
                  <span>•</span>
                  <span className="text-[#DC2626]">{lib.details.statusLabel}</span>
                </div>

                {/* Giant Percentage Number */}
                <div className={`font-syne text-giant font-black tracking-tighter leading-none transition-colors duration-500 ${getOccupancyColor(lib.details.percentageEquivalent, lib.details.isOpen)}`}>
                  {formatOccupancy(lib.details.occupancy)}
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full max-w-xl h-2 bg-[#111111]/10 overflow-hidden border border-[#111111]/15">
                  <motion.div
                    className={`h-full transition-all duration-700 ease-out ${getOccupancyBarColor(lib.details.percentageEquivalent, lib.details.isOpen)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${lib.details.percentageEquivalent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Library Name */}
                <div className="text-3xl sm:text-7xl font-syne font-bold text-[#111111] uppercase tracking-tight pt-1">
                  {lib.name}
                </div>

                {/* Primary Student Groups Pill Row */}
                <div className={`flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] ${isRight ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[#111111] font-bold uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#DC2626]" />
                    <span>PRIMARY USERS:</span>
                  </span>
                  {lib.primaryGroups.map((group) => (
                    <span
                      key={group}
                      className="px-2 py-0.5 bg-white border border-[#111111]/20 text-[#111111] font-bold uppercase shadow-xs"
                    >
                      {group}
                    </span>
                  ))}
                </div>

                {/* Metadata Line */}
                <div className="font-mono text-xs text-[#666660] tracking-wider flex items-center gap-4 pt-1">
                  <span>{lib.floor}</span>
                  <span>•</span>
                  <span>{lib.noiseLevel.toUpperCase()} SOUNDSCAPE</span>
                  <span>•</span>
                  <span>{lib.walkTimeMinutes} MIN CAMPUS WALK</span>
                </div>

                <p className="font-mono text-xs text-[#888880] max-w-2xl pt-1">
                  {lib.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
