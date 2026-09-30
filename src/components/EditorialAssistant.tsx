import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  X,
  Send,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Building2,
  BookOpen,
  PhoneCall,
  Award,
  Calendar,
  Newspaper,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { useTimeContext } from '../context/TimeContext';
import { getLibraryOccupancyDetails } from '../data/libraryData';
import { queryCampusAi } from '../services/api';
import type { CampusAiResult } from '../data/campusAiEngine';

interface EditorialAssistantProps {
  onSelectBuildingForMap: (id: string) => void;
}

const ROTATING_PLACEHOLDERS = [
  "What is Dr. Yogish H K's email?",
  "Where is Dr. Yogish H K?",
  "Which library is least crowded?",
  "What events are happening today?",
  "Show CSE faculty in LHC.",
  "Which classrooms are available?",
  "What issues are reported in LHC?",
  "What clubs are available?",
  "Where is LHC?",
  "What is the latest MSRIT announcement?"
];

const SUGGESTION_CATEGORIES = [
  {
    category: 'FACULTY',
    chips: [
      { label: 'Find a faculty member', query: 'Show CSE faculty' },
      { label: 'Faculty email', query: "What is Dr. Yogish H K's email?" },
      { label: 'Faculty availability', query: 'Is Dr. Yogish H K available?' },
      { label: 'Faculty schedule', query: "What is Dr. Yogish H K's schedule?" }
    ]
  },
  {
    category: 'CAMPUS',
    chips: [
      { label: 'Find a building', query: 'Where is LHC?' },
      { label: 'Find a room', query: 'Find AB-401' },
      { label: 'Campus map', query: 'Where is ESB?' },
      { label: 'Classroom availability', query: 'Find a room in LHC' }
    ]
  },
  {
    category: 'LIBRARIES',
    chips: [
      { label: 'Library locations', query: 'Where is LHC library?' },
      { label: 'Least crowded library', query: 'Which library is least crowded?' },
      { label: 'Library occupancy', query: 'Show library occupancy' },
      { label: 'Library timings', query: 'Is Apex library open?' }
    ]
  },
  {
    category: 'CAMPUS LIFE',
    chips: [
      { label: 'Latest announcements', query: 'What are the latest announcements?' },
      { label: 'Upcoming events', query: 'What events are happening today?' },
      { label: 'Clubs & activities', query: 'What clubs are available?' },
      { label: 'Emergency contacts', query: 'Show campus emergency contacts' }
    ]
  },
  {
    category: 'ISSUES',
    chips: [
      { label: 'Reported issues', query: 'Show reported issues' },
      { label: 'Issues in LHC', query: 'What issues are reported in LHC?' },
      { label: 'High priority issues', query: 'Show high priority issues' }
    ]
  }
];

