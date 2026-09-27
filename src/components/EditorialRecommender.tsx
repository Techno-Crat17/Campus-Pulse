import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Wind,
  GraduationCap,
  Server,
  Sparkles,
  MapPin,
  Clock,
  Search,
  X,
  Info,
  ExternalLink
} from 'lucide-react';
import {
  LIBRARIES,
  type CampusLibrary,
  getLibraryOccupancyDetails,
  formatOccupancy,
  isLibraryOpen,
  DIGITAL_LIBRARY
} from '../data/libraryData';
import { useTimeContext } from '../context/TimeContext';

interface EditorialRecommenderProps {
  onSelectBuildingForMap: (id: string) => void;
}

type FilterCategory = 'ALL' | 'OPEN_NOW' | 'FIRST_YEAR' | 'CSE_ELECTRONICS' | 'LOWEST_OCCUPANCY';

export const EditorialRecommender: React.FC<EditorialRecommenderProps> = ({
  onSelectBuildingForMap
}) => {
  const { simulatedTime } = useTimeContext();

  // Periodic tick for dynamic evening occupancy updates (every 35 seconds, within 30-60s requirement)
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 35000);
    return () => clearInterval(timer);
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  // Selected library for full detail modal
  const [selectedLibraryModal, setSelectedLibraryModal] = useState<CampusLibrary | null>(null);

  // Computed library state with live dynamic occupancy
  const libraryListWithDetails = useMemo(() => {
    return LIBRARIES.map((lib) => {
      const details = getLibraryOccupancyDetails(lib, simulatedTime);
      const isOpen = details.isOpen;
      const occ = details.occupancy;
      const occupiedSeats = Math.round(((lib.capacity || 100) * occ) / 100);

      // Hourly dynamic curve values
      const trend = (lib.historicalTrend || []).map((point) => {
        // If it's evening period (18:00-20:59) and this is the 19:00 slot, use live evening dynamic occupancy
        if (point.hour === '19:00' && details.isEveningPeriod) {
          return { ...point, avgOccupancy: occ };
        }
        return point;
      });

      return {
        ...lib,
        details,
        calculatedOccupancy: occ,
        formattedOccupancy: details.displayOccupancy,
        isOpen,
        isEveningPeriod: details.isEveningPeriod,
        occupiedSeats,
        activeTrend: trend
      };
    });
  }, [simulatedTime, tick]);

  // Filtered & Sorted libraries
  const filteredLibraries = useMemo(() => {
    let result = libraryListWithDetails.filter((lib) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = lib.name.toLowerCase().includes(q);
        const matchesBuilding = lib.building.toLowerCase().includes(q);
        const matchesCode = lib.code ? lib.code.toLowerCase().includes(q) : false;
        const matchesRoom = lib.roomNumber ? lib.roomNumber.toLowerCase().includes(q) : false;
        const matchesFloor = lib.floor.toLowerCase().includes(q);
        const matchesDisciplines = lib.disciplines ? lib.disciplines.toLowerCase().includes(q) : false;
        const matchesGroups = lib.primaryGroups.some((g) => g.toLowerCase().includes(q));

        if (!matchesName && !matchesBuilding && !matchesCode && !matchesRoom && !matchesFloor && !matchesDisciplines && !matchesGroups) {
          return false;
        }
      }

      // Filter tabs
      if (activeFilter === 'OPEN_NOW') {
        return lib.isOpen;
      }
      if (activeFilter === 'FIRST_YEAR') {
        return lib.primaryGroups.some((g) => g.toLowerCase().includes('1st year'));
      }
      if (activeFilter === 'CSE_ELECTRONICS') {
        return lib.primaryGroups.some((g) => g.toLowerCase().includes('cse') || g.toLowerCase().includes('electronics'));
      }

      return true;
    });

    if (activeFilter === 'LOWEST_OCCUPANCY') {
      result = [...result].sort((a, b) => a.calculatedOccupancy - b.calculatedOccupancy);
    }

    return result;
  }, [libraryListWithDetails, searchQuery, activeFilter]);

  // Overall campus library status helper
  const allLibrariesOpen = isLibraryOpen(simulatedTime);

  return (
    <section id="sec-find" className="py-28 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#111111]/10 pb-8 gap-6">
          <div className="space-y-3">
            <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#DC2626]" />
              <span>SECTION 04 // CAMPUS LIBRARIES & STUDY SPACES</span>
            </div>
            <div>
              <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
                FIND
              </h2>
              <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
                YOUR
              </h2>
              <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
                SPACE.
              </h2>
            </div>
          </div>

          <div className="font-mono text-xs text-[#666660] lg:text-right space-y-1.5 max-w-md">
            <div className="flex items-center lg:justify-end gap-2 text-[#111111] font-semibold">
              <span className={`w-2 h-2 rounded-full ${allLibrariesOpen ? 'bg-emerald-500 animate-pulse' : 'bg-[#DC2626]'}`} />
              <span>{allLibrariesOpen ? 'ALL 3 LIBRARIES OPEN NOW' : 'LIBRARIES CURRENTLY CLOSED'}</span>
            </div>
            <p className="leading-relaxed">
              Operating Hours: <span className="text-[#111111] font-bold">09:00–21:00 Daily</span> (Monday through Sunday). Telemetry is dynamically generated and refreshed every 30–60 seconds.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#888880] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by library name, building, floor, room number, or discipline..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#111111]/15 text-[#111111] text-xs font-mono placeholder:text-[#888880] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#111111] p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-[11px]">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === 'ALL'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/15'
                }`}
              >
                ALL LIBRARIES ({libraryListWithDetails.length})
              </button>

              <button
                onClick={() => setActiveFilter('OPEN_NOW')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === 'OPEN_NOW'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/15'
                }`}
              >
                OPEN NOW
              </button>

              <button
                onClick={() => setActiveFilter('FIRST_YEAR')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === 'FIRST_YEAR'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#666660] hover:text-[#DC2626] border-[#111111]/15'
                }`}
              >
                1ST YEAR UG
              </button>

              <button
                onClick={() => setActiveFilter('CSE_ELECTRONICS')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === 'CSE_ELECTRONICS'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#666660] hover:text-[#DC2626] border-[#111111]/15'
                }`}
              >
                CSE & ELECTRONICS
              </button>

              <button
                onClick={() => setActiveFilter('LOWEST_OCCUPANCY')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === 'LOWEST_OCCUPANCY'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/15'
                }`}
              >
                LEAST CROWDED
              </button>
            </div>
          </div>
        </div>

        {/* Empty State when no results match */}
        {filteredLibraries.length === 0 && (
          <div className="bg-white border border-[#111111]/15 p-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F5F4EF] flex items-center justify-center text-[#DC2626]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-syne text-xl font-bold text-[#111111] uppercase tracking-tight">
              No Libraries Found
            </h3>
            <p className="font-mono text-xs text-[#666660] max-w-md mx-auto">
              No campus libraries matched &ldquo;{searchQuery}&rdquo;. Clear your search or reset filters to view all official libraries.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="px-4 py-2 bg-[#111111] text-white font-mono text-xs font-bold uppercase hover:bg-[#DC2626] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Grid of Library Cards (Responsive: 1 col mobile, 2 col tablet/laptop, 3 col desktop) */}
        {filteredLibraries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLibraries.map((space) => {
              const occ = space.calculatedOccupancy;
              const isCrowded = occ >= 80;
              const isModerate = occ > 50 && occ < 80;
              const isOpen = space.isOpen;
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`MSRIT ${space.building} Block, Bengaluru`)}`;

              return (
                <div
                  key={space.id}
                  className="bg-[#111111] text-[#F5F5F5] border border-white/10 hover:border-[#DC2626]/40 rounded-xl p-5 sm:p-6 shadow-md flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Top Row: Library ID Badge & Open/Closed Status Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {space.code && (
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-zinc-200 border border-white/15">
                            {space.code}
                          </span>
                        )}
                        {space.roomNumber && (
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#DC2626]/20 text-[#FCA5A5] border border-[#DC2626]/40">
                            Room {space.roomNumber}
                          </span>
                        )}
                        {space.exclusiveFor && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 border border-white/15 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#EF4444]" />
                            1ST YEAR UG
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border whitespace-nowrap ${
                          !isOpen
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isCrowded
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isModerate
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !isOpen
                              ? 'bg-rose-400'
                              : isCrowded
                              ? 'bg-rose-400'
                              : isModerate
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        {isOpen ? `● Open (${space.formattedOccupancy})` : '● Closed (0%)'}
                      </span>
                    </div>

                    {/* Library Title */}
                    <div>
                      <h3 className="text-2xl font-syne font-bold text-white tracking-tight uppercase group-hover:text-[#EF4444] transition-colors leading-tight">
                        {space.name}
                      </h3>
                      {/* Location */}
                      <div className="flex items-center text-xs text-zinc-400 mt-1 gap-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        <span>{space.building} Block • {space.floor}</span>
                      </div>
                    </div>

                    {/* Disciplines / Focus Panel */}
                    {space.disciplines && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#DC2626] mb-1 uppercase tracking-wide">
                          <GraduationCap className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                          <span>DISCIPLINES / FOCUS:</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {space.disciplines}
                        </p>
                      </div>
                    )}

                    {/* Stat Cards: Capacity & Digital Library / Workstations */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider block font-bold">
                          Capacity
                        </span>
                        <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                          {space.capacity} Seats
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider block font-bold">
                          Digital Lib
                        </span>
                        <span className="text-xs font-mono font-bold text-white mt-0.5 block truncate" title={space.digitalSystems}>
                          {space.digitalSystems || 'Workstations'}
                        </span>
                      </div>
                    </div>

                    {/* Library Status & Occupancy Bar */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase block">
                        Library Status
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono text-zinc-200">
                        <span className="font-semibold text-white">
                          {isOpen ? `Open • ${space.formattedOccupancy}` : 'Closed • 0%'}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {isOpen ? `${space.occupiedSeats} / ${space.capacity} seats` : 'Operating Hours: 09:00–21:00'}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            !isOpen
                              ? 'bg-rose-500/40'
                              : isCrowded
                              ? 'bg-[#DC2626]'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${isOpen ? occ : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Facility Chips */}
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                        <Server className="w-3 h-3 text-[#DC2626]" />
                        LMS / E-Learning
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Power Outlets
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                        <Wind className="w-3 h-3 text-sky-400" />
                        AC Hall
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#DC2626]" />
                        09:00–21:00 Daily
                      </span>
                    </div>

                    {/* Daily Occupancy Curve */}
                    {space.activeTrend && space.activeTrend.length > 0 && (
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px] uppercase font-mono text-zinc-400 mb-1.5">
                          <span className="font-bold">DAILY OCCUPANCY CURVE</span>
                          <span className="text-[#DC2626] font-bold">
                            {isOpen ? '09:00–21:00' : 'Closed'}
                          </span>
                        </div>
                        <div className="flex items-end justify-between h-9 gap-1.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                          {space.activeTrend.map((h, i) => {
                            const barHeight = Math.max(14, Math.min(100, h.avgOccupancy));
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                                <div
                                  className="w-full bg-white/20 hover:bg-[#DC2626] border-t-2 border-[#DC2626] rounded-xs transition-all duration-200 cursor-pointer"
                                  style={{ height: `${barHeight}%` }}
                                  title={`${h.hour}: ~${formatOccupancy(h.avgOccupancy)} avg occupancy`}
                                />
                                <span className="text-[9px] font-mono text-zinc-400 group-hover/bar:text-white">
                                  {h.hour}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions: VIEW ON MAP, DIRECTIONS, VIEW FULL DETAILS */}
                  <div className="mt-5 pt-3.5 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectBuildingForMap(space.building.toLowerCase())}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-mono font-bold uppercase transition-all duration-200 active:scale-[0.98] shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">VIEW ON MAP</span>
                      </button>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase transition-all duration-200 active:scale-[0.98]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">DIRECTIONS</span>
                      </a>
                    </div>

                    <button
                      onClick={() => setSelectedLibraryModal(space)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-white/15 hover:border-[#DC2626] bg-white/5 hover:bg-white/10 text-white hover:text-[#DC2626] text-xs font-mono font-bold uppercase transition-all duration-200 active:scale-[0.98]"
                    >
                      <Info className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                      <span>VIEW FULL DETAILS</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Digital Library & Official MSRIT Information Footnote Banner */}
        <div className="bg-white border border-[#111111]/15 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xs rounded-xl">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#DC2626]/20">
                OFFICIAL MSRIT REPOSITORY
              </span>
              <span className="font-mono text-xs text-[#666660]">
                Source: {DIGITAL_LIBRARY.sourceUrl}
              </span>
            </div>
            <h4 className="font-syne text-lg font-bold text-[#111111] uppercase tracking-tight">
              MSRIT Digital Library & E-Resource Consortiums
            </h4>
            <p className="font-sans text-xs text-[#666660] leading-relaxed">
              Official institutional access to online e-journals & digital literature from{' '}
              <span className="font-semibold text-[#111111]">Elsevier ScienceDirect, IEEE, Taylor & Francis, and SpringerLink</span>. Active member of national networks including{' '}
              <span className="font-semibold text-[#111111]">DELNET, CMTI, and VTU E-Library</span>.
            </p>
          </div>

          <a
            href="https://www.msrit.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase inline-flex items-center gap-2 transition-colors shadow-xs rounded-md"
          >
            <span>OFFICIAL MSRIT PORTAL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Library Detail Modal */}
      <AnimatePresence>
        {selectedLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-[#111111] text-white border border-white/20 rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLibraryModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#DC2626] uppercase tracking-widest">
                    LIBRARY SPECIFICATIONS // {selectedLibraryModal.building} BLOCK
                  </span>
                  {selectedLibraryModal.roomNumber && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#DC2626]/20 text-[#FCA5A5] border border-[#DC2626]/40">
                      Room {selectedLibraryModal.roomNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-syne font-bold text-white uppercase tracking-tight">
                  {selectedLibraryModal.name}
                </h3>
                <p className="font-mono text-xs text-zinc-400">
                  {selectedLibraryModal.floor}
                </p>
              </div>

              {/* Status and Occupancy Banner */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                    Current Operational Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isLibraryOpen(simulatedTime) ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span className="font-syne font-bold text-base text-white">
                      {isLibraryOpen(simulatedTime) ? 'LIBRARY OPEN' : 'LIBRARY CLOSED'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                    Estimated Live Occupancy
                  </span>
                  <span className="font-syne font-black text-xl text-[#EF4444]">
                    {getLibraryOccupancyDetails(selectedLibraryModal, simulatedTime).displayOccupancy}
                  </span>
                </div>
              </div>

              {/* Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Operating Hours</span>
                  <span className="text-white font-bold block mt-0.5">09:00–21:00 Daily (Mon–Sun)</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Primary User Groups</span>
                  <span className="text-zinc-200 font-bold block mt-0.5">{selectedLibraryModal.primaryGroups.join(' • ')}</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Seating Capacity</span>
                  <span className="text-white font-bold block mt-0.5">{selectedLibraryModal.capacity} Seats</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Digital Workstations</span>
                  <span className="text-white font-bold block mt-0.5">{selectedLibraryModal.digitalSystems || 'Workstations available'}</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Carpet Area</span>
                  <span className="text-white font-bold block mt-0.5">{selectedLibraryModal.carpetArea || 'Standard block area'}</span>
                </div>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
                  <span className="text-zinc-400 block text-[10px] uppercase">Noise Level</span>
                  <span className="text-white font-bold block mt-0.5">{selectedLibraryModal.noiseLevel || 'Silent Study'}</span>
                </div>
              </div>

              {/* Full Description & Facilities */}
              <div className="space-y-3">
                <div>
                  <span className="font-mono text-[11px] text-[#DC2626] font-bold uppercase tracking-wider block mb-1">
                    ABOUT THIS FACILITY
                  </span>
                  <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                    {selectedLibraryModal.description}
                  </p>
                </div>

                {selectedLibraryModal.facilities && (
                  <div>
                    <span className="font-mono text-[11px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                      FACILITIES & HOLDINGS
                    </span>
                    <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                      {selectedLibraryModal.facilities}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 font-mono text-xs">
                <button
                  onClick={() => setSelectedLibraryModal(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white uppercase font-bold rounded-md transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    const bldg = selectedLibraryModal.building.toLowerCase();
                    setSelectedLibraryModal(null);
                    onSelectBuildingForMap(bldg);
                  }}
                  className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white uppercase font-bold rounded-md inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>VIEW ON MAP</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
