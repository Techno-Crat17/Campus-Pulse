import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  CAMPUS_NODES_MAPPING,
  getFacultyByNodeId,
  searchFaculty
} from '../data/facultyData';
import type { CampusNode, MSRITFacultyRecord } from '../data/facultyData';

interface MapboxCampusExplorerProps {
  initialNodeId?: string | null;
}

export const MapboxCampusExplorer: React.FC<MapboxCampusExplorerProps> = ({ initialNodeId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNode, setActiveNode] = useState<CampusNode>(
    (initialNodeId && CAMPUS_NODES_MAPPING[initialNodeId]) ? CAMPUS_NODES_MAPPING[initialNodeId] : CAMPUS_NODES_MAPPING['ise_faculty_cubicles']
  );
  const [selectedFacultyMember, setSelectedFacultyMember] = useState<MSRITFacultyRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapboxInstanceRef = useRef<any>(null);

  // Sync initialNodeId if passed from Faculty "Show on Map"
  useEffect(() => {
    if (initialNodeId && CAMPUS_NODES_MAPPING[initialNodeId]) {
      setActiveNode(CAMPUS_NODES_MAPPING[initialNodeId]);
      // Scroll to map section
      const mapEl = document.getElementById('sec-map-explore');
      if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, [initialNodeId]);

  // Dynamically get all faculty members associated with active node from faculty_msrit.json
  const associatedFaculty = getFacultyByNodeId(activeNode.nodeId);

  // Search filter across Faculty & Nodes
  const searchResultsFaculty = searchQuery.trim() ? searchFaculty(searchQuery) : [];
  const searchResultsNodes = Object.values(CAMPUS_NODES_MAPPING).filter((n) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNode = (node: CampusNode) => {
    setActiveNode(node);
    setSelectedFacultyMember(null);
    if (mapboxInstanceRef.current) {
      mapboxInstanceRef.current.flyTo({
        center: [node.coordinates.lng, node.coordinates.lat],
        zoom: 17,
        essential: true
      });
    }
  };

  const handleSelectFacultyFromSearch = (fac: MSRITFacultyRecord) => {
    const targetNode = CAMPUS_NODES_MAPPING[fac.nodeId] || CAMPUS_NODES_MAPPING['ise_faculty_cubicles'];
    setActiveNode(targetNode);
    setSelectedFacultyMember(fac);
    setSearchQuery('');
  };

  const handleGetDirections = (node: CampusNode) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${node.coordinates.lat},${node.coordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <section id="sec-map-explore" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12">
        
        {/* Header telemetry badge */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold flex items-center justify-end">
          <span className="text-[#111111] bg-[#111111]/5 px-3 py-1 border border-[#111111]/15">
            MSRIT BENGALURU • DATA SOURCE: FACULTY_MSRIT.JSON
          </span>
        </div>

        {/* Section Header Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              EXPLORE
            </h2>
            <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
              CAMPUS.
            </h2>
          </div>

          <div className="lg:col-span-4 font-mono text-xs text-[#666660] space-y-2 lg:text-right">
            <div>MAPBOX GL JS NODE SPATIAL ENGINE</div>
            <div className="text-[#DC2626] font-bold">● CONNECTED TO FACULTY_MSRIT.JSON</div>
          </div>
        </div>

        {/* Search Bar & Auto-Complete Dropdown */}
        <div className="space-y-4 pt-6 border-t border-[#111111]/10 relative">
          
          <div className="relative w-full max-w-4xl">
            <Search className="w-5 h-5 text-[#666660] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campus locations & faculty... (e.g. Dr. Yogish, Dr. Sumana, CSE Department, Library, LHC)"
              className="w-full bg-white border-2 border-[#111111]/20 pl-12 pr-4 py-3.5 text-sm sm:text-base font-mono text-[#111111] placeholder-[#666660] focus:outline-none focus:border-[#DC2626] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#666660] hover:text-[#111111]"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Search Results Dropdown Overlay */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 max-w-4xl bg-white border-2 border-[#111111] z-50 p-4 max-h-[350px] overflow-y-auto space-y-4 shadow-2xl font-mono text-xs">
              {searchResultsFaculty.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[#DC2626] font-bold uppercase text-[11px]">
                    FACULTY RESULTS ({searchResultsFaculty.length}):
                  </div>
                  <div className="space-y-1.5">
                    {searchResultsFaculty.slice(0, 8).map((fac) => (
                      <div
                        key={fac.id}
                        onClick={() => handleSelectFacultyFromSearch(fac)}
                        className="p-2.5 hover:bg-[#DC2626]/10 cursor-pointer border border-[#111111]/10 flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-[#111111] uppercase block text-sm">{fac.name}</strong>
                          <span className="text-[#666660] text-[11px]">{fac.designation} • {fac.department}</span>
                        </div>
                        <div className="text-[#DC2626] font-bold text-right text-[11px]">
                          <div>CABIN: {fac.cabinLocation}</div>
                          <div className="text-[10px] text-[#111111]">NODE: {fac.nodeId} →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResultsNodes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#111111]/10">
                  <div className="text-[#111111] font-bold uppercase text-[11px]">
                    CAMPUS MAP NODES ({searchResultsNodes.length}):
                  </div>
                  <div className="space-y-1.5">
                    {searchResultsNodes.map((n) => (
                      <div
                        key={n.nodeId}
                        onClick={() => {
                          handleSelectNode(n);
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-[#111111] hover:text-white cursor-pointer border border-[#111111]/10 flex justify-between items-center"
                      >
                        <span className="font-bold uppercase text-xs">{n.name} ({n.building})</span>
                        <span className="text-[10px] uppercase font-bold text-[#DC2626]">SELECT NODE →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResultsFaculty.length === 0 && searchResultsNodes.length === 0 && (
                <div className="text-[#666660] py-4 text-center">
                  NO FACULTY OR MAP NODES FOUND MATCHING "{searchQuery.toUpperCase()}".
                </div>
              )}
            </div>
          )}

        </div>

        {/* Main Map & Node Information Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Cols: Node-Based Vector Canvas Map */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative min-h-[550px] bg-[#EAE8E1] border-2 border-[#111111]/15 overflow-hidden shadow-inner">
              
              {/* Map Controls */}
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 font-mono text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
                  title="Zoom In"
                  className="w-9 h-9 bg-white border border-[#111111]/20 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center font-bold shadow"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  title="Zoom Out"
                  className="w-9 h-9 bg-white border border-[#111111]/20 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center font-bold shadow"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="w-9 h-9 bg-white border border-[#111111]/20 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center font-bold shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Mapbox Canvas Div */}
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

              {/* Vector Blueprint Layer */}
              <div
                className="relative w-full h-[550px] overflow-hidden transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <defs>
                    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111111" strokeWidth="0.5" opacity="0.15" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />

                  <path d="M 15% 35% L 85% 35%" stroke="#DC2626" strokeWidth="3" strokeDasharray="6 6" fill="none" opacity="0.6" />
                  <path d="M 45% 15% L 45% 85%" stroke="#111111" strokeWidth="4" fill="none" opacity="0.3" />
                  <path d="M 25% 65% L 75% 65%" stroke="#DC2626" strokeWidth="2.5" fill="none" opacity="0.5" />
                </svg>

                {/* Render All Verified Map Nodes */}
                {Object.values(CAMPUS_NODES_MAPPING).map((node) => {
                  const isSelected = activeNode.nodeId === node.nodeId;
                  const nodeFacultyCount = getFacultyByNodeId(node.nodeId).length;

                  return (
                    <motion.div
                      key={node.nodeId}
                      style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
                      whileHover={{ scale: 1.15 }}
                      onClick={() => handleSelectNode(node)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/nodePin"
                    >
                      <div className={`p-3 border font-mono transition-all shadow-md ${
                        isSelected
                          ? 'bg-[#111111] border-[#DC2626] text-white scale-110 z-30 shadow-xl ring-2 ring-[#DC2626]'
                          : 'bg-white border-[#111111]/30 hover:border-[#DC2626] text-[#111111]'
                      }`}>
                        <div className="font-syne font-bold text-xs uppercase flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-[#DC2626] animate-pulse' : 'bg-[#111111]'}`} />
                          <span>{node.name}</span>
                        </div>
                        <div className="text-[10px] text-[#DC2626] font-bold mt-1 flex justify-between gap-3 border-t border-[#111111]/10 pt-1">
                          <span>{node.building}</span>
                          <span className="text-[#111111] bg-[#111111]/10 px-1 font-mono font-bold">
                            {nodeFacultyCount} FACULTY
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              </div>

              {/* Map Footer Info Bar */}
              <div className="absolute bottom-3 left-4 right-4 p-3 bg-white/95 border border-[#111111]/15 flex items-center justify-between text-[11px] font-mono text-[#666660] z-20 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#111111]">ACTIVE NODE:</span>
                  <span className="text-[#DC2626] font-bold">{activeNode.name.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[#111111] font-bold">{associatedFaculty.length} FACULTY MEMBERS AT THIS NODE</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right 5 Cols: Contextual Node Location Details & Faculty List */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Active Node Info Card */}
            <div className="p-6 border-2 border-[#111111]/20 bg-white/70 space-y-6 shadow-sm">
              
              <div className="font-mono text-xs border-b border-[#111111]/10 pb-3 flex items-center justify-between">
                <span className="text-[#666660] uppercase tracking-widest">SELECTED MAP NODE</span>
                <span className="text-[#DC2626] font-bold uppercase">{activeNode.nodeId}</span>
              </div>

              {/* Node Title & Details */}
              <div className="space-y-2">
                <h3 className="font-syne text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                  {activeNode.name}
                </h3>
                <div className="font-mono text-xs text-[#DC2626] uppercase font-bold">
                  BUILDING: {activeNode.building} // {activeNode.floor}
                </div>
                <p className="text-xs text-[#666660] font-light pt-1">
                  {activeNode.description}
                </p>
              </div>

              {/* Highlighted Faculty Member Details if selected from search */}
              {selectedFacultyMember && (
                <div className="p-4 border-2 border-[#DC2626] bg-[#DC2626]/5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#DC2626]/20 pb-2">
                    <span className="text-[#DC2626] font-bold uppercase">SELECTED FACULTY MEMBER</span>
                    <button onClick={() => setSelectedFacultyMember(null)} className="text-[10px] text-[#666660] hover:text-[#111111]">
                      DESELECT ✕
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    {selectedFacultyMember.avatarUrl && (
                      <img
                        src={selectedFacultyMember.avatarUrl}
                        alt={selectedFacultyMember.name}
                        className="w-14 h-14 border border-[#111111]/20 object-cover shrink-0"
                      />
                    )}
                    <div>
                      <div className="font-syne font-bold text-lg text-[#111111] uppercase">
                        {selectedFacultyMember.name}
                      </div>
                      <div className="text-[#DC2626] font-bold text-xs">
                        {selectedFacultyMember.designation}
                      </div>
                      <div className="text-xs text-[#111111]">
                        {selectedFacultyMember.department}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#666660] pt-2 border-t border-[#DC2626]/20">
                    <div>CABIN LOCATION: <strong className="text-[#111111]">{selectedFacultyMember.cabinLocation}</strong></div>
                    <div>EMAIL: <a href={`mailto:${selectedFacultyMember.email}`} className="text-[#DC2626] underline">{selectedFacultyMember.email}</a></div>
                    <div>STATUS: <span className="text-emerald-700 font-bold uppercase">{selectedFacultyMember.status}</span></div>
                    {selectedFacultyMember.nextAvailableTime && (
                      <div>NEXT AVAILABLE: <strong className="text-[#DC2626]">{selectedFacultyMember.nextAvailableTime}</strong></div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Associated Faculty List for this Node */}
              <div className="space-y-3 pt-2">
                <div className="font-mono text-xs text-[#111111] uppercase font-bold border-b border-[#111111]/10 pb-2 flex justify-between">
                  <span>FACULTY AT THIS NODE ({associatedFaculty.length}):</span>
                  <span className="text-[#DC2626] text-[10px]">SOURCE: FACULTY_MSRIT.JSON</span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {associatedFaculty.length === 0 ? (
                    <div className="text-xs text-[#666660] py-4">NO FACULTY RECORDED FOR THIS NODE.</div>
                  ) : (
                    associatedFaculty.map((fac) => (
                      <div
                        key={fac.id}
                        onClick={() => setSelectedFacultyMember(fac)}
                        className={`p-3 border font-mono text-xs cursor-pointer transition-all ${
                          selectedFacultyMember?.id === fac.id
                            ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#111111] font-bold'
                            : 'border-[#111111]/15 bg-white/50 hover:border-[#111111] text-[#666660]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-[#111111] uppercase font-syne text-sm">{fac.name}</strong>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase font-bold">
                            {fac.status}
                          </span>
                        </div>
                        
                        <div className="text-[11px] text-[#DC2626] mt-1 font-bold">
                          {fac.designation} • {fac.department}
                        </div>

                        <div className="text-[10px] text-[#666660] mt-1">
                          CABIN: {fac.cabinLocation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleGetDirections(activeNode)}
                  className="w-full py-3.5 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Navigation className="w-4 h-4 text-red-300" />
                  <span>GET DIRECTIONS TO THIS NODE →</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