export const EditorialAssistant: React.FC<EditorialAssistantProps> = ({
  onSelectBuildingForMap
}) => {
  const { simulatedTime } = useTimeContext();

  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('FACULTY');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const sessionIdRef = useRef<string>('session-' + Math.random().toString(36).substring(2, 9));
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryIdRef = useRef<number>(0);

  const [activeResult, setActiveResult] = useState<CampusAiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Rotating placeholder interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Initial default result
  useEffect(() => {
    async function loadInitial() {
      try {
        const initialRes = await queryCampusAi("What is Dr. Yogish H K's email?", sessionIdRef.current);
        if (initialRes && initialRes.answer) {
          if (initialRes.resultObject && initialRes.resultObject.queryText) {
            setActiveResult(initialRes.resultObject);
          } else {
            setActiveResult({
              queryText: "What is Dr. Yogish H K's email?",
              normalizedQuery: "what is dr. yogish h k's email?",
              intents: [initialRes.intent as any],
              responseText: initialRes.answer,
              matchedFaculty: initialRes.data?.faculty || (initialRes.data?.name && initialRes.data?.email ? initialRes.data : undefined)
            });
          }
        }
      } catch {
        // Fallback
      }
    }
    loadInitial();
  }, []);

  const handleQuerySubmit = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) return;

    const currentQueryId = Date.now();
    queryIdRef.current = currentQueryId;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setActiveResult(null);
    setQuery(text);
    setErrorMessage(null);

    try {
      const res = await queryCampusAi(text, sessionIdRef.current, controller.signal);
      if (controller.signal.aborted || queryIdRef.current !== currentQueryId) return;

      if (res && res.answer) {
        if (res.resultObject && res.resultObject.queryText) {
          setActiveResult(res.resultObject);
        } else {
          setActiveResult({
            queryText: text,
            normalizedQuery: text.toLowerCase(),
            intents: [res.intent as any],
            responseText: res.answer,
            matchedFaculty: res.data?.faculty || (res.data?.name && res.data?.email ? res.data : undefined),
            matchedLibrary: res.data?.library || undefined,
            matchedRoom: res.data?.room || undefined,
            matchedBlock: res.data?.building || undefined,
            actionTargetId: res.data?.nodeId || res.data?.buildingId || (res.actions?.find((a: any) => a.type === 'VIEW_ON_MAP')?.value || res.actions?.find((a: any) => a.type === 'VIEW_ON_MAP')?.targetId)
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || queryIdRef.current !== currentQueryId) return;
      console.error('[EditorialAssistant] Query execution error:', err);
      setErrorMessage('Campus data is temporarily unavailable. Please try again.');
    } finally {
      if (!controller.signal.aborted && queryIdRef.current === currentQueryId) {
        setIsProcessing(false);
      }
    }
  };


  return (
    <section id="sec-ask" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 dark:border-white/10 relative overflow-hidden bg-[#F5F4EF] dark:bg-[#0E0F12]">
      <div className="max-w-[1700px] mx-auto space-y-10 sm:space-y-14">
        
        {/* Section Title */}
        <div>
          <h2 className="text-subgiant font-syne text-[#111111] dark:text-[#F3F3EE] uppercase tracking-tighter leading-none">
            ASK
          </h2>
          <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
            YOUR
          </h2>
          <h2 className="text-subgiant font-syne text-[#111111] dark:text-[#F3F3EE] uppercase tracking-tighter leading-none">
            CAMPUS.
          </h2>
        </div>

        {/* Main Interface Grid: Query Input & Suggestions (Left) | Response Stream (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pt-4 border-t border-[#111111]/10 dark:border-white/10 items-start">
          
          {/* Left 6 Cols: Premium Input & Suggestions */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Input Form Box */}
            <div className="space-y-4">
              <label className="font-mono text-xs text-[#666660] dark:text-gray-400 uppercase tracking-widest block font-bold flex items-center justify-between">
                <span>QUERY CAMPUS INTELLIGENCE ENGINE:</span>
                {isProcessing && (
                  <span className="text-[#DC2626] flex items-center gap-1 font-bold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching campus data...
                  </span>
                )}
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuerySubmit(query);
                }}
                className="space-y-3"
              >
                <div className="relative flex items-center bg-white dark:bg-[#16181D] border-2 border-[#111111]/20 dark:border-white/20 focus-within:border-[#DC2626] dark:focus-within:border-[#DC2626] transition-all shadow-sm">
                  
                  {/* Left Search Icon */}
                  <div className="pl-4 pr-2 text-[#888880] dark:text-gray-400">
                    <Search className="w-5 h-5 text-[#DC2626]" />
                  </div>

                  {/* Main Input */}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                    disabled={isProcessing}
                    className="w-full bg-transparent py-4 pr-12 text-base sm:text-lg font-syne font-bold text-[#111111] dark:text-[#F3F3EE] placeholder-[#888880]/60 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50"
                  />

                  {/* Clear Button */}
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="p-2 text-gray-400 hover:text-[#DC2626] transition-colors mr-1"
                      title="Clear text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}



                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || !query.trim()}
                    className="px-5 py-4 bg-[#111111] hover:bg-[#DC2626] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>ASK</span>
                        <Send className="w-3.5 h-3.5 text-rose-300" />
                      </>
                    )}
                  </button>

                </div>

                <div className="flex justify-between items-center font-mono text-[11px] text-[#666660] dark:text-gray-400">
                  <span>PRESS ENTER TO RUN SEARCH</span>
                </div>
              </form>
            </div>

            {/* Quick Query Category Suggestions */}
            <div className="space-y-4 pt-4 border-t border-[#111111]/10 dark:border-white/10">
              <span className="font-mono text-xs text-[#666660] dark:text-gray-400 uppercase tracking-widest block font-bold">
                EXPLORE CAMPUS SUGGESTION CATEGORIES:
              </span>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
                {SUGGESTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    className={`px-3 py-1.5 border uppercase font-bold transition-all cursor-pointer shrink-0 ${
                      activeCategory === cat.category
                        ? 'bg-[#111111] text-white border-[#DC2626] dark:bg-white dark:text-[#111111]'
                        : 'bg-white/50 dark:bg-white/5 text-[#666660] dark:text-gray-400 border-[#111111]/15 dark:border-white/15 hover:border-[#DC2626]'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Active Category Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                {SUGGESTION_CATEGORIES.find((c) => c.category === activeCategory)?.chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuerySubmit(chip.query)}
                    className="p-3 bg-white dark:bg-[#16181D] border border-[#111111]/15 dark:border-white/15 hover:border-[#DC2626] text-left transition-all group flex flex-col justify-between cursor-pointer"
                  >
                    <span className="font-bold text-[#111111] dark:text-gray-200 group-hover:text-[#DC2626] transition-colors">
                      • {chip.label}
                    </span>
                    <span className="text-[10px] text-[#666660] dark:text-gray-500 mt-1 truncate">
                      "{chip.query}"
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right 6 Cols: Structured Result Stream */}
          <div className="lg:col-span-6 space-y-6 pt-4 lg:pt-0">
            <div className="font-mono text-xs text-[#666660] dark:text-gray-400 uppercase tracking-widest border-b border-[#111111]/10 dark:border-white/10 pb-3 flex justify-between items-center">
              <span>MSRIT SYSTEM INTELLIGENCE RESPONSE</span>
              {isProcessing && (
                <span className="text-[#DC2626] font-bold flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  PROCESSING...
                </span>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-mono text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold">QUERY EXECUTION ERROR</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Result Stream Component */}
            {activeResult && !errorMessage && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeResult.queryText + (activeResult.responseText?.slice(0, 10) || '')}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Prompt */}
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] text-[#666660] dark:text-gray-400 uppercase tracking-widest">QUERY PROMPT:</span>
                    <h3 className="font-syne text-sm sm:text-base font-bold text-[#DC2626]">
                      "{activeResult.queryText}"
                    </h3>
                  </div>

                  {/* Primary Compact Response Card */}
                  <div className="p-4 sm:p-5 bg-white dark:bg-[#16181D] border border-[#111111]/15 dark:border-white/15 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center border-b border-[#111111]/10 dark:border-white/10 pb-2 font-mono text-[11px]">
                      <span className="text-[#DC2626] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>CAMPUS AI RESPONSE</span>
                      </span>
                      {activeResult.intents && activeResult.intents.length > 0 && (
                        <span className="text-[#666660] dark:text-gray-400 text-[10px] uppercase font-mono">
                          {activeResult.intents[0].replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-syne font-semibold text-[#111111] dark:text-[#F3F3EE] leading-relaxed whitespace-pre-line">
                      {activeResult.responseText}
                    </p>

                    {/* Compact Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#111111]/10 dark:border-white/10 font-mono text-xs">
                      {activeResult.matchedFaculty?.email ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${activeResult.matchedFaculty.email}`}
                            className="text-[#DC2626] hover:underline font-bold text-xs"
                          >
                            📧 {activeResult.matchedFaculty.email}
                          </a>
                          <button
                            onClick={() => handleCopyEmail(activeResult.matchedFaculty!.email!)}
                            className="px-2 py-1 bg-gray-100 dark:bg-white/10 hover:bg-[#DC2626] hover:text-white text-[#111111] dark:text-gray-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Copy email to clipboard"
                          >
                            {copiedEmail === activeResult.matchedFaculty.email ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>COPY EMAIL</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        {activeResult.matchedFaculty?.department && (
                          <button
                            onClick={() => handleQuerySubmit(`Show ${activeResult.matchedDepartment?.code || activeResult.matchedFaculty!.department} faculty`)}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-[#DC2626] hover:text-white text-[#111111] dark:text-gray-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>VIEW DEPARTMENT</span>
                          </button>
                        )}

                        {activeResult.actionTargetId && (
                          <button
                            onClick={() => onSelectBuildingForMap(activeResult.actionTargetId!)}
                            className="px-3 py-1.5 bg-[#111111] hover:bg-[#DC2626] text-white font-bold flex items-center gap-1.5 uppercase text-[11px] transition-all cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-300" />
                            <span>VIEW ON MAP →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ambiguity Guard Clarification Options */}
                  {activeResult.clarificationNeeded && activeResult.multipleFaculty && (
                    <div className="p-4 border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-mono text-xs space-y-3">
                      <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>MULTIPLE FACULTY MATCHES FOUND — CHOOSE RECORD:</span>
                      </div>
                      <div className="space-y-2">
                        {activeResult.multipleFaculty.map((fac) => (
                          <button
                            key={fac.id}
                            onClick={() => handleQuerySubmit(`Where is ${fac.name}?`)}
                            className="w-full text-left p-2.5 bg-white dark:bg-[#1E2028] border border-amber-300 hover:border-[#DC2626] transition-all flex items-center justify-between font-bold"
                          >
                            <span>• {fac.name} ({fac.department})</span>
                            <span className="text-[10px] text-[#DC2626]">SELECT →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Library Card */}
                  {activeResult.matchedLibrary && (() => {
                    const libDetails = getLibraryOccupancyDetails(activeResult.matchedLibrary, simulatedTime);
                    return (
                      <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                        <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                          <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#DC2626]" />
                            CAMPUS LIBRARY
                          </span>
                          <span className="text-[#DC2626] font-bold">
                            ESTIMATED OCCUPANCY: {libDetails.displayOccupancy}
                          </span>
                        </div>

                        <div className="font-syne text-2xl font-bold text-[#111111] dark:text-[#F3F3EE]">
                          {activeResult.matchedLibrary.name}
                        </div>

                        <div className="text-[#666660] dark:text-gray-300 space-y-1.5">
                          <div>BUILDING: <strong className="text-[#111111] dark:text-white">{activeResult.matchedLibrary.building} Block</strong></div>
                          <div>FLOOR: <strong className="text-[#111111] dark:text-white">{activeResult.matchedLibrary.floor}</strong></div>
                          <div>HOURS: <strong className="text-[#111111] dark:text-white">09:00–21:00 Daily</strong></div>
                          <div>PRIMARY USERS: <strong className="text-[#111111] dark:text-white">{activeResult.matchedLibrary.primaryGroups.join(' • ')}</strong></div>
                        </div>

                        {/* Occupancy Progress Bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#666660] dark:text-gray-400">ESTIMATED LIVE OCCUPANCY</span>
                            <span className="text-[#DC2626] font-bold">{libDetails.displayOccupancy}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#111111]/10 dark:bg-white/10 overflow-hidden border border-[#111111]/15 dark:border-white/15">
                            <div
                              className="h-full bg-[#DC2626] transition-all duration-700"
                              style={{ width: `${libDetails.percentageEquivalent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-3 flex justify-between items-center border-t border-[#111111]/10 dark:border-white/10">
                          <span className="text-[#666660] dark:text-gray-400 text-[11px]">LABEL: Estimated Live Occupancy</span>
                          {activeResult.actionTargetId && (
                            <button
                              onClick={() => onSelectBuildingForMap(activeResult.actionTargetId!)}
                              className="px-3 py-1.5 bg-[#111111] hover:bg-[#DC2626] text-white font-bold flex items-center gap-1.5 uppercase text-[11px] transition-all cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-300" />
                              <span>VIEW LIBRARY ON MAP →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Structured Events Card Result */}
                  {activeResult.matchedEvents && activeResult.matchedEvents.length > 0 && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                          OFFICIAL MSRIT EVENTS
                        </span>
                        <span className="text-[#DC2626] font-bold">SOURCE: MSRIT OFFICIAL WEBSITE</span>
                      </div>

                      <div className="space-y-3">
                        {activeResult.matchedEvents.map((e, idx) => (
                          <div key={idx} className="p-3 border border-[#111111]/10 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-1.5">
                            <div className="font-syne font-bold text-base text-[#111111] dark:text-white">
                              {e.title}
                            </div>
                            <div className="text-[11px] text-[#666660] dark:text-gray-400 flex flex-wrap gap-3">
                              <span>📅 Date: {e.date}</span>
                              {e.location && <span>📍 Venue: {e.location}</span>}
                            </div>
                            {e.link && (
                              <a
                                href={e.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#DC2626] font-bold hover:underline pt-1"
                              >
                                <span>[Read More]</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Announcements Card Result */}
                  {activeResult.matchedAnnouncements && activeResult.matchedAnnouncements.length > 0 && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <Newspaper className="w-3.5 h-3.5 text-[#DC2626]" />
                          OFFICIAL MSRIT ANNOUNCEMENTS
                        </span>
                        <span className="text-[#DC2626] font-bold">SOURCE: MSRIT OFFICIAL WEBSITE</span>
                      </div>

                      <div className="space-y-3">
                        {activeResult.matchedAnnouncements.map((a, idx) => (
                          <div key={idx} className="p-3 border border-[#111111]/10 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-1.5">
                            <div className="font-syne font-bold text-base text-[#111111] dark:text-white">
                              {a.title}
                            </div>
                            <div className="text-[11px] text-[#666660] dark:text-gray-400">
                              📅 Published: {a.date}
                            </div>
                            {a.link && (
                              <a
                                href={a.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#DC2626] font-bold hover:underline pt-1"
                              >
                                <span>[Read More]</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Clubs Card Result */}
                  {activeResult.matchedClubs && activeResult.matchedClubs.length > 0 && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#DC2626]" />
                          MSRIT CLUBS &amp; ORGANIZATIONS
                        </span>
                        <span className="text-[#DC2626] font-bold">SOURCE: MSRIT OFFICIAL WEBSITE</span>
                      </div>

                      <div className="space-y-3">
                        {activeResult.matchedClubs.map((c, idx) => (
                          <div key={idx} className="p-3.5 border border-[#111111]/10 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-syne font-bold text-base text-[#111111] dark:text-white">{c.name}</span>
                            </div>
                            {c.description && (
                              <p className="text-[#666660] dark:text-gray-300 text-xs leading-relaxed">
                                {c.description}
                              </p>
                            )}
                            {c.instagramUrl && (
                              <a
                                href={c.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#DC2626] font-bold hover:underline pt-1 uppercase tracking-wider font-mono"
                              >
                                <span>GET TO KNOW →</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Emergency Contacts Card Result */}
                  {activeResult.matchedEmergencyContacts && activeResult.matchedEmergencyContacts.length > 0 && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5 text-[#DC2626]" />
                          VERIFIED EMERGENCY CONTACTS
                        </span>
                        <span className="text-[#DC2626] font-bold">OFFICIAL NUMBERS</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeResult.matchedEmergencyContacts.map((c, idx) => (
                          <div key={idx} className="p-3 border border-[#111111]/10 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-1">
                            <div className="font-bold text-[#111111] dark:text-white text-xs">{c.label}</div>
                            <a
                              href={`tel:${c.phone}`}
                              className="text-base font-bold text-[#DC2626] hover:underline block"
                            >
                              📞 {c.phone}
                            </a>
                            <div className="text-[10px] text-[#666660] dark:text-gray-400">{c.category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Issues Card Result */}
                  {activeResult.matchedIssues && activeResult.matchedIssues.length > 0 && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                          REPORTED CAMPUS ISSUES ({activeResult.matchedIssues.length})
                        </span>
                        <span className="text-[#DC2626] font-bold">DISPATCH QUEUE</span>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {activeResult.matchedIssues.map((iss) => (
                          <div key={iss.id} className="p-3 border border-[#111111]/10 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-syne font-bold text-[#111111] dark:text-white">{iss.title}</span>
                              <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] font-bold text-[10px] uppercase">
                                {iss.priority} PRIORITY
                              </span>
                            </div>
                            <div className="text-[11px] text-[#666660] dark:text-gray-400">
                              📍 {iss.location} | Category: {iss.category} | Status: <strong className="text-[#111111] dark:text-white">{iss.status}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Room Card Result */}
                  {activeResult.matchedRoom && !activeResult.matchedFaculty && !activeResult.intents?.some((i: any) => String(i).startsWith('FACULTY_') || String(i).startsWith('DEPARTMENT_HOD')) && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#DC2626]" />
                          <span>VERIFIED CLASSROOM / ROOM DETAILS</span>
                        </span>
                        <span className="text-[#DC2626] font-bold">{activeResult.matchedRoom.floor ? activeResult.matchedRoom.floor.toUpperCase() : 'VERIFIED'}</span>
                      </div>

                      <div>
                        <div className="font-syne text-2xl font-bold text-[#111111] dark:text-[#F3F3EE]">
                          {activeResult.matchedRoom.roomNumber}
                        </div>
                        {activeResult.matchedRoom.name && (
                          <div className="text-sm font-bold text-[#DC2626] uppercase mt-0.5">
                            {activeResult.matchedRoom.name}
                          </div>
                        )}
                      </div>

                      <div className="text-[#666660] dark:text-gray-300 space-y-1">
                        <div>BUILDING: <strong className="text-[#111111] dark:text-white">📍 {activeResult.matchedRoom.building ? `${activeResult.matchedRoom.building} Block` : 'Campus Facilities'}</strong></div>
                        {activeResult.matchedRoom.floor && (
                          <div>FLOOR: <strong className="text-[#111111] dark:text-white">{activeResult.matchedRoom.floor}</strong></div>
                        )}
                        {(activeResult.matchedRoom.departments?.length || activeResult.matchedRoom.department) ? (
                          <div>DEPARTMENT: <strong className="text-[#111111] dark:text-white">{activeResult.matchedRoom.departments?.join(' + ') || activeResult.matchedRoom.department}</strong></div>
                        ) : null}
                      </div>

                      <div className="pt-3 flex justify-between items-center border-t border-[#111111]/10 dark:border-white/10">
                        <span className="text-[#666660] dark:text-gray-400 text-[11px]">{activeResult.matchedRoom.category || 'Verified Room'}</span>
                        {activeResult.actionTargetId && (
                          <button
                            onClick={() => onSelectBuildingForMap(activeResult.actionTargetId!)}
                            className="px-3 py-1.5 bg-[#111111] hover:bg-[#DC2626] text-white font-bold flex items-center gap-1.5 uppercase text-[11px] transition-all cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-300" />
                            <span>VIEW ON MAP →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Structured Building / Location Card */}
                  {activeResult.matchedBlock && !activeResult.matchedFaculty && !activeResult.matchedRoom && (
                    <div className="p-6 border border-[#111111]/15 dark:border-white/15 space-y-4 bg-white dark:bg-[#16181D] font-mono text-xs shadow-xs">
                      <div className="flex justify-between border-b border-[#111111]/10 dark:border-white/10 pb-2">
                        <span className="text-[#666660] dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#DC2626]" />
                          VERIFIED CAMPUS BLOCK
                        </span>
                        <span className="text-[#DC2626] font-bold">{activeResult.matchedBlock.id.toUpperCase()}</span>
                      </div>

                      <div className="font-syne text-2xl font-bold text-[#111111] dark:text-[#F3F3EE]">
                        {activeResult.matchedBlock.displayName} ({activeResult.matchedBlock.name})
                      </div>

                      <p className="text-[#666660] dark:text-gray-300 leading-relaxed">
                        {activeResult.matchedBlock.description}
                      </p>

                      <div className="pt-3 flex justify-between items-center border-t border-[#111111]/10 dark:border-white/10">
                        <span className="text-[#666660] dark:text-gray-400 text-[11px]">Departments: {activeResult.matchedBlock.departments.join(', ')}</span>
                        <button
                          onClick={() => onSelectBuildingForMap(`block-${activeResult.matchedBlock!.id}`)}
                          className="px-3 py-1.5 bg-[#111111] hover:bg-[#DC2626] text-white font-bold flex items-center gap-1.5 uppercase text-[11px] transition-all cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-300" />
                          <span>VIEW ON MAP →</span>
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
