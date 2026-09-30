import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Calendar, Clock, Map, Filter, Building2, ChevronDown } from 'lucide-react';
import {
  loadFacultyData,
  getDepartments,
  groupFacultyByDepartment,
  searchFaculty
} from '../data/facultyData';
import type { MSRITFacultyRecord } from '../data/facultyData';
import { getFacultyDynamicStatus, getCurrentCampusTime } from '../data/statusEngine';
import { useTimeContext } from '../context/TimeContext';

interface EditorialFacultyProps {
  onSelectFacultyForMap?: (nodeId: string) => void;
}

export const EditorialFaculty: React.FC<EditorialFacultyProps> = ({ onSelectFacultyForMap }) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Pagination State: Show only 10 cards initially, reveal next 10 on "Load More"
  // Infinite scroll is strictly disabled.
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Accordion expansion state: track individually expanded faculty IDs
  // Compact by default; scrolling NEVER expands cards.
  const [expandedFacultyIds, setExpandedFacultyIds] = useState<Set<string>>(new Set());

  const { simulatedTime } = useTimeContext();

  // Periodic 30-second interval to refresh dynamic faculty statuses locally without excessive API calls
  const [clockTick, setClockTick] = useState<Date>(() => getCurrentCampusTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(getCurrentCampusTime());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Single authoritative faculty dataset loaded dynamically from faculty_msrit_dynamic.json
  const facultyData = loadFacultyData();

  // Dynamically extract unique departments from JSON data
  const availableDepartments = useMemo(() => getDepartments(facultyData), [facultyData]);

  // Dynamic count map per department
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    facultyData.forEach((f) => {
      const d = f.department?.trim() || 'OTHER';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [facultyData]);

  // Reset pagination to first 10 when search query, department, or status filter changes
  useEffect(() => {
    setVisibleCount(10);
  }, [search, selectedDept, selectedStatus]);

  // Filter faculty by department, search query, and status across complete dataset
  const filteredFaculty = useMemo(() => {
    let list = searchFaculty(search, selectedDept, facultyData);
    if (selectedStatus !== 'ALL') {
      list = list.filter((f) => {
        const st = getFacultyDynamicStatus(f, simulatedTime || clockTick).status;
        return st === selectedStatus;
      });
    }
    return list;
  }, [search, selectedDept, selectedStatus, facultyData, simulatedTime, clockTick]);

  // Dynamic status counts calculated from current faculty statuses
  const statusCounts = useMemo(() => {
    const baseList = searchFaculty(search, selectedDept, facultyData);
    const counts = { AVAILABLE: 0, BUSY: 0, OFF_CAMPUS: 0 };
    baseList.forEach((f) => {
      const st = getFacultyDynamicStatus(f, simulatedTime || clockTick).status;
      if (st in counts) {
        counts[st as keyof typeof counts]++;
      }
    });
    return counts;
  }, [search, selectedDept, facultyData, simulatedTime, clockTick]);

  // Paginated visible slice of matching faculty (10 per page)
  const visibleFaculty = useMemo(() => {
    return filteredFaculty.slice(0, visibleCount);
  }, [filteredFaculty, visibleCount]);

  // Group visible paginated faculty by department for "ALL" departments view
  const groupedVisibleFaculty = useMemo(() => {
    return groupFacultyByDepartment(visibleFaculty);
  }, [visibleFaculty]);

  // Accordion Toggle: only toggles the clicked faculty card
  const toggleFacultyExpanded = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedFacultyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'AVAILABLE') {
      return 'border-emerald-600 bg-emerald-500/10 text-emerald-700 font-bold';
    }
    if (s === 'BUSY') {
      return 'border-red-600 bg-red-500/10 text-red-700 font-bold';
    }
    if (s === 'OFF_CAMPUS' || s === 'OFF CAMPUS') {
      return 'border-gray-500 bg-gray-500/10 text-gray-700 font-bold';
    }
    return 'border-gray-400 bg-gray-500/10 text-gray-600 font-bold';
  };

  const formatStatusText = (status: string) => {
    return status === 'OFF_CAMPUS' ? 'OFF CAMPUS' : status;
  };

  const renderFacultyCard = (fac: MSRITFacultyRecord, idx: number) => {
    const dynamicState = getFacultyDynamicStatus(fac, simulatedTime || clockTick);
    const isExpanded = expandedFacultyIds.has(fac.id);

    return (
      <div
        key={fac.id}
        className={`border-b border-[#111111]/10 pb-6 pt-5 transition-all ${
          isExpanded ? 'bg-white/50 -mx-4 px-4 border-l-4 border-l-[#DC2626] shadow-xs' : 'hover:bg-white/20'
        }`}
      >
        {/* Compact Default Row: Basic Information + Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Index Number & Avatar & Profile Info */}
          <div
            onClick={() => toggleFacultyExpanded(fac.id)}
            className="flex items-center gap-3 sm:gap-6 cursor-pointer flex-1 min-w-0"
          >
            <div className="font-mono text-base sm:text-xl text-[#DC2626] font-bold shrink-0 w-6 sm:w-8">
              {String(idx + 1).padStart(2, '0')}
            </div>

            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-[#111111]/20 shrink-0 overflow-hidden bg-white shadow-xs">
              {fac.avatarUrl ? (
                <img
                  src={fac.avatarUrl}
                  alt={fac.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-sm sm:text-base font-bold bg-[#111111]/5 text-[#111111]">
                  {fac.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-2xl font-syne font-bold text-[#111111] uppercase tracking-tight hover:text-[#DC2626] transition-colors truncate">
                  {fac.name}
                </h3>
                <span className={`inline-block px-2 py-0.5 border text-[10px] font-mono uppercase ${getStatusBadgeStyle(dynamicState.status)}`}>
                  ● {formatStatusText(dynamicState.status)}
                </span>
              </div>
              
              <div className="font-mono text-xs text-[#DC2626] uppercase font-bold truncate">
                {fac.designation}
              </div>
              <div className="font-mono text-[11px] text-[#666660] uppercase tracking-wide truncate">
                {fac.department}
              </div>
            </div>
          </div>

          {/* Right Side Actions: SHOW ON MAP + Down-Arrow Chevron */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectFacultyForMap) {
                  onSelectFacultyForMap(fac.nodeId);
                } else {
                  const mapEl = document.getElementById('sec-map-explore');
                  if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-[11px] sm:text-xs font-bold uppercase inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-red-300" />
              <span>SHOW ON MAP</span>
            </button>

            {/* Clear Down-Arrow / Chevron Icon Button */}
            <button
              type="button"
              onClick={(e) => toggleFacultyExpanded(fac.id, e)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse details for ${fac.name}` : `Expand details for ${fac.name}`}
              className="w-8 h-8 sm:w-9 sm:h-9 border border-[#111111]/30 bg-white hover:bg-[#111111] hover:text-white text-[#111111] flex items-center justify-center transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            >
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ease-in-out ${
                  isExpanded ? 'rotate-180 text-[#DC2626] hover:text-white' : 'rotate-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Smooth Accordion Expansion: Shows Only When Arrow / Card is Clicked */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-[#111111]/10 lg:ml-20 space-y-5">
                
                {/* Detailed Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white border border-[#111111]/15 font-mono text-xs shadow-xs">
                  <div>
                    <span className="text-[#666660] text-[10px] uppercase block font-bold">CABIN LOCATION</span>
                    <strong className="text-[#111111] text-xs sm:text-sm font-bold mt-0.5 block">{fac.cabinLocation}</strong>
                  </div>
                  <div>
                    <span className="text-[#666660] text-[10px] uppercase block font-bold">CURRENT LIVE LOCATION</span>
                    <strong className="text-[#111111] text-xs sm:text-sm font-bold mt-0.5 block">{dynamicState.currentLocation}</strong>
                  </div>
                  <div>
                    <span className="text-[#666660] text-[10px] uppercase block font-bold">AVAILABILITY / STATUS</span>
                    <span className={`inline-block px-2.5 py-0.5 border text-xs uppercase mt-0.5 ${getStatusBadgeStyle(dynamicState.status)}`}>
                      ● {formatStatusText(dynamicState.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#666660] text-[10px] uppercase block font-bold">NEXT AVAILABLE TIME</span>
                    <strong className="text-[#DC2626] text-xs sm:text-sm font-bold mt-0.5 block">{dynamicState.nextAvailableTime}</strong>
                  </div>
                </div>

                {/* Email & Contact Row */}
                <div className="font-mono text-xs text-[#666660] flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111111]/5 border border-[#111111]/10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">OFFICIAL EMAIL:</span>
                    <a href={`mailto:${fac.email}`} className="text-[#DC2626] underline font-bold hover:text-[#111111]">
                      {fac.email}
                    </a>
                  </div>
                  <div className="text-[11px] text-[#666660]">
                    NODE: <span className="font-bold text-[#111111]">{fac.nodeId}</span> • SOURCE: <span className="font-bold text-[#111111]">MSRIT FACULTY DIRECTORY</span>
                  </div>
                </div>

                {/* Today's Schedule Breakdown */}
                {fac.todaySchedule && fac.todaySchedule.length > 0 && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-[#DC2626] uppercase font-bold tracking-wider text-[11px] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>TODAY&apos;S SCHEDULE ({fac.todaySchedule.length} SESSIONS):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {fac.todaySchedule.map((sch, sIdx) => (
                        <div key={sIdx} className="p-3 bg-white border border-[#111111]/15 space-y-1 shadow-xs">
                          <div className="text-[#DC2626] font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{sch.time}</span>
                          </div>
                          <div className="font-bold text-[#111111] text-xs">
                            {sch.event}
                          </div>
                          <div className="text-[#666660] text-[11px] flex items-center gap-1 pt-1">
                            <MapPin className="w-3 h-3 text-[#111111]" />
                            <span>{sch.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  return (
    <section id="sec-faculty" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Label */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold">
          <span>SECTION 05 // DYNAMIC FACULTY TELEMETRY</span>
        </div>

        {/* Section Heading & Search / Department / Status Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
          <div className="lg:col-span-6">
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              WHO
            </h2>
            <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
              CAN I MEET?
            </h2>
            <p className="font-mono text-xs text-[#666660] mt-3">
              Tap the down-arrow (⌄) on any faculty card to expand live location, cabin, and daily schedule details.
            </p>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-xs text-[#666660] uppercase tracking-widest block font-bold">
                SEARCH BY NAME, DESIGNATION OR CABIN:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#666660] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Dr. Yogish, Dr. Sumana, Room-102, ISE..."
                  className="w-full bg-white border border-[#111111]/30 pl-9 pr-4 py-2.5 text-base sm:text-xs font-mono text-[#111111] placeholder-[#666660] focus:outline-none focus:border-[#DC2626] uppercase shadow-sm"
                />
              </div>
            </div>

            {/* Department & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span className="text-[#666660] uppercase font-bold">DEPT:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-white border border-[#111111]/30 px-2.5 py-1.5 text-xs font-mono text-[#111111] uppercase focus:outline-none focus:border-[#DC2626] cursor-pointer"
                  >
                    <option value="ALL">ALL DEPARTMENTS ({availableDepartments.length})</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept} ({deptCounts[dept] || 0} FACULTY)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#666660] uppercase font-bold">STATUS:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white border border-[#111111]/30 px-2.5 py-1.5 text-xs font-mono text-[#111111] uppercase focus:outline-none focus:border-[#DC2626] cursor-pointer"
                  >
                    <option value="ALL">ALL STATUSES ({statusCounts.AVAILABLE + statusCounts.BUSY + statusCounts.OFF_CAMPUS})</option>
                    <option value="AVAILABLE">🟢 AVAILABLE ({statusCounts.AVAILABLE})</option>
                    <option value="BUSY">🔴 BUSY ({statusCounts.BUSY})</option>
                    <option value="OFF_CAMPUS">⚫ OFF CAMPUS ({statusCounts.OFF_CAMPUS})</option>
                  </select>
                </div>
              </div>

              <div className="text-[10px] text-[#666660] tracking-wider uppercase">
                SHOWING <strong className="text-[#111111]">{Math.min(visibleCount, filteredFaculty.length)}</strong> OF {filteredFaculty.length} MATCHING ({facultyData.length} TOTAL)
              </div>
            </div>

          </div>
        </div>

        {/* Editorial Department Pilling / Quick Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs border-b border-[#111111]/10 no-scrollbar">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 uppercase transition-all shrink-0 font-bold border ${
              selectedDept === 'ALL'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#666660] border-[#111111]/20 hover:border-[#DC2626] hover:text-[#DC2626]'
            }`}
          >
            ALL DEPARTMENTS ({availableDepartments.length})
          </button>
          {availableDepartments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 uppercase transition-all shrink-0 font-bold border ${
                selectedDept === dept
                  ? 'bg-[#DC2626] text-white border-[#DC2626]'
                  : 'bg-white text-[#666660] border-[#111111]/20 hover:border-[#DC2626] hover:text-[#DC2626]'
              }`}
            >
              {dept} ({deptCounts[dept] || 0})
            </button>
          ))}
        </div>

        {/* Editorial Faculty Stream Rows Grouped by Department (Paginated in batches of 10) */}
        <div className="space-y-16 pt-4">
          {filteredFaculty.length === 0 ? (
            <div className="py-12 font-mono text-sm text-[#666660] uppercase">
              NO FACULTY RECORDS FOUND MATCHING YOUR FILTERS IN THIS DEPARTMENT.
            </div>
          ) : selectedDept === 'ALL' ? (
            /* ALL DEPARTMENTS VIEW — Grouped by Department up to visibleCount */
            Object.entries(groupedVisibleFaculty).map(([deptName, deptList]) => {
              if (deptList.length === 0) return null;
              return (
                <div key={deptName} className="space-y-8">
                  {/* Department Header */}
                  <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3 font-syne">
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#111111] uppercase tracking-tight flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-[#DC2626]" />
                      <span>{deptName}</span>
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 px-3 py-1 border border-[#DC2626]/30 uppercase">
                      {deptList.length} DISPLAYED
                    </span>
                  </div>

                  {/* Faculty Cards for this Department */}
                  <div className="space-y-4">
                    {deptList.map((fac, idx) => renderFacultyCard(fac, idx))}
                  </div>
                </div>
              );
            })
          ) : (
            /* SINGLE DEPARTMENT VIEW (Paginated up to visibleCount) */
            <div className="space-y-8">
              {/* Department Header */}
              <div className="flex items-center justify-between border-b-2 border-[#DC2626] pb-3 font-syne">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#111111] uppercase tracking-tight flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-[#DC2626]" />
                  <span>{selectedDept} FACULTY DIRECTORY</span>
                </h3>
                <span className="font-mono text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 px-3 py-1 border border-[#DC2626]/30 uppercase">
                  {visibleFaculty.length} OF {filteredFaculty.length} DISPLAYED
                </span>
              </div>

              {/* Faculty Cards */}
              <div className="space-y-4">
                {visibleFaculty.map((fac, idx) => renderFacultyCard(fac, idx))}
              </div>
            </div>
          )}

          {/* Load More Button: Paginated in batches of 10. Automatically hidden when all are shown */}
          {visibleCount < filteredFaculty.length && (
            <div className="pt-10 pb-6 flex flex-col items-center justify-center gap-2 font-mono">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="px-8 py-3.5 bg-[#111111] hover:bg-[#DC2626] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>LOAD MORE FACULTY</span>
                <span>(+{Math.min(10, filteredFaculty.length - visibleCount)})</span>
                <span className="text-red-300">↓</span>
              </button>
              <span className="text-[11px] text-[#666660]">
                DISPLAYING {Math.min(visibleCount, filteredFaculty.length)} OF {filteredFaculty.length} MATCHING MEMBERS
              </span>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
