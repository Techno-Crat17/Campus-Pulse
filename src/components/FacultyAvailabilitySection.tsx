import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Search, Mail } from 'lucide-react';
import { FACULTY_DATA } from '../data/campusData';
import type { Faculty } from '../data/campusData';

interface FacultyAvailabilitySectionProps {}

export const FacultyAvailabilitySection: React.FC<FacultyAvailabilitySectionProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const departments = ['ALL', 'Information Science & Eng.', 'Computer Science', 'Electronics & Comm.', 'Data Science & AI', 'Cyber Security'];

  const filteredFaculty = FACULTY_DATA.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.expertise.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || fac.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const getStatusBadgeStyle = (status: Faculty['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      case 'IN CLASS':
        return 'bg-blue-500/20 border-blue-400 text-blue-300';
      case 'IN MEETING':
        return 'bg-amber-500/20 border-amber-400 text-amber-300';
      case 'OFF-CAMPUS':
        return 'bg-slate-500/20 border-slate-400 text-slate-400';
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-widest px-3 py-1 border border-blue-500/20 bg-blue-950/20 mb-3">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>REAL-TIME FACULTY OFFICE HOURS & TELEMETRY</span>
          </div>
          <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
            FIND YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">FACULTY.</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mt-2 font-light">
            Locate professors, verify live office desk check-ins, view consultation hours, and generate turn-by-turn directions directly to their office rooms.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[300px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Dr. XYZ, CS, B-204..."
            className="w-full bg-[#080d1e] border border-white/20 pl-11 pr-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-4 py-2 uppercase border transition-all ${
              selectedDept === dept
                ? 'bg-blue-600 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,102,255,0.3)] font-bold'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((fac) => (
          <motion.div
            key={fac.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 border-white/10 hover:border-cyan-400/50 transition-all group space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              
              {/* Header Profile Photo & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 border border-cyan-400/40 overflow-hidden shrink-0">
                    <img
                      src={fac.avatar}
                      alt={fac.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h3 className="font-syne text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {fac.name}
                    </h3>
                    <div className="text-xs font-mono text-cyan-400">
                      {fac.department}
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${getStatusBadgeStyle(fac.status)}`}>
                  {fac.status}
                </span>
              </div>

              {/* Office Location Box */}
              <div className="p-3 bg-black/40 border border-white/10 font-mono text-xs space-y-1">
                <div className="text-slate-400 flex justify-between">
                  <span>OFFICE ROOM:</span>
                  <span className="text-white font-bold">{fac.room} (Faculty Block B)</span>
                </div>

                {fac.availableUntil && (
                  <div className="text-emerald-400 font-bold flex justify-between">
                    <span>AVAILABLE UNTIL:</span>
                    <span>{fac.availableUntil}</span>
                  </div>
                )}

                {fac.nextFreeTime && (
                  <div className="text-amber-300 flex justify-between">
                    <span>NEXT FREE AT:</span>
                    <span>{fac.nextFreeTime}</span>
                  </div>
                )}

                <div className="text-slate-400 flex justify-between pt-1 border-t border-white/10 text-[11px]">
                  <span>OFFICE HOURS:</span>
                  <span className="text-slate-200">{fac.officeHours}</span>
                </div>
              </div>

              {/* Expertise */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  EXPERTISE & RESEARCH
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {fac.expertise}
                </p>
              </div>

            </div>

            {/* Directions CTA */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={`mailto:${fac.email}`}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>EMAIL</span>
              </a>
            </div>

          </motion.div>
        ))}
      </div>

    </section>
  );
};
