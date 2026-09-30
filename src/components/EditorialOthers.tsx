import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  X,
  Search,
  Loader2,
  RefreshCw,
  Target
} from 'lucide-react';
import { fetchAnnouncements, fetchEvents, fetchClubs } from '../services/api';

export interface AnnouncementItem {
  title: string;
  date: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  sourceUrl: string;
  source: string;
  fetchedAt: string;
}

export interface EventItem {
  title: string;
  date: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  sourceUrl: string;
  source: string;
  fetchedAt: string;
}

export interface ClubItem {
  id: string;
  name: string;
  normalizedName?: string;
  category: 'Cultural & Performing Arts' | 'Literary, Quizzing & Media' | 'Technical & Co-Curricular Chapters' | string;
  description: string;
  type?: string;
  relatedChapters?: string[];
  source?: string;
  active?: boolean;
}

export const EditorialOthers: React.FC = () => {
  // Announcements State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [announcementsLastFetched, setAnnouncementsLastFetched] = useState<string | null>(null);

  // Events State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLastFetched, setEventsLastFetched] = useState<string | null>(null);

  // Clubs State
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubsLoading, setClubsLoading] = useState<boolean>(true);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [clubsLastFetched, setClubsLastFetched] = useState<string | null>(null);
  const [clubSearch, setClubSearch] = useState<string>('');
  const [clubCategoryFilter, setClubCategoryFilter] = useState<string>('All');

  // Modals
  const [showAllAnnouncementsModal, setShowAllAnnouncementsModal] = useState<boolean>(false);
  const [showAllEventsModal, setShowAllEventsModal] = useState<boolean>(false);

  // Load News, Events & Clubs from backend
  const loadData = async () => {
    setAnnouncementsLoading(true);
    setEventsLoading(true);
    setClubsLoading(true);
    setAnnouncementsError(null);
    setEventsError(null);
    setClubsError(null);

    try {
      const annRes = await fetchAnnouncements();
      if (annRes.success && Array.isArray(annRes.data) && annRes.data.length > 0) {
        setAnnouncements(annRes.data);
        if (annRes.lastFetched) {
          setAnnouncementsLastFetched(new Date(annRes.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        setAnnouncementsError('No live announcements available at this time.');
      }
    } catch {
      setAnnouncementsError('Failed to load announcements from backend.');
    } finally {
      setAnnouncementsLoading(false);
    }

    try {
      const evtRes = await fetchEvents();
      if (evtRes.success && Array.isArray(evtRes.data) && evtRes.data.length > 0) {
        setEvents(evtRes.data);
        if (evtRes.lastFetched) {
          setEventsLastFetched(new Date(evtRes.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        setEventsError('No live events available at this time.');
      }
    } catch {
      setEventsError('Failed to load events from backend.');
    } finally {
      setEventsLoading(false);
    }

    try {
      const clubRes = await fetchClubs();
      if (clubRes.success && Array.isArray(clubRes.data) && clubRes.data.length > 0) {
        setClubs(clubRes.data);
        if (clubRes.lastFetched) {
          setClubsLastFetched(new Date(clubRes.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        setClubsError('No live club data available at this time.');
      }
    } catch {
      setClubsError('Failed to load club data from backend.');
    } finally {
      setClubsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Clubs
  const filteredClubs = clubs.filter((c) => {
    const qNorm = clubSearch.trim().toLowerCase();
    const matchesSearch =
      !qNorm ||
      c.name.toLowerCase().includes(qNorm) ||
      (c.normalizedName && c.normalizedName.includes(qNorm)) ||
      c.category.toLowerCase().includes(qNorm) ||
      c.description.toLowerCase().includes(qNorm) ||
      (c.relatedChapters && c.relatedChapters.some(rc => rc.toLowerCase().includes(qNorm)));

    const matchesCategory =
      clubCategoryFilter === 'All' ||
      c.category.toLowerCase() === clubCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="sec-others" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 dark:border-white/10 relative overflow-hidden bg-[#F5F4EF] dark:bg-[#0E0F12]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Title & Subtitle */}
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] dark:text-[#F3F3EE] font-extrabold uppercase tracking-tighter leading-none">
              OTHERS.
            </h2>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#DC2626] font-extrabold uppercase tracking-tighter leading-none">
              UTILITIES & LIVE FEEDS.
            </h2>
          </div>
          <p className="font-mono text-xs sm:text-sm text-[#666660] dark:text-[#9CA3AF] max-w-2xl">
            Real-time announcements, events, and student organizations fetched directly from official MSRIT portals, paired with emergency contacts, quick links, and institutional references.
          </p>
        </div>

        {/* 8 Utility Cards Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start pt-4 border-t border-[#111111]/10 dark:border-white/10">
          
          {/* Card 1: 📢 Latest MSRIT News / Announcements */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex flex-col space-y-1.5 border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                  <Megaphone className="w-4 h-4 text-[#DC2626]" />
                  <span>LATEST MSRIT NEWS</span>
                </div>
                <button
                  onClick={loadData}
                  className="p-1 text-[#666660] hover:text-[#DC2626] dark:text-[#9CA3AF] transition-colors"
                  title="Refresh MSRIT Live Feeds"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 font-bold uppercase">
                  Live from MSRIT Official Website
                </span>
                {announcementsLastFetched && (
                  <span className="text-[#666660] dark:text-[#9CA3AF]">
                    Last updated: {announcementsLastFetched}
                  </span>
                )}
              </div>
            </div>

            {/* Content List / Loader / Error */}
            {announcementsLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[#666660] dark:text-[#9CA3AF]">
                <Loader2 className="w-6 h-6 animate-spin text-[#DC2626]" />
                <span className="text-[11px] uppercase tracking-wider">Fetching live MSRIT news...</span>
              </div>
            ) : announcementsError && announcements.length === 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] space-y-1">
                <div className="font-bold uppercase">UNABLE TO REACH MSRIT FEED</div>
                <p>{announcementsError}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((ann, idx) => (
                  <article
                    key={idx}
                    className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 bg-[#111111] dark:bg-white dark:text-[#111111] text-white font-bold uppercase text-[9px]">
                        OFFICIAL CIRCULAR
                      </span>
                      <span className="text-[#666660] dark:text-[#9CA3AF] font-bold">{ann.date}</span>
                    </div>

                    <h4 className="font-syne font-bold text-xs text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors leading-tight">
                      {ann.title}
                    </h4>

                    {ann.description && (
                      <p className="text-[11px] text-[#666660] dark:text-[#9CA3AF] line-clamp-2 leading-relaxed">
                        {ann.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between border-t border-[#111111]/5 dark:border-white/5">
                      <span className="text-[9px] text-[#888880] uppercase">Source: {ann.source}</span>
                      <a
                        href={ann.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#DC2626] hover:underline flex items-center gap-1 uppercase"
                      >
                        <span>READ MORE</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {announcements.length > 0 && (
              <button
                onClick={() => setShowAllAnnouncementsModal(true)}
                className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>VIEW ALL MSRIT ANNOUNCEMENTS ({announcements.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Card 2: 📅 Latest MSRIT Events */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex flex-col space-y-1.5 border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                  <Calendar className="w-4 h-4 text-[#DC2626]" />
                  <span>LATEST MSRIT EVENTS</span>
                </div>
                <button
                  onClick={loadData}
                  className="p-1 text-[#666660] hover:text-[#DC2626] dark:text-[#9CA3AF] transition-colors"
                  title="Refresh MSRIT Live Feeds"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 font-bold uppercase">
                  Live from MSRIT Official Website
                </span>
                {eventsLastFetched && (
                  <span className="text-[#666660] dark:text-[#9CA3AF]">
                    Last updated: {eventsLastFetched}
                  </span>
                )}
              </div>
            </div>

            {/* Content List / Loader / Error */}
            {eventsLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[#666660] dark:text-[#9CA3AF]">
                <Loader2 className="w-6 h-6 animate-spin text-[#DC2626]" />
                <span className="text-[11px] uppercase tracking-wider">Fetching live MSRIT events...</span>
              </div>
            ) : eventsError && events.length === 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] space-y-1">
                <div className="font-bold uppercase">UNABLE TO REACH MSRIT FEED</div>
                <p>{eventsError}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 4).map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#DC2626] font-bold uppercase">📍 {evt.location}</span>
                      <span className="text-[#111111] dark:text-[#F3F3EE] font-bold">{evt.date}</span>
                    </div>

                    <h4 className="font-syne font-bold text-xs text-[#111111] dark:text-[#F3F3EE] leading-tight">
                      {evt.title}
                    </h4>

                    {evt.startDate && (
                      <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                        Duration / Schedule: <strong className="text-[#111111] dark:text-[#F3F3EE]">{evt.startDate}</strong>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between border-t border-[#111111]/5 dark:border-white/5">
                      <span className="text-[9px] text-[#888880] uppercase">Source: {evt.source}</span>
                      <a
                        href={evt.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#DC2626] hover:underline flex items-center gap-1 uppercase"
                      >
                        <span>READ MORE</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {events.length > 0 && (
              <button
                onClick={() => setShowAllEventsModal(true)}
                className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>VIEW ALL MSRIT EVENTS ({events.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Card 3: 🆘 Emergency Contacts */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                <span>EMERGENCY CONTACTS</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                CAMPUS DIRECTORY
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  name: 'MSRIT Administration / Admissions',
                  detail: 'Main Campus Office',
                  phone: '080-23607902',
                  tel: 'tel:08023607902',
                  isVerifiedMsrit: true
                },
                {
                  name: 'Registrar Administration',
                  detail: 'Anti-Ragging Cell & Student Services',
                  phone: '080-23608445',
                  tel: 'tel:08023608445',
                  isVerifiedMsrit: true
                },
                {
                  name: 'Fire Emergency',
                  detail: 'Standard Emergency Service',
                  phone: '101',
                  tel: 'tel:101',
                  isStandardEmergency: true
                },
                {
                  name: 'Ambulance',
                  detail: 'Standard Emergency Service',
                  phone: '108',
                  tel: 'tel:108',
                  isStandardEmergency: true
                }
              ].map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#111111] dark:text-[#F3F3EE] text-[11px] uppercase">
                        {contact.name}
                      </span>
                      {contact.isVerifiedMsrit && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Verified Source
                        </span>
                      )}
                      {contact.isStandardEmergency && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          National Helpline
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                      {contact.detail}
                    </div>
                  </div>

                  <a
                    href={contact.tel}
                    className="px-2.5 py-1 bg-[#111111] dark:bg-[#DC2626] hover:bg-[#DC2626] text-white font-mono font-bold text-[11px] tracking-wider transition-colors inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
                    title={`Call ${contact.name}: ${contact.phone}`}
                  >
                    <span>📞 {contact.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: 🎯 Clubs & Student Activities (Full Row Card) */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-6 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all md:col-span-2 lg:col-span-3">
            
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3 gap-2">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs sm:text-sm font-syne">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
                <span>CLUBS & STUDENT ACTIVITIES</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 font-bold uppercase text-[10px]">
                  Verified MSRIT Club Directory
                </span>
                {clubsLastFetched && (
                  <span className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                    Total: {filteredClubs.length} Active Clubs
                  </span>
                )}
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    placeholder="Search clubs by name, category, or description (e.g., TNT, IEEE, Quiz Club, Robotics)..."
                    className="w-full bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/20 dark:border-white/20 pl-9 pr-3.5 py-2 text-xs text-[#111111] dark:text-[#F3F3EE] focus:outline-none focus:border-[#DC2626]"
                  />
                  {clubSearch && (
                    <button
                      onClick={() => setClubSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#DC2626]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    'All',
                    'Cultural & Performing Arts',
                    'Literary, Quizzing & Media',
                    'Technical & Co-Curricular Chapters'
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setClubCategoryFilter(cat)}
                      className={`px-3 py-1.5 border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        clubCategoryFilter === cat
                          ? 'bg-[#111111] dark:bg-white dark:text-[#111111] text-white border-[#DC2626]'
                          : 'bg-white dark:bg-white/5 border-[#111111]/15 dark:border-white/15 text-[#666660] dark:text-[#9CA3AF] hover:text-[#DC2626]'
                      }`}
                    >
                      {cat === 'All' ? 'ALL CLUBS' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category-Wise Clubs Display */}
            {clubsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#666660] dark:text-[#9CA3AF]">
                <Loader2 className="w-6 h-6 animate-spin text-[#DC2626]" />
                <span className="text-[11px] uppercase tracking-wider">Fetching MSRIT student organizations...</span>
              </div>
            ) : clubsError && filteredClubs.length === 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px]">
                {clubsError}
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="p-6 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 text-center text-xs text-[#666660] dark:text-[#9CA3AF]">
                No clubs found matching &quot;{clubSearch}&quot;. Try a different keyword or select &quot;ALL CLUBS&quot;.
              </div>
            ) : (
              <div className="space-y-8 pt-1">
                {(clubCategoryFilter === 'All'
                  ? [
                      'Cultural & Performing Arts',
                      'Literary, Quizzing & Media',
                      'Technical & Co-Curricular Chapters'
                    ]
                  : [clubCategoryFilter]
                ).map((catName) => {
                  const catClubs = filteredClubs.filter(
                    (c) => c.category.toLowerCase() === catName.toLowerCase()
                  );
                  if (catClubs.length === 0) return null;

                  return (
                    <div key={catName} className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-[#111111]/15 dark:border-white/15 pb-2">
                        <div className="font-syne font-extrabold text-sm sm:text-base uppercase tracking-tight text-[#111111] dark:text-[#F3F3EE] flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#DC2626]" />
                          <span>{catName}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#111111]/5 dark:bg-white/10 text-[10px] font-bold text-[#DC2626]">
                          {catClubs.length} {catClubs.length === 1 ? 'Club' : 'Clubs'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catClubs.map((club) => (
                          <div
                            key={club.id || club.name}
                            className="p-4 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] transition-all space-y-2 group shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 bg-[#111111] dark:bg-white dark:text-[#111111] text-white font-bold text-[9px] uppercase">
                                {club.category}
                              </span>
                            </div>

                            <h4 className="font-syne font-bold text-sm text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors leading-tight">
                              {club.name}
                            </h4>

                            <p className="text-[11px] text-[#666660] dark:text-[#9CA3AF] leading-relaxed">
                              {club.description}
                            </p>

                            {club.relatedChapters && club.relatedChapters.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1">
                                {club.relatedChapters.map((ch, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[9px] font-bold"
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal: View All Announcements List */}
      {showAllAnnouncementsModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1C24] border-2 border-[#111111] dark:border-white/20 max-w-3xl w-full p-6 space-y-4 font-mono text-xs shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#111111] dark:text-[#F3F3EE] uppercase font-syne">
                <Megaphone className="w-4 h-4 text-[#DC2626]" />
                <span>ALL LIVE MSRIT ANNOUNCEMENTS ({announcements.length})</span>
              </div>
              <button
                onClick={() => setShowAllAnnouncementsModal(false)}
                className="p-1 hover:bg-[#111111]/10 text-[#666660] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map((ann, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 bg-[#111111] dark:bg-white dark:text-[#111111] text-white font-bold uppercase text-[9px]">
                      OFFICIAL CIRCULAR
                    </span>
                    <span className="text-[#666660] dark:text-[#9CA3AF] font-bold">{ann.date}</span>
                  </div>
                  <h4 className="font-syne font-bold text-sm text-[#111111] dark:text-[#F3F3EE]">
                    {ann.title}
                  </h4>
                  {ann.description && (
                    <p className="text-xs text-[#666660] dark:text-[#9CA3AF] leading-relaxed">
                      {ann.description}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-[#111111]/5 dark:border-white/5">
                    <span className="text-[10px] text-[#888880]">Source: {ann.source}</span>
                    <a
                      href={ann.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#111111] dark:bg-[#DC2626] text-white text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <span>READ MORE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAllAnnouncementsModal(false)}
              className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-xs uppercase"
            >
              CLOSE ANNOUNCEMENTS INDEX
            </button>
          </div>
        </div>
      )}

      {/* Modal: View All Events List */}
      {showAllEventsModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1C24] border-2 border-[#111111] dark:border-white/20 max-w-3xl w-full p-6 space-y-4 font-mono text-xs shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#111111] dark:text-[#F3F3EE] uppercase font-syne">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span>ALL LIVE MSRIT EVENTS ({events.length})</span>
              </div>
              <button
                onClick={() => setShowAllEventsModal(false)}
                className="p-1 hover:bg-[#111111]/10 text-[#666660] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {events.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#DC2626] font-bold uppercase">📍 {evt.location}</span>
                    <span className="text-[#111111] dark:text-[#F3F3EE] font-bold">{evt.date}</span>
                  </div>
                  <h4 className="font-syne font-bold text-sm text-[#111111] dark:text-[#F3F3EE]">
                    {evt.title}
                  </h4>
                  {evt.startDate && (
                    <div className="text-xs text-[#666660] dark:text-[#9CA3AF]">
                      Duration / Schedule: <strong className="text-[#111111] dark:text-[#F3F3EE]">{evt.startDate}</strong>
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-[#111111]/5 dark:border-white/5">
                    <span className="text-[10px] text-[#888880]">Source: {evt.source}</span>
                    <a
                      href={evt.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#111111] dark:bg-[#DC2626] text-white text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <span>READ MORE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAllEventsModal(false)}
              className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-xs uppercase cursor-pointer"
            >
              CLOSE EVENTS INDEX
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
