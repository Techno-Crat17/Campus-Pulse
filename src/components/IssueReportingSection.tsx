import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ThumbsUp, CheckCircle2, MapPin, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_ISSUES, BUILDINGS_DATA } from '../data/campusData';
import type { CampusIssue } from '../data/campusData';
import { createIssue, fetchIssues } from '../services/api';

export const IssueReportingSection: React.FC = () => {
  const [issues, setIssues] = useState<CampusIssue[]>(INITIAL_ISSUES);
  const [issueType, setIssueType] = useState<CampusIssue['type']>('Projector');
  const [buildingId, setBuildingId] = useState<string>('ise-lab-2');
  const [locationDetails, setLocationDetails] = useState<string>('ISE Lab 2 - Room 204');
  const [description, setDescription] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const SAMPLE_PHOTOS = [
    { label: 'Projector', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600' },
    { label: 'AC Leak', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600' },
    { label: 'Equipment', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600' }
  ];

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!description.trim()) return;

    const payload = {
      category: issueType,
      title: `${issueType} Issue reported`,
      description: description.trim(),
      location: locationDetails || 'Campus Building',
      priority: 'Low',
      reportedBy: 'Campus Student',
      imageUrl: selectedPhoto || SAMPLE_PHOTOS[0].url
    };

    try {
      const saved = await createIssue(payload);
      const newIssue: CampusIssue = {
        id: saved.id || saved._id || ('iss-' + Date.now()),
        title: saved.title || `${issueType} Issue reported`,
        type: issueType,
        buildingId: buildingId,
        locationDetails: saved.location || locationDetails || 'Campus Building',
        description: saved.description || description,
        status: (saved.status?.toUpperCase() as any) || 'REPORTED',
        reportedAt: 'Just now',
        upvotes: saved.upvotes || 1,
        imageUrl: saved.imageUrl || selectedPhoto || SAMPLE_PHOTOS[0].url
      };

      setIssues((prev) => [newIssue, ...prev]);
      setSubmittedStatus(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        setSubmittedStatus(false);
        setDescription('');
      }, 4000);
    } catch (err: any) {
      console.error('[IssueReportingSection] Submit error:', err);
      setErrorMessage(err.message || 'Failed to report issue to backend server.');
    }
  };

  const handleUpvote = (id: string) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.id === id ? { ...iss, upvotes: iss.upvotes + 1 } : iss))
    );
  };

  const filteredIssues = issues.filter((iss) => {
    if (filterStatus === 'ALL') return true;
    return iss.status === filterStatus;
  });

  const getStatusStyle = (status: CampusIssue['status']) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-amber-500/20 border-amber-400 text-amber-300';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500/20 border-blue-400 text-blue-300';
      case 'IN PROGRESS':
        return 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse';
      case 'RESOLVED':
        return 'bg-emerald-500/20 border-emerald-400 text-emerald-400';
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-rose-400 uppercase tracking-widest px-3 py-1 border border-rose-500/20 bg-rose-950/20">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>COMMUNITY FACILITY REPORTING PROTOCOL</span>
        </div>
        <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
          SEE SOMETHING <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300">BROKEN?</span>
        </h2>
        <p className="text-slate-400 text-sm max-w-xl font-light">
          Report broken projectors, Wi-Fi outages, or AC leaks directly to campus facilities. Track real-time dispatch and resolution progress.
        </p>
      </div>

      {/* Main Grid: Form on Left, Community Tracker Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 6 Cols: Submission Form */}
        <div className="lg:col-span-6 glass-panel border-white/10 p-6 space-y-6">
          <h3 className="font-syne text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
            <span>SUBMIT FACILITY ISSUE REPORT</span>
            <span className="text-xs font-mono text-emerald-400">DISPATCH READY</span>
          </h3>

          {submittedStatus && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">ISSUE REPORTED SUCCESSFULLY</div>
                <div className="text-[11px] text-emerald-200">
                  Status set to REPORTED. Facilities engineering has been notified.
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-500/20 border border-rose-400 text-rose-300 font-mono text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold">REPORT SUBMISSION FAILED</div>
                <div className="text-[11px] text-rose-200">{errorMessage}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Issue Type */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                1. ISSUE CATEGORY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Projector', 'AC', 'Wi-Fi', 'Equipment', 'Lighting', 'Water Leakage'].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setIssueType(t as any)}
                    className={`p-2.5 font-mono text-xs border text-center transition-all ${
                      issueType === t
                        ? 'bg-rose-600/30 border-rose-400 text-rose-300 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Building Picker */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                2. LOCATION (BUILDING & ROOM)
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full bg-[#080d1e] border border-white/20 p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              >
                {BUILDINGS_DATA.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.floor})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Details */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                3. SPECIFIC PODIUM / ROOM DETAILS
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g. ISE Lab 2 Podium Desk #14"
                className="w-full bg-[#080d1e] border border-white/20 p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                4. DESCRIPTION & OBSERVATIONS
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe flickering lights, error codes, leaks, or broken switches..."
                className="w-full bg-[#080d1e] border border-white/20 p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Photo Selection / Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                <span>5. PHOTO EVIDENCE (OPTIONAL)</span>
                <span className="text-cyan-400">SELECT SAMPLE OR ATTACH</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PHOTOS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedPhoto(p.url)}
                    className={`p-2 border text-[10px] font-mono flex flex-col items-center gap-1 transition-all ${
                      selectedPhoto === p.url
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>{p.label} PHOTO</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>TRANSMIT ISSUE REPORT TO CAMPUS FACILITIES</span>
            </button>

          </form>

        </div>

        {/* Right 6 Cols: Live Status Tracker Feed */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-syne text-2xl font-bold text-white">
                LIVE ISSUE DISPATCH TRACKER
              </h3>
              <p className="text-xs font-mono text-slate-400">
                STATUS LIFECYCLE: REPORTED → ACKNOWLEDGED → IN PROGRESS → RESOLVED
              </p>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {['ALL', 'REPORTED', 'IN PROGRESS', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-1 border uppercase ${
                    filterStatus === st ? 'bg-blue-600 border-cyan-400 text-cyan-300' : 'border-white/10 text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Issues Stream */}
          <div className="space-y-4">
            {filteredIssues.map((iss) => (
              <motion.div
                key={iss.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5 border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2 py-0.5 border text-[10px] font-mono uppercase font-bold tracking-wider ${getStatusStyle(iss.status)}`}>
                      {iss.status}
                    </span>
                    <h4 className="font-syne text-lg font-bold text-white mt-1.5">
                      {iss.title}
                    </h4>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{iss.locationDetails}</span>
                      <span>•</span>
                      <span>{iss.reportedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpvote(iss.id)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{iss.upvotes} UPVOTES</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {iss.description}
                </p>

                {iss.imageUrl && (
                  <div className="w-full h-32 overflow-hidden border border-white/10 relative">
                    <img
                      src={iss.imageUrl}
                      alt={iss.title}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[9px] font-mono text-cyan-300 border border-cyan-400/40">
                      ATTACHED EVIDENCE PHOTO
                    </div>
                  </div>
                )}

                {/* Progress Status Bar Visualizer */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                  <div className={`p-1 border ${iss.status === 'REPORTED' ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold' : 'border-white/5 text-slate-500'}`}>
                    1. REPORTED
                  </div>
                  <div className={`p-1 border ${iss.status === 'ACKNOWLEDGED' ? 'border-blue-400 bg-blue-500/20 text-blue-300 font-bold' : 'border-white/5 text-slate-500'}`}>
                    2. ACKNOWLEDGED
                  </div>
                  <div className={`p-1 border ${iss.status === 'IN PROGRESS' ? 'border-purple-400 bg-purple-500/20 text-purple-300 font-bold' : 'border-white/5 text-slate-500'}`}>
                    3. IN PROGRESS
                  </div>
                  <div className={`p-1 border ${iss.status === 'RESOLVED' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 font-bold' : 'border-white/5 text-slate-500'}`}>
                    4. RESOLVED
                  </div>
                </div>

              </motion.div>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
};
