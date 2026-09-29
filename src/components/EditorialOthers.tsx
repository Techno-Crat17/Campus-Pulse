import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  ShieldAlert,
  Star,
  ExternalLink,
  Info,
  Smartphone,
  ChevronRight,
  X,
  Building2,
  BookOpen,
  MapPin,
  AlertTriangle,
  Users,
  Search,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchAnnouncements, fetchEvents } from '../services/api';

interface EditorialOthersProps {
  onNavigateSection: (sectionId: string) => void;
}

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

export const EditorialOthers: React.FC<EditorialOthersProps> = ({ onNavigateSection }) => {
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

  // Modals
  const [showAllAnnouncementsModal, setShowAllAnnouncementsModal] = useState<boolean>(false);
  const [showAllEventsModal, setShowAllEventsModal] = useState<boolean>(false);

  // Load News & Events from backend
  const loadData = async () => {
    setAnnouncementsLoading(true);
    setEventsLoading(true);
    setAnnouncementsError(null);
    setEventsError(null);

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
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section id="sec-others" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 dark:border-white/10 relative overflow-hidden bg-[#F5F4EF] dark:bg-[#0E0F12]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header Breadcrumb */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>SECTION 08 // CAMPUS UTILITIES & RESOURCES</span>
          <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] bg-white dark:bg-[#1A1C24] px-3 py-1 border border-[#111111]/15 dark:border-white/15 text-[11px] self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>LIVE MSRIT DATA DISPATCH</span>
          </div>
        </div>

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
            Real-time announcements and events fetched directly from the official MSRIT portal, paired with emergency contacts, quick links, and institutional references.
          </p>
        </div>

        {/* 7 Utility Cards Grid Layout */}
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
                },
                {
                  name: 'Campus Security',
                  detail: 'Main Gate Control Desk',
                  phone: null
                },
                {
                  name: 'Medical Centre',
                  detail: 'Campus Infirmary',
                  phone: null
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

                  {contact.phone ? (
                    <a
                      href={contact.tel}
                      className="px-2.5 py-1 bg-[#111111] dark:bg-[#DC2626] hover:bg-[#DC2626] text-white font-mono font-bold text-[11px] tracking-wider transition-colors inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      title={`Call ${contact.name}: ${contact.phone}`}
                    >
                      <span>📞 {contact.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-[#888880] bg-white dark:bg-[#0E0F12] px-2 py-1 border border-[#111111]/10 dark:border-white/10 shrink-0 self-start sm:self-auto">
                      Number unavailable
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-300">
              ⚠️ In case of life-threatening emergencies, visit the nearest security control desk or department office immediately.
            </div>
          </div>

          {/* Card 4: ⭐ Quick Access */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <Star className="w-4 h-4 text-[#DC2626]" />
                <span>QUICK ACCESS</span>
              </div>
              <span className="text-[10px] text-[#DC2626] font-bold uppercase">NAVIGATION</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'FACULTY', icon: Users, id: 'sec-faculty' },
                { label: 'LIBRARIES', icon: BookOpen, id: 'sec-find' },
                { label: 'BUILDINGS', icon: Building2, id: 'sec-map' },
                { label: 'ROOMS', icon: Search, id: 'sec-find' },
                { label: 'CAMPUS MAP', icon: MapPin, id: 'sec-map' },
                { label: 'REPORT ISSUE', icon: AlertTriangle, id: 'sec-report' },
                { label: 'ASK CAMPUS AI', icon: Info, id: 'sec-ask' }
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigateSection(item.id)}
                    className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] hover:bg-[#111111] hover:text-white dark:hover:bg-[#DC2626] transition-all text-left group flex flex-col justify-between space-y-2 cursor-pointer"
                  >
                    <IconComponent className="w-4 h-4 text-[#DC2626] group-hover:text-white transition-colors" />
                    <span className="font-bold text-[10px] tracking-wider">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 5: 🔗 Useful Links */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <ExternalLink className="w-4 h-4 text-[#DC2626]" />
                <span>USEFUL LINKS</span>
              </div>
              <span className="text-[10px] text-[#666660] dark:text-[#9CA3AF] uppercase">EXTERNAL & INTERNAL</span>
            </div>

            <div className="space-y-2">
              <a
                href="https://www.msrit.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] flex items-center justify-between transition-all group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors text-xs">
                    MSRIT OFFICIAL WEBSITE
                  </div>
                  <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                    www.msrit.edu
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#666660] group-hover:text-[#DC2626] shrink-0" />
              </a>

              <button
                onClick={() => onNavigateSection('sec-map')}
                className="w-full p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors text-xs">
                    INTERACTIVE CAMPUS MAP
                  </div>
                  <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                    Geographic Building Explorer
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#666660] group-hover:text-[#DC2626] shrink-0" />
              </button>

              <button
                onClick={() => onNavigateSection('sec-ask')}
                className="w-full p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors text-xs">
                    ASK CAMPUS AI
                  </div>
                  <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                    Real-time Telemetry Intelligence
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#666660] group-hover:text-[#DC2626] shrink-0" />
              </button>

              <button
                onClick={() => onNavigateSection('sec-report')}
                className="w-full p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors text-xs">
                    REPORT AN ISSUE
                  </div>
                  <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                    Anonymous Dispatch Queue
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#666660] group-hover:text-[#DC2626] shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 6: ℹ️ Campus Information */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <Building2 className="w-4 h-4 text-[#DC2626]" />
                <span>CAMPUS INFORMATION</span>
              </div>
              <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-bold uppercase">
                VERIFIED
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF] uppercase">INSTITUTION</div>
                <div className="font-syne font-bold text-base text-[#111111] dark:text-[#F3F3EE]">
                  Ramaiah Institute of Technology
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF] uppercase">LOCATION</div>
                <div className="font-bold text-xs text-[#111111] dark:text-[#F3F3EE]">
                  MSR Nagar, MSRIT Post, Mathikere<br />
                  Bengaluru, Karnataka 560054
                </div>
              </div>

              <div className="pt-2 border-t border-[#111111]/10 dark:border-white/10 space-y-1 text-[11px] text-[#666660] dark:text-[#9CA3AF]">
                <div>MONITORED BUILDINGS: <strong className="text-[#111111] dark:text-[#F3F3EE]">8 Verified Blocks</strong></div>
                <div>LIBRARIES MONITORED: <strong className="text-[#111111] dark:text-[#F3F3EE]">3 Libraries</strong></div>
                <div>DYNAMIC ROOMS: <strong className="text-[#111111] dark:text-[#F3F3EE]">51 Study Rooms</strong></div>
                <div>FACULTY DIRECTORY: <strong className="text-[#111111] dark:text-[#F3F3EE]">409 Verified Roster</strong></div>
              </div>
            </div>
          </div>

          {/* Card 7: 📱 PWA & Web App Status */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all md:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3 gap-2">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <Smartphone className="w-4 h-4 text-[#DC2626]" />
                <span>WEB APPLICATION & ACCESSIBILITY STATUS</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase self-start sm:self-auto">
                ONLINE OPERATIONAL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-1">
                <div className="font-bold text-[#111111] dark:text-[#F3F3EE] uppercase text-[11px]">OPTIMIZED FOR MOBILE</div>
                <p className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                  Fully responsive UI layout for smartphones, tablets, and desktop displays.
                </p>
              </div>

              <div className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-1">
                <div className="font-bold text-[#111111] dark:text-[#F3F3EE] uppercase text-[11px]">HOME SCREEN SHORTCUT</div>
                <p className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                  Add Campus Pulse to your mobile home screen via your browser menu ("Add to Home Screen").
                </p>
              </div>

              <div className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-1">
                <div className="font-bold text-[#111111] dark:text-[#F3F3EE] uppercase text-[11px]">DARK & LIGHT THEMES</div>
                <p className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                  Includes high-contrast theme toggle for daylight and nighttime visibility.
                </p>
              </div>
            </div>
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
              className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-xs uppercase"
            >
              CLOSE EVENTS INDEX
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
