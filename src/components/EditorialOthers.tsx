import React, { useState } from 'react';
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
  Search
} from 'lucide-react';

interface EditorialOthersProps {
  onNavigateSection: (sectionId: string) => void;
}

interface Announcement {
  id: string;
  title: string;
  category: 'Academic' | 'Placement' | 'Maintenance' | 'Events' | 'General';
  date: string;
  summary: string;
  details: string;
}

interface CampusEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  category: string;
}

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Odd Semester Examination Timetable Published',
    category: 'Academic',
    date: '2026-09-28',
    summary: 'The preliminary examination timetable for 3rd and 5th semester B.E. programs has been released.',
    details: 'Students are advised to review the draft schedule published on the department notice board. Any overlapping paper requests must be submitted to the Controller of Examinations before Oct 5.'
  },
  {
    id: 'ann-2',
    title: 'Annual Campus Placement Drive — Phase I',
    category: 'Placement',
    date: '2026-09-25',
    summary: 'Eligible 7th semester students must complete portal registration for Tier-1 technology companies.',
    details: 'Registration closes on Friday at 17:00 IST. Ensure all CGPA records and resume details are updated on the placement portal.'
  },
  {
    id: 'ann-3',
    title: 'Scheduled Electrical Maintenance in ESB & LHC',
    category: 'Maintenance',
    date: '2026-09-22',
    summary: 'Brief power disruptions expected on Saturday between 06:00 AM and 09:00 AM for transformer servicing.',
    details: 'UPS backup power will remain active for critical server infrastructure. Lab activities will resume after 09:30 AM.'
  },
  {
    id: 'ann-4',
    title: 'Inter-College Technical Symposium "KLAUT 2026"',
    category: 'Events',
    date: '2026-09-20',
    summary: 'Registrations are open for the annual hackathon and robotics competition hosted by IEEE Student Branch.',
    details: 'Prizes worth ₹1,50,000 to be awarded across 6 tracks including AI/ML, Embedded Systems, and Web 3.0.'
  }
];

const DEMO_EVENTS: CampusEvent[] = [
  {
    id: 'evt-1',
    name: 'HackAI 2026 24-Hour Hackathon',
    date: 'Oct 12, 2026',
    time: '09:00 AM IST',
    venue: 'Apex Block Auditorium',
    category: 'Hackathon'
  },
  {
    id: 'evt-2',
    name: 'Guest Lecture: Advanced Autonomous Systems',
    date: 'Oct 16, 2026',
    time: '02:00 PM IST',
    venue: 'LHC Seminar Hall 2',
    category: 'Academic'
  },
  {
    id: 'evt-3',
    name: 'Ramaiah Annual Sports Meet',
    date: 'Nov 04, 2026',
    time: '08:30 AM IST',
    venue: 'Campus Main Sports Ground',
    category: 'Sports'
  }
];

