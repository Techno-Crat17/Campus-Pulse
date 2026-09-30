import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Wind,
  GraduationCap,
  Server,
  Sparkles,
  MapPin,
  Search,
  X,
  Info,
  ExternalLink,
  Layers,
  Disc
} from 'lucide-react';
import {
  LIBRARIES,
  type CampusLibrary,
  getLibraryOccupancyDetails,
  formatOccupancy,
  isLibraryOpen
} from '../data/libraryData';
import { useTimeContext } from '../context/TimeContext';

interface EditorialRecommenderProps {
  onSelectBuildingForMap: (id: string) => void;
}

type FilterCategory = 'ALL' | 'OPEN_NOW' | 'FIRST_YEAR' | 'CSE_ELECTRONICS' | 'PG_MANAGEMENT' | 'LOWEST_OCCUPANCY';

export const EditorialRecommender: React.FC<EditorialRecommenderProps> = ({
  onSelectBuildingForMap
}) => {
  const { simulatedTime } = useTimeContext();

  // Periodic tick for dynamic evening occupancy updates (every 35 seconds)
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
        const matchesFloor = lib.floor.toLowerCase().includes(q);
        const matchesDisciplines = lib.disciplines ? lib.disciplines.toLowerCase().includes(q) : false;
        const matchesGroups = lib.primaryGroups.some((g) => g.toLowerCase().includes(q));

        if (!matchesName && !matchesBuilding && !matchesCode && !matchesFloor && !matchesDisciplines && !matchesGroups) {
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
        return lib.primaryGroups.some((g) => g.toLowerCase().includes('computer') || g.toLowerCase().includes('electronics') || g.toLowerCase().includes('cse'));
      }
      if (activeFilter === 'PG_MANAGEMENT') {
        return lib.primaryGroups.some((g) => g.toLowerCase().includes('mca') || g.toLowerCase().includes('mba') || g.toLowerCase().includes('architecture'));
      }

      return true;
    });

    if (activeFilter === 'LOWEST_OCCUPANCY') {
      result = [...result].sort((a, b) => a.calculatedOccupancy - b.calculatedOccupancy);
    }

    return result;
  }, [libraryListWithDetails, searchQuery, activeFilter]);

  return (
    <section id="sec-find" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#111111]/10 pb-8 gap-6">
          <div className="space-y-3">
            <div>
              <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] font-extrabold uppercase tracking-tighter leading-none">
                FIND
              </h2>
              <h2 className="text-4xl sm:text-6xl font-syne text-[#DC2626] font-extrabold uppercase tracking-tighter leading-none">
                YOUR
              </h2>
              <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] font-extrabold uppercase tracking-tighter leading-none">
                SPACE.
              </h2>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#888880] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY LIBRARY NAME, BUILDING, FLOOR, DISCIPLINE, OR CAPACITY..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#111111]/20 text-[#111111] text-base sm:text-xs font-mono placeholder:text-[#888880] focus:outline-none focus:border-[#DC2626] shadow-2xs font-bold"
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar font-mono text-[11px]">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'ALL'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/20'
                }`}
              >
                ALL LIBRARIES ({libraryListWithDetails.length})
              </button>

              <button
                onClick={() => setActiveFilter('OPEN_NOW')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'OPEN_NOW'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/20'
                }`}
              >
                OPEN NOW
              </button>

              <button
                onClick={() => setActiveFilter('FIRST_YEAR')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'FIRST_YEAR'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#666660] hover:text-[#DC2626] border-[#111111]/20'
                }`}
              >
                1ST YEAR UG
              </button>

              <button
                onClick={() => setActiveFilter('CSE_ELECTRONICS')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'CSE_ELECTRONICS'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#666660] hover:text-[#DC2626] border-[#111111]/20'
                }`}
              >
                CSE & ELECTRONICS
              </button>

              <button
                onClick={() => setActiveFilter('PG_MANAGEMENT')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'PG_MANAGEMENT'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/20'
                }`}
              >
                MCA • MBA • ARCH
              </button>

              <button
                onClick={() => setActiveFilter('LOWEST_OCCUPANCY')}
                className={`px-3.5 py-2 uppercase font-bold tracking-wider transition-all whitespace-nowrap border shadow-2xs ${
                  activeFilter === 'LOWEST_OCCUPANCY'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666660] hover:text-[#111111] border-[#111111]/20'
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
            <div className="w-12 h-12 mx-auto bg-[#F5F4EF] border border-[#111111]/15 flex items-center justify-center text-[#DC2626]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-syne text-xl font-bold text-[#111111] uppercase tracking-tight">
              No Libraries Found
            </h3>
            <p className="font-mono text-xs text-[#666660] max-w-md mx-auto">
              No campus libraries matched &ldquo;{searchQuery}&rdquo;. Clear your search or reset filters to view all 6 official libraries.
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

        {/* Grid of Library Cards (Responsive: 1 col mobile, 2 col tablet, 3 col desktop) */}
        {filteredLibraries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLibraries.map((space) => {
              const occ = space.calculatedOccupancy;
              const isCrowded = occ >= 80;
              const isModerate = occ > 50 && occ < 80;
              const isOpen = space.isOpen;
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`MSRIT ${space.building} Block, Bengaluru`)}`;

              return (
                <article
                  key={space.id}
                  className="bg-white text-[#111111] border border-[#111111]/15 hover:border-[#111111] p-6 sm:p-7 shadow-2xs hover:shadow-xs flex flex-col justify-between transition-all duration-200 group space-y-5"
                >
                  <div className="space-y-4">
                    {/* Top Row: Code Badge, Exclusive Tag & Open/Closed Status Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#111111]/10 pb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {space.code && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#111111] text-white uppercase tracking-wider">
                            {space.code}
                          </span>
                        )}
                        {space.exclusiveFor && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 uppercase flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#DC2626]" />
                            1ST YEAR UG
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#F5F4EF] text-[#666660] border border-[#111111]/15 uppercase">
                          {space.building} BLOCK
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 flex items-center gap-1.5 border uppercase whitespace-nowrap ${
                          !isOpen
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isCrowded
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isModerate
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !isOpen
                              ? 'bg-rose-600'
                              : isCrowded
                              ? 'bg-rose-600'
                              : isModerate
                              ? 'bg-amber-600 animate-pulse'
                              : 'bg-emerald-600 animate-pulse'
                          }`}
                        />
                        {isOpen ? `● Open (${space.formattedOccupancy})` : '● Closed (0%)'}
                      </span>
                    </div>

                    {/* Library Title & Floor */}
                    <div>
                      <h3 className="text-2xl font-syne font-extrabold text-[#111111] tracking-tight uppercase group-hover:text-[#DC2626] transition-colors leading-tight">
                        {space.name}
                      </h3>
                      {/* Location */}
                      <div className="flex items-center text-xs text-[#666660] mt-1.5 gap-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        <span>{space.floor}</span>
                      </div>
                    </div>

                    {/* Disciplines / Focus Panel */}
                    {space.disciplines && (
                      <div className="bg-[#F5F4EF] border border-[#111111]/10 p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#DC2626] uppercase tracking-wider">
                          <GraduationCap className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                          <span>DISCIPLINES & DEPARTMENTS:</span>
                        </div>
                        <p className="text-xs text-[#111111] leading-relaxed font-mono line-clamp-3">
                          {space.disciplines}
                        </p>
                      </div>
                    )}

                    {/* 3-Column Specifications Grid: Seating, Digital Lab, Carpet Area */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-white border border-[#111111]/15 p-2.5">
                        <span className="text-[10px] uppercase text-[#888880] tracking-wider block font-bold">
                          SEATING
                        </span>
                        <span className="text-xs font-bold text-[#111111] mt-0.5 block">
                          {space.capacity} SEATS
                        </span>
                      </div>

                      <div className="bg-white border border-[#111111]/15 p-2.5">
                        <span className="text-[10px] uppercase text-[#888880] tracking-wider block font-bold">
                          DIGITAL LAB
                        </span>
                        <span className="text-xs font-bold text-[#111111] mt-0.5 block truncate" title={space.digitalSystems}>
                          {space.digitalSystems || 'Workstations'}
                        </span>
                      </div>

                      <div className="bg-white border border-[#111111]/15 p-2.5">
                        <span className="text-[10px] uppercase text-[#888880] tracking-wider block font-bold">
                          CARPET AREA
                        </span>
                        <span className="text-xs font-bold text-[#111111] mt-0.5 block truncate" title={space.carpetArea}>
                          {space.carpetArea || 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Library Status & Occupancy Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">
                          ESTIMATED LIVE OCCUPANCY
                        </span>
                        <span className="font-bold text-[#DC2626]">
                          {isOpen ? space.formattedOccupancy : 'CLOSED (0%)'}
                        </span>
                      </div>
                      <div className="w-full bg-[#111111]/10 h-2.5 overflow-hidden border border-[#111111]/15">
                        <div
                          className={`h-full transition-all duration-700 ${
                            !isOpen
                              ? 'bg-gray-400'
                              : isCrowded
                              ? 'bg-[#DC2626]'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${isOpen ? occ : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#888880]">
                        <span>{isOpen ? `${space.occupiedSeats} / ${space.capacity} SEATS OCCUPIED` : 'OPERATING HOURS: 09:00–21:00'}</span>
                        <span>09:00–21:00 DAILY</span>
                      </div>
                    </div>

                    {/* Facility Chips */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold uppercase">
                      {space.servers && (
                        <span className="px-2 py-0.5 bg-[#F5F4EF] border border-[#111111]/15 text-[#111111] flex items-center gap-1">
                          <Server className="w-3 h-3 text-[#DC2626]" />
                          LMS & DSPACE
                        </span>
                      )}

                      {space.nonPrintMaterials && (
                        <span className="px-2 py-0.5 bg-[#F5F4EF] border border-[#111111]/15 text-[#111111] flex items-center gap-1">
                          <Disc className="w-3 h-3 text-[#DC2626]" />
                          CD/DVD MEDIA
                        </span>
                      )}

                      {space.sections && (
                        <span className="px-2 py-0.5 bg-[#F5F4EF] border border-[#111111]/15 text-[#111111] flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#DC2626]" />
                          TECHNICAL & PERIODICAL
                        </span>
                      )}

                      <span className="px-2 py-0.5 bg-[#F5F4EF] border border-[#111111]/15 text-[#111111] flex items-center gap-1">
                        <Wind className="w-3 h-3 text-[#DC2626]" />
                        AC READING
                      </span>

                      <span className="px-2 py-0.5 bg-[#F5F4EF] border border-[#111111]/15 text-[#111111] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        POWER PORTS
                      </span>
                    </div>

                    {/* Daily Occupancy Curve */}
                    {space.activeTrend && space.activeTrend.length > 0 && (
                      <div className="pt-2">
                        <div className="bg-[#F5F4EF] p-2.5 border border-[#111111]/10 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] uppercase font-mono text-[#666660] font-bold">
                            <span>HOURLY LOAD CURVE</span>
                            <span className="text-[#DC2626]">
                              {isOpen ? 'ACTIVE PROFILE' : 'CLOSED'}
                            </span>
                          </div>
                          <div className="flex items-end justify-between h-9 gap-1">
                            {space.activeTrend.map((h, i) => {
                              const barHeight = Math.max(14, Math.min(100, h.avgOccupancy));
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                                  <div
                                    className="w-full bg-[#111111]/20 hover:bg-[#DC2626] border-t-2 border-[#DC2626] transition-all duration-200 cursor-pointer"
                                    style={{ height: `${barHeight}%` }}
                                    title={`${h.hour}: ~${formatOccupancy(h.avgOccupancy)} avg occupancy`}
                                  />
                                  <span className="text-[9px] font-mono text-[#888880] group-hover/bar:text-[#111111]">
                                    {h.hour}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions: VIEW ON MAP, DIRECTIONS, VIEW FULL DETAILS */}
                  <div className="pt-4 border-t border-[#111111]/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectBuildingForMap(space.building.toLowerCase())}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-mono font-bold uppercase transition-all shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">VIEW ON MAP</span>
                      </button>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-[#111111] hover:text-white text-[#111111] border border-[#111111]/25 text-xs font-mono font-bold uppercase transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">DIRECTIONS</span>
                      </a>
                    </div>

                    <button
                      onClick={() => setSelectedLibraryModal(space)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-[#111111]/20 bg-[#F5F4EF] hover:bg-[#111111] text-[#111111] hover:text-white text-xs font-mono font-bold uppercase transition-all shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                      <span>VIEW FULL DETAILS</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}


      </div>

      {/* Library Detail Modal with Clean Editorial Design */}
      <AnimatePresence>
        {selectedLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="bg-white text-[#111111] border-2 border-[#111111] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto font-mono text-xs"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLibraryModal(null)}
                className="absolute top-5 right-5 w-8 h-8 border border-[#111111]/20 hover:border-[#DC2626] bg-[#F5F4EF] hover:bg-[#DC2626] text-[#111111] hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1.5 pr-8 border-b border-[#111111]/10 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#DC2626] uppercase tracking-widest">
                    LIBRARY SPECIFICATIONS // {selectedLibraryModal.building} BLOCK
                  </span>
                  {selectedLibraryModal.code && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#111111] text-white font-bold uppercase">
                      {selectedLibraryModal.code}
                    </span>
                  )}
                  {selectedLibraryModal.exclusiveFor && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 font-bold uppercase">
                      1ST YEAR UG
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-syne font-extrabold text-[#111111] uppercase tracking-tight">
                  {selectedLibraryModal.name}
                </h3>
                <div className="flex items-center text-xs text-[#666660] gap-1.5 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{selectedLibraryModal.floor}</span>
                </div>
              </div>

              {/* Status and Occupancy Banner */}
              <div className="bg-[#F5F4EF] border border-[#111111]/15 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#888880] uppercase block font-bold">
                    OPERATIONAL STATUS
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isLibraryOpen(simulatedTime) ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                    <span className="font-syne font-bold text-base text-[#111111] uppercase">
                      {isLibraryOpen(simulatedTime) ? 'LIBRARY OPEN' : 'LIBRARY CLOSED'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] text-[#888880] uppercase block font-bold">
                    ESTIMATED LIVE OCCUPANCY
                  </span>
                  <span className="font-syne font-extrabold text-2xl text-[#DC2626]">
                    {getLibraryOccupancyDetails(selectedLibraryModal, simulatedTime).displayOccupancy}
                  </span>
                </div>
              </div>

              {/* Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-[#111111]/15 p-3">
                  <span className="text-[#888880] block text-[10px] uppercase font-bold">OPERATING HOURS</span>
                  <span className="text-[#111111] font-bold block mt-0.5">09:00–21:00 Daily (Mon–Sun)</span>
                </div>

                <div className="bg-white border border-[#111111]/15 p-3">
                  <span className="text-[#888880] block text-[10px] uppercase font-bold">SEATING CAPACITY</span>
                  <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.capacity} Seats</span>
                </div>

                <div className="bg-white border border-[#111111]/15 p-3">
                  <span className="text-[#888880] block text-[10px] uppercase font-bold">CARPET AREA</span>
                  <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.carpetArea || 'Standard'}</span>
                </div>

                <div className="bg-white border border-[#111111]/15 p-3">
                  <span className="text-[#888880] block text-[10px] uppercase font-bold">DIGITAL LAB SYSTEMS</span>
                  <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.digitalSystems || 'Workstations available'}</span>
                </div>

                {selectedLibraryModal.servers && (
                  <div className="bg-white border border-[#111111]/15 p-3">
                    <span className="text-[#888880] block text-[10px] uppercase font-bold">SERVERS</span>
                    <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.servers}</span>
                  </div>
                )}

                {selectedLibraryModal.nonPrintMaterials && (
                  <div className="bg-white border border-[#111111]/15 p-3">
                    <span className="text-[#888880] block text-[10px] uppercase font-bold">NON-PRINT MATERIALS</span>
                    <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.nonPrintMaterials}</span>
                  </div>
                )}

                {selectedLibraryModal.sections && (
                  <div className="bg-white border border-[#111111]/15 p-3 sm:col-span-2">
                    <span className="text-[#888880] block text-[10px] uppercase font-bold">LIBRARY SECTIONS</span>
                    <span className="text-[#111111] font-bold block mt-0.5">{selectedLibraryModal.sections}</span>
                  </div>
                )}
              </div>

              {/* Disciplines & Facilities */}
              <div className="space-y-3 pt-2 border-t border-[#111111]/10">
                {selectedLibraryModal.disciplines && (
                  <div>
                    <span className="text-[10px] text-[#DC2626] font-bold uppercase tracking-wider block mb-1">
                      DISCIPLINES & COVERED DEPARTMENTS
                    </span>
                    <p className="text-xs text-[#111111] leading-relaxed bg-[#F5F4EF] p-3 border border-[#111111]/10">
                      {selectedLibraryModal.disciplines}
                    </p>
                  </div>
                )}

                {selectedLibraryModal.facilities && (
                  <div>
                    <span className="text-[10px] text-[#666660] font-bold uppercase tracking-wider block mb-1">
                      FACILITIES & HOLDINGS
                    </span>
                    <p className="text-xs text-[#111111] leading-relaxed bg-[#F5F4EF] p-3 border border-[#111111]/10">
                      {selectedLibraryModal.facilities}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#111111]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 font-mono text-xs">
                <button
                  onClick={() => setSelectedLibraryModal(null)}
                  className="px-4 py-2.5 border border-[#111111]/25 hover:bg-[#111111] hover:text-white uppercase font-bold transition-colors shadow-2xs"
                >
                  CLOSE
                </button>

                <button
                  onClick={() => {
                    const bldg = selectedLibraryModal.building.toLowerCase();
                    setSelectedLibraryModal(null);
                    onSelectBuildingForMap(bldg);
                  }}
                  className="px-4 py-2.5 bg-[#111111] hover:bg-[#DC2626] text-white uppercase font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
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

