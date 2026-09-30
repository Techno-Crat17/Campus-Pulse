import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  Clock,
  MapPin,
  X,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ISSUE_CATEGORIES,
  getStoredIssueReports,
  saveIssueReport
} from '../data/issueReportsData';
import type {
  IssueCategory,
  IssueReport
} from '../data/issueReportsData';
import { createIssue, fetchIssues } from '../services/api';
import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers';

export const EditorialIssues: React.FC = () => {
  const [issues, setIssues] = useState<IssueReport[]>(() => getStoredIssueReports());
  
  // Form fields: strictly Category, Title, Location, Description, Optional Photo
  const [category, setCategory] = useState<IssueCategory>('Infrastructure');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status & Feedback
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize issues from backend or storage
  useEffect(() => {
    async function loadIssues() {
      try {
        const remoteIssues = await fetchIssues();
        if (Array.isArray(remoteIssues) && remoteIssues.length > 0) {
          const mapped: IssueReport[] = remoteIssues.map((item: any) => ({
            id: item.id || item._id,
            title: item.title,
            category: item.category,
            description: item.description,
            location: item.location,
            priority: item.priority || 'Medium',
            status: item.status || 'Reported',
            reportedBy: item.reportedBy || 'Anonymous',
            dateTime: item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) : '2026-09-29 12:00',
            imageUrl: item.imageUrl || undefined,
            isDemo: item.isDemo || false
          }));
          setIssues(mapped);
          return;
        }
      } catch (err) {
        console.warn('[EditorialIssues] Failed to fetch remote issues:', err);
      }
      setIssues(getStoredIssueReports());
    }

    loadIssues();

    const handleUpdate = () => {
      loadIssues();
    };
    window.addEventListener('campus_pulse_issues_updated', handleUpdate);
    return () => window.removeEventListener('campus_pulse_issues_updated', handleUpdate);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter an issue title.');
      return;
    }

    if (!location.trim()) {
      setErrorMsg('Please specify the campus location.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please describe the issue in detail.');
      return;
    }

    const reporterName = reportedBy.trim() || 'Anonymous';
    if (isBlockedUser(reportedBy) || isBlockedUser(reporterName)) {
      setErrorMsg(BLOCKED_USER_ERROR_MESSAGE);
      return;
    }

    const payload = {
      category,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      priority: 'Medium',
      reportedBy: reporterName,
      imageUrl: imagePreview || undefined
    };

    try {
      const savedIssue = await createIssue(payload);

      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newIssue: IssueReport = {
        id: savedIssue.id || savedIssue._id || ('iss-' + Date.now()),
        title: savedIssue.title || title.trim(),
        category: savedIssue.category || category,
        description: savedIssue.description || description.trim(),
        location: savedIssue.location || location.trim(),
        priority: savedIssue.priority || 'Medium',
        status: savedIssue.status || 'Reported',
        reportedBy: savedIssue.reportedBy || 'Anonymous',
        dateTime: formattedDate,
        imageUrl: savedIssue.imageUrl || imagePreview || undefined,
        isDemo: false
      };

      const updated = saveIssueReport(newIssue);
      setIssues(updated);
      setSubmitted(true);

      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch {
        // Confetti fallback
      }

      // Reset form fields
      setTitle('');
      setDescription('');
      setLocation('');
      setReportedBy('');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setSubmitted(false);
      }, 4500);
    } catch (err: any) {
      console.error('[EditorialIssues] Submit error:', err);
      setErrorMsg(err.message || 'Failed to submit issue report. Please check server connection.');
    }
  };

  const getStatusBadgeClass = (s: IssueReport['status']) => {
    switch (s) {
      case 'Reported':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <section id="sec-report" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Title & Subtitle */}
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#111111] font-extrabold uppercase tracking-tighter leading-none">
              REPORT
            </h2>
            <h2 className="text-4xl sm:text-6xl font-syne text-[#DC2626] font-extrabold uppercase tracking-tighter leading-none">
              AN ISSUE.
            </h2>
          </div>
          <p className="font-mono text-xs sm:text-sm text-[#666660] max-w-2xl">
            Help improve the campus by anonymously reporting issues that need attention.
          </p>
        </div>

        {/* Reporting Grid: Form (Left) & Issue Reports Stream (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4 border-t border-[#111111]/10 items-start">
          
          {/* Left 6 Cols: Issue Reporting Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="border-b border-[#111111]/10 pb-3 flex items-center justify-between font-mono text-xs">
              <span className="text-[#666660] uppercase tracking-widest font-bold">SUBMISSION INTERFACE</span>
              <span className="text-[#DC2626] font-bold uppercase">LIVE DISPATCH</span>
            </div>

            {/* Success Confirmation Toast */}
            {submitted && (
              <div
                role="alert"
                className="p-4 border-2 border-[#16A34A] bg-emerald-50 text-emerald-900 font-mono text-xs flex items-center gap-3 shadow-xs animate-in fade-in"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-800 text-sm">Issue reported successfully.</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Your report has been logged and published anonymously to the dispatch queue.
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div
                role="alert"
                className="p-3 border border-rose-300 bg-rose-50 text-rose-800 font-mono text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs" noValidate>
              
              {/* Category Selection */}
              <div className="space-y-2">
                <label htmlFor="issue-category-select" className="text-[#666660] uppercase tracking-widest font-bold block">
                  1. ISSUE CATEGORY *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ISSUE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 border text-left transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-[#111111] border-[#DC2626] text-white font-bold shadow-2xs'
                          : 'bg-white border-[#111111]/15 text-[#666660] hover:text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      <span className="block truncate">{cat.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="issue-title-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                  2. ISSUE TITLE *
                </label>
                <input
                  id="issue-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.G. FLICKERING OVERHEAD TUBE LIGHT, AC LEAK, ETC."
                  className="w-full bg-white border border-[#111111]/25 px-3.5 py-2.5 text-base sm:text-sm text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-bold"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label htmlFor="issue-location-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                  3. LOCATION *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="issue-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.G. LHC BLOCK, ROOM 204 OR ESB 2ND FLOOR"
                    className="w-full bg-white border border-[#111111]/25 pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="issue-description-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                  4. DESCRIPTION *
                </label>
                <textarea
                  id="issue-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="PROVIDE HELPFUL DETAILS REGARDING THE ISSUE..."
                  className="w-full bg-white border border-[#111111]/25 px-3.5 py-2.5 text-base sm:text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs leading-relaxed"
                  required
                />
              </div>

              {/* Reporter Name / Student ID */}
              <div className="space-y-1.5">
                <label htmlFor="issue-reporter-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                  5. YOUR NAME / STUDENT ID (OPTIONAL)
                </label>
                <input
                  id="issue-reporter-input"
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="LEAVE BLANK FOR ANONYMOUS DISPATCH"
                  className="w-full bg-white border border-[#111111]/25 px-3.5 py-2.5 text-base sm:text-sm text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-bold"
                />
              </div>

              {/* Optional Photo/Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[#666660] uppercase tracking-widest font-bold block">
                  6. OPTIONAL PHOTO / ATTACHMENT
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="issue-image-upload"
                />

                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 border border-dashed border-[#111111]/30 bg-white hover:border-[#DC2626] text-[#666660] hover:text-[#111111] flex items-center justify-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4 text-[#DC2626]" />
                    <span>UPLOAD PHOTO (OPTIONAL, MAX 5MB)</span>
                  </button>
                ) : (
                  <div className="relative border border-[#111111]/20 bg-white p-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Issue Preview"
                        className="w-12 h-12 object-cover border border-[#111111]/15"
                      />
                      <span className="text-[11px] text-[#111111] font-bold truncate">PHOTO ATTACHED</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-1 hover:bg-gray-100 text-[#888] hover:text-[#DC2626]"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4 text-red-300" />
                <span>SUBMIT ISSUE REPORT NOW →</span>
              </button>
            </form>
          </div>

          {/* Right 6 Cols: Issue Reports List / Lifecycle Stream */}
          <div className="lg:col-span-6 space-y-6">
            <div className="border-b border-[#111111]/10 pb-3 flex items-center justify-between font-mono text-xs">
              <span className="text-[#666660] uppercase tracking-widest font-bold">
                ISSUE REPORTS LIST ({issues.length})
              </span>
              <span className="text-[#DC2626] font-bold uppercase">DISPATCH QUEUE</span>
            </div>

            <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
              {issues.length === 0 ? (
                <div className="p-8 border border-dashed border-[#111111]/20 bg-white text-center text-[#666660] font-mono text-xs">
                  No issues currently reported.
                </div>
              ) : (
                issues.map((iss) => (
                  <article
                    key={iss.id}
                    className="p-4 bg-white border border-[#111111]/15 space-y-3 font-mono text-xs shadow-2xs hover:border-[#111111] transition-all"
                  >
                    {/* Header Row: Category, Anonymous Tag, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#111111]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#111111] text-white font-bold text-[10px] uppercase">
                          {iss.category}
                        </span>
                        <span className="px-1.5 py-0.5 border border-[#111111]/15 bg-[#F5F4EF] text-[#666660] text-[9px] font-bold uppercase">
                          ANONYMOUS
                        </span>
                      </div>
                      <div className="text-[10px] text-[#666660] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{iss.dateTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-syne text-lg font-bold text-[#111111] uppercase leading-tight">
                      {iss.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[#666660] text-xs leading-relaxed">
                      {iss.description}
                    </p>

                    {/* Attached Photo if available */}
                    {iss.imageUrl && (
                      <div className="pt-1">
                        <img
                          src={iss.imageUrl}
                          alt={`Report: ${iss.title}`}
                          className="max-h-40 rounded-xs border border-[#111111]/15 object-cover"
                        />
                      </div>
                    )}

                    {/* Location & Status Row */}
                    <div className="pt-2 border-t border-[#111111]/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#111111]">
                        <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        <span>{iss.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#888880] uppercase text-[10px]">STATUS:</span>
                        <span className={`px-2 py-0.5 border font-bold uppercase text-[10px] ${getStatusBadgeClass(iss.status)}`}>
                          ● {iss.status}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