export const EditorialOthers: React.FC<EditorialOthersProps> = ({ onNavigateSection }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAllAnnouncementsModal, setShowAllAnnouncementsModal] = useState<boolean>(false);

  return (
    <section id="sec-others" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 dark:border-white/10 relative overflow-hidden bg-[#F5F4EF] dark:bg-[#0E0F12]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header Breadcrumb */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>SECTION 08 // CAMPUS UTILITIES & RESOURCES</span>
          <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] bg-white dark:bg-[#1A1C24] px-3 py-1 border border-[#111111]/15 dark:border-white/15 text-[11px] self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>EXTENDED OPERATING LAYER</span>
          </div>
        </div>

        {/* Section Title & Subtitle */}
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] dark:text-[#F3F3EE] font-extrabold uppercase tracking-tighter leading-none">
              OTHERS.
            </h2>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#DC2626] font-extrabold uppercase tracking-tighter leading-none">
              UTILITIES & LINKS.
            </h2>
          </div>
          <p className="font-mono text-xs sm:text-sm text-[#666660] dark:text-[#9CA3AF] max-w-2xl">
            Centralized portal for campus announcements, upcoming events, emergency contact information, quick links, and institutional references.
          </p>
        </div>

        {/* 7 Utility Cards Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start pt-4 border-t border-[#111111]/10 dark:border-white/10">
          
          {/* Card 1: 📢 Campus Announcements */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <Megaphone className="w-4 h-4 text-[#DC2626]" />
                <span>ANNOUNCEMENTS</span>
              </div>
              <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 text-[10px] font-bold uppercase">
                DEMO / SAMPLE
              </span>
            </div>

            <div className="space-y-3">
              {DEMO_ANNOUNCEMENTS.slice(0, 3).map((ann) => (
                <article
                  key={ann.id}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 hover:border-[#DC2626] cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-1.5 py-0.5 bg-[#111111] dark:bg-[#0E0F12] text-white font-bold uppercase text-[9px]">
                      {ann.category}
                    </span>
                    <span className="text-[#666660] dark:text-[#9CA3AF]">{ann.date}</span>
                  </div>
                  <h4 className="font-syne font-bold text-xs text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors leading-tight">
                    {ann.title}
                  </h4>
                  <p className="text-[11px] text-[#666660] dark:text-[#9CA3AF] line-clamp-2">
                    {ann.summary}
                  </p>
                </article>
              ))}
            </div>

            <button
              onClick={() => setShowAllAnnouncementsModal(true)}
              className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>VIEW ALL ANNOUNCEMENTS ({DEMO_ANNOUNCEMENTS.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: 📅 Campus Events */}
          <div className="p-6 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 space-y-4 font-mono text-xs shadow-2xs hover:border-[#DC2626] transition-all">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#111111] dark:text-[#F3F3EE] font-bold uppercase text-xs">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span>UPCOMING EVENTS</span>
              </div>
              <span className="px-2 py-0.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 text-[10px] font-bold uppercase">
                DEMO / SAMPLE
              </span>
            </div>

            <div className="space-y-3">
              {DEMO_EVENTS.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#DC2626] font-bold uppercase">{evt.category}</span>
                    <span className="text-[#666660] dark:text-[#9CA3AF]">{evt.date}</span>
                  </div>
                  <h4 className="font-syne font-bold text-xs text-[#111111] dark:text-[#F3F3EE]">
                    {evt.name}
                  </h4>
                  <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF] flex flex-wrap gap-2 pt-1 border-t border-[#111111]/5 dark:border-white/5">
                    <span>🕒 {evt.time}</span>
                    <span>📍 {evt.venue}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#888880] italic">
              Notice: Listed events are sample demonstration entries. Official schedules are published on college notice boards.
            </p>
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
                { name: 'Campus Security', detail: 'Main Gate Desk' },
                { name: 'Medical Centre', detail: 'Campus Infirmary' },
                { name: 'Fire Emergency', detail: 'Control Desk' },
                { name: 'Ambulance', detail: 'Campus Emergency Unit' },
                { name: 'Administration', detail: 'Registrar Office' }
              ].map((contact, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#111111] dark:text-[#F3F3EE] text-[11px] uppercase">
                      {contact.name}
                    </div>
                    <div className="text-[10px] text-[#666660] dark:text-[#9CA3AF]">
                      {contact.detail}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#888880] bg-white dark:bg-[#0E0F12] px-2 py-1 border border-[#111111]/10 dark:border-white/10">
                    Contact number unavailable
                  </span>
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

      {/* Modal: View Selected Announcement Details */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1C24] border-2 border-[#111111] dark:border-white/20 max-w-lg w-full p-6 space-y-4 font-mono text-xs shadow-2xl relative animate-in fade-in">
            <div className="flex items-start justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3 gap-2">
              <div>
                <span className="px-2 py-0.5 bg-[#111111] dark:bg-white dark:text-[#111111] text-white font-bold uppercase text-[10px]">
                  {selectedAnnouncement.category}
                </span>
                <span className="ml-2 text-[10px] text-[#666660] dark:text-[#9CA3AF]">{selectedAnnouncement.date}</span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 hover:bg-[#111111]/10 text-[#666660] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-syne font-extrabold text-lg text-[#111111] dark:text-[#F3F3EE] uppercase leading-tight">
              {selectedAnnouncement.title}
            </h3>

            <p className="text-[#111111] dark:text-[#F3F3EE] leading-relaxed border-t border-b border-[#111111]/5 dark:border-white/5 py-3">
              {selectedAnnouncement.details}
            </p>

            <div className="text-[10px] text-[#DC2626] font-bold uppercase">
              DEMO / SAMPLE ANNOUNCEMENT ENTRY
            </div>

            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="w-full py-2.5 bg-[#111111] dark:bg-[#0E0F12] hover:bg-[#DC2626] text-white font-bold text-xs uppercase"
            >
              CLOSE NOTICE
            </button>
          </div>
        </div>
      )}

      {/* Modal: View All Announcements List */}
      {showAllAnnouncementsModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1C24] border-2 border-[#111111] dark:border-white/20 max-w-2xl w-full p-6 space-y-4 font-mono text-xs shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#111111] dark:text-[#F3F3EE] uppercase font-syne">
                <Megaphone className="w-4 h-4 text-[#DC2626]" />
                <span>ALL CAMPUS ANNOUNCEMENTS ({DEMO_ANNOUNCEMENTS.length})</span>
              </div>
              <button
                onClick={() => setShowAllAnnouncementsModal(false)}
                className="p-1 hover:bg-[#111111]/10 text-[#666660] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {DEMO_ANNOUNCEMENTS.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 bg-[#F5F4EF]/70 dark:bg-white/5 border border-[#111111]/10 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 bg-[#111111] dark:bg-white dark:text-[#111111] text-white font-bold uppercase text-[9px]">
                      {ann.category}
                    </span>
                    <span className="text-[#666660] dark:text-[#9CA3AF]">{ann.date}</span>
                  </div>
                  <h4 className="font-syne font-bold text-sm text-[#111111] dark:text-[#F3F3EE]">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-[#666660] dark:text-[#9CA3AF] leading-relaxed">
                    {ann.details}
                  </p>
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

    </section>
  );
};
