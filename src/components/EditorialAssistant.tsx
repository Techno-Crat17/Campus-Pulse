import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import type { Building, MSRITDepartment, MSRITLocation } from '../data/campusData';
import { FACULTY_MSRIT_DATA } from '../data/facultyData';
import type { MSRITFacultyRecord } from '../data/facultyData';
import { getFacultyLiveStatus } from '../data/statusEngine';
import { useTimeContext } from '../context/TimeContext';
import { getLibraryOccupancyDetails } from '../data/libraryData';
import type { CampusLibrary } from '../data/libraryData';
import { processCampusAiQuery } from '../data/campusAiEngine';
import type { CampusAiContext } from '../data/campusAiEngine';
import type { LostFoundItem } from '../data/lostFoundData';
import type { IssueReport } from '../data/issueReportsData';
import type { MSRITRoomRecord } from '../data/roomsData';

interface EditorialAssistantProps {
  onSelectBuildingForMap: (id: string) => void;
}

export const EditorialAssistant: React.FC<EditorialAssistantProps> = ({
  onSelectBuildingForMap
}) => {
  const { simulatedTime } = useTimeContext();

  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const aiContextRef = useRef<CampusAiContext>({ history: [] });

  const [activeResponse, setActiveResponse] = useState<{
    queryText: string;
    responseText: string;
    subText?: string;
    msritFaculty?: MSRITFacultyRecord & { isCollegeOpen?: boolean };
    msritLocation?: MSRITLocation;
    msritDepartment?: MSRITDepartment;
    building?: Building;
    library?: CampusLibrary;
    lostItem?: LostFoundItem;
    issues?: IssueReport[];
    matchedRoom?: MSRITRoomRecord;
    matchedRoomsList?: MSRITRoomRecord[];
    actionTargetId?: string;
  }>(() => {
    const res = processCampusAiQuery("What is Dr. Yogish H K's email?", null);
    const initialFac = res.matchedFaculty || FACULTY_MSRIT_DATA.find((f) => f.name.includes('Yogish')) || FACULTY_MSRIT_DATA[0];
    const liveState = getFacultyLiveStatus(initialFac, null);
    return {
      queryText: "WHAT IS DR. YOGISH H K'S EMAIL?",
      responseText: res.responseText,
      subText: res.subText,
      msritFaculty: {
        ...initialFac,
        status: liveState.liveStatus,
        currentLocation: liveState.liveLocation,
        nextAvailableTime: liveState.liveNextAvailableTime,
        isCollegeOpen: liveState.isCollegeOpen
      }
    };
  });

  const suggestions = [
    "What is the email of Dr Sumana?",
    "Where is Sumana?",
    "Is Sumana available now?",
    "Who is the HOD of CSE?",
    "Show me CSE faculty",
    "Where is the CSE department?",
    "Which library is least crowded for CSE?",
    "Which library is empty?",
    "Which library should a first year student use?",
    "Is LHC library open?",
    "What is the occupancy of ESB library?",
    "Where is Apex?",
    "Where is AB-401?",
    "Where is LHC204?",
    "Where is ARCH307?",
    "Show MCA classrooms",
    "What classrooms are in Apex?",
    "Where is the DES seminar hall?",
    "Show me unresolved issues",
    "What issues are reported in LHC?"
  ];

  const handleQuerySubmit = (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) return;

    setIsProcessing(true);
    setQuery(text);

    setTimeout(() => {
      const aiResult = processCampusAiQuery(text, simulatedTime, aiContextRef.current);
      if (aiResult.contextUpdated) {
        aiContextRef.current = aiResult.contextUpdated;
      }

      let fac: (MSRITFacultyRecord & { isCollegeOpen?: boolean }) | undefined;
      if (aiResult.matchedFaculty) {
        const liveState = getFacultyLiveStatus(aiResult.matchedFaculty, simulatedTime);
        fac = {
          ...aiResult.matchedFaculty,
          status: liveState.liveStatus,
          currentLocation: liveState.liveLocation,
          nextAvailableTime: liveState.liveNextAvailableTime,
          isCollegeOpen: liveState.isCollegeOpen
        };
      }

      let loc: MSRITLocation | undefined = aiResult.matchedLocation;
      if (!loc && aiResult.matchedBlock) {
        loc = {
          id: `block-${aiResult.matchedBlock.id}`,
          name: aiResult.matchedBlock.displayName,
          building: aiResult.matchedBlock.name,
          floor: 'Campus Ground Block',
          category: 'Verified Campus Block',
          description: aiResult.matchedBlock.description,
          department: aiResult.matchedBlock.departments.join(', '),
          room: null,
          latitude: aiResult.matchedBlock.center.lat,
          longitude: aiResult.matchedBlock.center.lng,
          sourceUrl: 'https://www.msrit.edu'
        };
      } else if (!loc && aiResult.matchedNode) {
        loc = {
          id: aiResult.matchedNode.nodeId,
          name: aiResult.matchedNode.name,
          building: aiResult.matchedNode.building,
          floor: aiResult.matchedNode.floor,
          category: (aiResult.matchedNode.category as any) || 'Academic Facility',
          description: aiResult.matchedNode.description,
          department: 'General / Multi-Department',
          room: null,
          latitude: aiResult.matchedNode.coordinates?.lat || 13.0310,
          longitude: aiResult.matchedNode.coordinates?.lng || 77.5647,
          sourceUrl: 'https://www.msrit.edu'
        };
      }

      let bldgId: string | undefined = undefined;
      if (aiResult.matchedBlock) {
        bldgId = `block-${aiResult.matchedBlock.id}`;
      } else if (aiResult.matchedRoom?.building) {
        const rb = aiResult.matchedRoom.building.toLowerCase();
        if (rb.includes('apex')) bldgId = 'block-apex';
        else if (rb.includes('lhc')) bldgId = 'block-lhc';
        else if (rb.includes('esb')) bldgId = 'block-esb';
        else if (rb.includes('des')) bldgId = 'block-des';
        else if (rb.includes('arch')) bldgId = 'block-architecture';
      }

      setActiveResponse({
        queryText: aiResult.queryText,
        responseText: aiResult.responseText,
        subText: aiResult.subText,
        msritFaculty: fac,
        msritLocation: loc,
        msritDepartment: aiResult.matchedDepartment,
        library: aiResult.matchedLibrary,
        lostItem: aiResult.matchedLostItem,
        issues: aiResult.matchedIssues,
        matchedRoom: aiResult.matchedRoom,
        matchedRoomsList: aiResult.matchedRoomsList,
        actionTargetId: bldgId
      });
      setIsProcessing(false);
    }, 200);
  };

  return (
    <section id="sec-ask" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold">
          SECTION 02 // ASK MSRIT CAMPUS PULSE
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
            ASK
          </h2>
          <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
            YOUR
          </h2>
          <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
            CAMPUS.
          </h2>
        </div>

        {/* Interactive Query Input & Editorial Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-[#111111]/10 items-start">
          
          {/* Left 6 Cols: Input & Suggestions */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <label className="font-mono text-xs text-[#666660] uppercase tracking-widest block">
                ASK ABOUT MSRIT FACULTY, DEPARTMENTS & LOCATIONS:
              </label>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuerySubmit(query);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What is Dr. Yogish H K's email?"
                  className="w-full bg-transparent border-b-2 border-[#111111]/30 py-4 text-2xl sm:text-3xl font-syne font-bold text-[#111111] placeholder-[#666660]/50 focus:outline-none focus:border-[#DC2626] transition-all"
                />
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#666660]">PRESS ENTER TO QUERY VERIFIED MSRIT DATASET</span>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-3 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                  >
                    <span>SUBMIT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-3 pt-6 border-t border-[#111111]/10">
              <span className="font-mono text-xs text-[#666660] uppercase tracking-widest block">
                SAMPLE MSRIT INTEL QUERIES:
              </span>
              <div className="flex flex-col space-y-2 font-mono text-xs">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuerySubmit(sug)}
                    className="text-left text-[#666660] hover:text-[#DC2626] transition-colors py-1 flex items-center gap-2 group"
                  >
                    <span className="text-[#DC2626] font-bold">0{i + 1}.</span>
                    <span className="group-hover:translate-x-1 transition-transform">{sug.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 6 Cols: Editorial Result Stream */}
          <div className="lg:col-span-6 space-y-8 pt-4 lg:pt-0">
            <div className="font-mono text-xs text-[#666660] uppercase tracking-widest border-b border-[#111111]/10 pb-3 flex justify-between">
              <span>MSRIT SYSTEM INTELLIGENCE RESPONSE</span>
              {isProcessing && <span className="text-[#DC2626] font-bold animate-pulse">QUERYING MSRIT DATASET...</span>}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeResponse.queryText}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <span className="font-mono text-xs text-[#666660]">QUERY PROMPT:</span>
                  <h3 className="font-syne text-xl sm:text-2xl font-bold text-[#DC2626]">
                    "{activeResponse.queryText}"
                  </h3>
                </div>

                <div className="space-y-3">
                  <p className="text-2xl sm:text-4xl font-syne font-bold text-[#111111] leading-tight uppercase whitespace-pre-line">
                    {activeResponse.responseText}
                  </p>
                  {activeResponse.subText && (
                    <p className="text-base sm:text-lg font-light text-[#666660]">
                      {activeResponse.subText}
                    </p>
                  )}
                </div>

                {/* Faculty Card Result */}
                {activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">VERIFIED FACULTY PROFILE</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.msritFaculty.department.toUpperCase()}</span>
                    </div>

                    <div className="font-syne text-2xl font-bold text-[#111111]">
                      {activeResponse.msritFaculty.name}
                    </div>

                    <div className="text-[#666660] space-y-1">
                      <div>DESIGNATION: <strong className="text-[#111111]">{activeResponse.msritFaculty.designation}</strong></div>
                      <div>CABIN LOCATION: <strong className="text-[#111111]">{activeResponse.msritFaculty.cabinLocation}</strong></div>
                      {activeResponse.msritFaculty.currentLocation && (
                        <div>LIVE LOCATION: <strong className="text-[#111111]">{activeResponse.msritFaculty.currentLocation}</strong></div>
                      )}
                      <div>LIVE STATUS: <strong className="text-[#DC2626]">{activeResponse.msritFaculty.status}</strong></div>
                      {activeResponse.msritFaculty.nextAvailableTime && (
                        <div>NEXT AVAILABLE: <strong className="text-[#111111]">{activeResponse.msritFaculty.nextAvailableTime}</strong></div>
                      )}
                      {activeResponse.msritFaculty.email && (
                        <div>EMAIL: <a href={`mailto:${activeResponse.msritFaculty.email}`} className="text-[#DC2626] underline">{activeResponse.msritFaculty.email}</a></div>
                      )}
                      <div>NODE ID: <strong className="text-[#111111]">{activeResponse.msritFaculty.nodeId}</strong></div>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-[#111111]/10">
                      <span className="text-[#666660] text-[11px]">SOURCE: faculty_msrit_dynamic.json</span>
                      {activeResponse.msritFaculty.nodeId && (
                        <button
                          onClick={() => onSelectBuildingForMap(activeResponse.msritFaculty!.nodeId)}
                          className="text-[#111111] hover:text-[#DC2626] font-bold flex items-center gap-1 uppercase"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>SHOW ON MAP →</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Central Library Card Result */}
                {activeResponse.library && (() => {
                  const libDetails = getLibraryOccupancyDetails(activeResponse.library, simulatedTime);
                  return (
                    <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                        <span className="text-[#666660] uppercase">
                          {libDetails.isEveningPeriod ? 'ESTIMATED EVENING OCCUPANCY' : !libDetails.isOpen ? 'LIBRARY STATUS (CLOSED)' : 'CENTRAL CAMPUS LIBRARY'}
                        </span>
                        <span className="text-[#DC2626] font-bold">
                          {libDetails.isEveningPeriod ? `EST. EVENING: ${libDetails.displayOccupancy}` : !libDetails.isOpen ? 'CLOSED (0%)' : `ESTIMATED OCCUPANCY: ${libDetails.displayOccupancy}`}
                        </span>
                      </div>

                      <div className="font-syne text-2xl font-bold text-[#111111]">
                        {activeResponse.library.name}
                      </div>

                      <div className="text-[#666660] space-y-1">
                        <div>BUILDING: <strong className="text-[#111111]">{activeResponse.library.building} Block</strong></div>
                        <div>FLOOR: <strong className="text-[#111111]">{activeResponse.library.floor}</strong></div>
                        <div>PRIMARY USERS: <strong className="text-[#111111]">{activeResponse.library.primaryGroups.join(' • ')}</strong></div>
                        <div>SOUNDSCAPE: <strong className="text-[#111111]">{activeResponse.library.noiseLevel}</strong></div>
                        <div>WALK TIME: <strong className="text-[#111111]">~{activeResponse.library.walkTimeMinutes} MIN</strong></div>
                      </div>

                      {/* Live Estimated Occupancy Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#666660]">
                            {libDetails.isEveningPeriod ? 'ESTIMATED EVENING OCCUPANCY' : 'ESTIMATED LIVE OCCUPANCY'}
                          </span>
                          <span className="text-[#DC2626] font-bold">
                            {libDetails.displayOccupancy}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#111111]/10 overflow-hidden border border-[#111111]/15">
                          <div
                            className="h-full bg-[#DC2626] transition-all duration-700"
                            style={{ width: `${libDetails.percentageEquivalent}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-[#111111]/10">
                        <span className="text-[#666660] text-[11px]">
                          {libDetails.isEveningPeriod ? 'LABEL: ESTIMATED EVENING OCCUPANCY' : !libDetails.isOpen ? 'LABEL: CLOSED (OPENS 09:00 ONWARDS)' : 'LABEL: ESTIMATED LIVE OCCUPANCY'}
                        </span>
                        <button
                          onClick={() => onSelectBuildingForMap(activeResponse.library!.nodeId)}
                          className="text-[#111111] hover:text-[#DC2626] font-bold flex items-center gap-1 uppercase"
                        >
                          <span>PAN CAMPUS MAP</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}


                {/* Location Card Result */}
                {activeResponse.msritLocation && !activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">VERIFIED MSRIT LOCATION</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.msritLocation.category.toUpperCase()}</span>
                    </div>

                    <div className="font-syne text-2xl font-bold text-[#111111]">
                      {activeResponse.msritLocation.name}
                    </div>

                    <div className="text-[#666660] space-y-1">
                      <div>BUILDING: <strong className="text-[#111111]">{activeResponse.msritLocation.building}</strong></div>
                      <div>FLOOR: <strong className="text-[#111111]">{activeResponse.msritLocation.floor}</strong></div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <a
                        href={activeResponse.msritLocation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#DC2626] hover:underline font-bold uppercase inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>SOURCE: MSRIT OFFICIAL WEBSITE</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => onSelectBuildingForMap(activeResponse.msritLocation?.id || 'loc-apex-block')}
                        className="text-[#111111] hover:text-[#DC2626] font-bold flex items-center gap-1 uppercase"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>VIEW MAP →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Department Card Result */}
                {activeResponse.msritDepartment && !activeResponse.msritFaculty && !activeResponse.msritLocation && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">DEPARTMENT INTEL</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.msritDepartment.code}</span>
                    </div>

                    <div className="font-syne text-2xl font-bold text-[#111111]">
                      {activeResponse.msritDepartment.name}
                    </div>

                    <div className="text-[#666660] space-y-1">
                      <div>HOD: <strong className="text-[#111111]">{activeResponse.msritDepartment.hod}</strong></div>
                      <div>BUILDING: <strong className="text-[#111111]">{activeResponse.msritDepartment.building}</strong></div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <a
                        href={activeResponse.msritDepartment.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#DC2626] hover:underline font-bold uppercase inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>SOURCE: MSRIT OFFICIAL WEBSITE</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Lost & Found Card Result */}
                {activeResponse.lostItem && !activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">LOST &amp; FOUND RECORD</span>
                      <span className="text-[#DC2626] font-bold">DEMO / SAMPLE DATA</span>
                    </div>

                    <div className="font-syne text-2xl font-bold text-[#111111]">
                      {activeResponse.lostItem.itemName}
                    </div>

                    <div className="text-[#666660] space-y-1">
                      <div>STATUS: <strong className="text-[#111111]">{activeResponse.lostItem.statusLabel || activeResponse.lostItem.type.toUpperCase()}</strong></div>
                      <div>LOCATION: <strong className="text-[#111111]">{activeResponse.lostItem.location}</strong></div>
                      <div>DATE: <strong className="text-[#111111]">{activeResponse.lostItem.date}</strong></div>
                      <div>CLAIM / REPORT DESK: <strong className="text-[#DC2626]">{activeResponse.lostItem.contactLocation}</strong></div>
                    </div>
                  </div>
                )}

                {/* Issue Reports Result Card */}
                {activeResponse.issues && activeResponse.issues.length > 0 && !activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">CAMPUS ISSUE TELEMETRY</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.issues.length} RECORD{activeResponse.issues.length > 1 ? 'S' : ''}</span>
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {activeResponse.issues.slice(0, 3).map((iss) => (
                        <div key={iss.id} className="p-3 border border-[#111111]/10 bg-white/60 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#111111]">{iss.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#DC2626]/10 text-[#DC2626] font-bold uppercase">{iss.priority} PRIORITY</span>
                          </div>
                          <div className="text-[11px] text-[#666660]">
                            Location: {iss.location} | Status: <strong className="text-[#111111]">{iss.status}</strong> | By: {iss.reportedBy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Room Single Result Card */}
                {activeResponse.matchedRoom && !activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">OFFICIAL MSRIT ROOM REGISTRY</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.matchedRoom.type.toUpperCase()}</span>
                    </div>

                    <div className="font-syne text-2xl font-bold text-[#111111]">
                      {activeResponse.matchedRoom.roomNumber}
                    </div>

                    <div className="text-[#666660] space-y-1">
                      <div>BUILDING: <strong className="text-[#111111]">{activeResponse.matchedRoom.building || 'Campus Facilities'}</strong></div>
                      {activeResponse.matchedRoom.department && (
                        <div>DEPARTMENT: <strong className="text-[#111111]">{activeResponse.matchedRoom.department}</strong></div>
                      )}
                      <div>TEMPORAL STATUS: <strong className={activeResponse.matchedRoom.temporalStatus === 'historical' ? 'text-amber-700' : 'text-[#DC2626]'}>
                        {activeResponse.matchedRoom.temporalStatus === 'historical' ? 'HISTORICAL ARCHIVE RECORD' : `CURRENT VERIFIED (${activeResponse.matchedRoom.sourceYear})`}
                      </strong></div>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-[#111111]/10">
                      <a
                        href={activeResponse.matchedRoom.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#DC2626] hover:underline font-bold uppercase inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>SOURCE: {activeResponse.matchedRoom.sourceTitle}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {activeResponse.actionTargetId && (
                        <button
                          onClick={() => onSelectBuildingForMap(activeResponse.actionTargetId!)}
                          className="text-[#111111] hover:text-[#DC2626] font-bold flex items-center gap-1 uppercase"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>VIEW BUILDING ON MAP →</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Verified Room List Result Card (Department or Building queries) */}
                {activeResponse.matchedRoomsList && activeResponse.matchedRoomsList.length > 0 && !activeResponse.msritFaculty && (
                  <div className="p-6 border border-[#111111]/15 space-y-4 bg-white/40 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#111111]/10 pb-2">
                      <span className="text-[#666660] uppercase">VERIFIED MSRIT SPACES</span>
                      <span className="text-[#DC2626] font-bold">{activeResponse.matchedRoomsList.length} ROOMS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {activeResponse.matchedRoomsList.map((r) => (
                        <div key={r.roomNumber} className="p-3 border border-[#111111]/10 bg-white/60 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#111111]">{r.roomNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#DC2626]/10 text-[#DC2626] font-bold uppercase">
                              {r.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#666660]">
                            {r.building || 'Campus Facilities'}{r.department ? ` • ${r.department}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeResponse.actionTargetId && (
                      <div className="pt-2 flex justify-end border-t border-[#111111]/10">
                        <button
                          onClick={() => onSelectBuildingForMap(activeResponse.actionTargetId!)}
                          className="text-[#111111] hover:text-[#DC2626] font-bold flex items-center gap-1 uppercase"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>VIEW BUILDING ON MAP →</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
};
