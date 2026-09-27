import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Tag, ShieldCheck, X, Eye, HelpCircle, Clock, Bell } from 'lucide-react';
import { SAMPLE_LOST_FOUND_ITEMS } from '../data/lostFoundData';
import type { LostFoundItem } from '../data/lostFoundData';
import { LOST_AND_FOUND_ENABLED } from '../config/features';

export const EditorialLostFound: React.FC = () => {
  const [items] = useState<LostFoundItem[]>(SAMPLE_LOST_FOUND_ITEMS);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => setToastNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  const handleDisabledInteraction = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setToastNotice('Lost & Found is coming soon');
  };

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      item.itemName.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <section id="sec-lostfound" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      {/* Toast Notification */}
      {toastNotice && (
        <div 
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-12 z-[9999] max-w-sm bg-[#111111] text-[#F5F4EF] border border-[#DC2626] p-4 shadow-2xl flex items-center gap-3 font-mono"
        >
          <div className="p-1.5 bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#DC2626] shrink-0">
            <Bell className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-[#DC2626] font-bold tracking-widest uppercase">
              CAMPUS PULSE // NOTICE
            </div>
            <div className="text-xs font-semibold text-white">
              {toastNotice}
            </div>
          </div>
          <button 
            onClick={() => setToastNotice(null)} 
            className="text-[#888880] hover:text-white transition-colors p-1"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#111111]/10 pb-8 gap-6">
          <div>
            <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold mb-3 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-[#DC2626]" />
              <span>SECTION 08B // COMMUNITY LOST &amp; FOUND DISPATCH</span>
              {!LOST_AND_FOUND_ENABLED && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
                  Coming Soon
                </span>
              )}
            </div>
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              LOST &amp;
            </h2>
            <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
              FOUND
            </h2>
            <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
              TELEMETRY.
            </h2>
          </div>

          <div className="font-mono text-xs text-[#666660] md:text-right space-y-1">
            {!LOST_AND_FOUND_ENABLED ? (
              <div className="inline-flex items-center gap-2 text-[#DC2626] font-bold uppercase tracking-wider bg-[#DC2626]/10 px-3 py-1 border border-[#DC2626]/20">
                <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>COMING SOON • TEMPORARILY UNAVAILABLE</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-[#DC2626] font-bold uppercase tracking-wider bg-[#DC2626]/10 px-3 py-1 border border-[#DC2626]/20">
                <HelpCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>DEMO / SAMPLE RECORDS</span>
              </div>
            )}
            <div className="text-[11px] text-[#111111] pt-1">
              MODEL: PEER RECOVERY &amp; CAMPUS SECURITY DESK DEPOSITS
            </div>
            <div className="text-[10px] text-[#888880]">
              {!LOST_AND_FOUND_ENABLED 
                ? 'NOTICE: FEATURE CURRENTLY UNAVAILABLE • COMING SOON' 
                : 'NOTICE: SAMPLE DEMO RECORDS FOR INTERACTIVE TESTING'}
            </div>
          </div>
        </div>

        {!LOST_AND_FOUND_ENABLED ? (
          /* Coming Soon Display Card */
          <div 
            onClick={() => handleDisabledInteraction()}
            className="border-2 border-dashed border-[#111111]/20 bg-white/50 hover:bg-white/80 transition-all p-5 sm:p-10 lg:p-14 relative cursor-pointer group shadow-xs hover:border-[#DC2626]/60"
          >
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest bg-[#DC2626] text-white flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>COMING SOON</span>
                </div>
                <span className="font-mono text-xs text-[#888880] uppercase tracking-wider">
                  // TEMPORARILY UNAVAILABLE
                </span>
              </div>

              <div className="space-y-3 font-mono">
                <h3 className="font-syne text-3xl sm:text-4xl font-extrabold text-[#111111] uppercase tracking-tight group-hover:text-[#DC2626] transition-colors">
                  LOST &amp; FOUND IS COMING SOON
                </h3>
                <p className="text-sm text-[#666660] leading-relaxed max-w-2xl font-mono">
                  The community Lost &amp; Found registry and peer recovery telemetry are temporarily offline for maintenance and platform upgrades. All item catalogs and security records remain safely archived in the system.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4 font-mono text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisabledInteraction(e);
                  }}
                  className="px-6 py-3 bg-[#111111] text-white hover:bg-[#DC2626] transition-colors font-bold uppercase tracking-wider flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#DC2626] group-hover:text-white" />
                  <span>LOST &amp; FOUND • COMING SOON</span>
                </button>

                {toastNotice ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 font-bold uppercase tracking-wider text-[11px] animate-pulse">
                    ● {toastNotice}
                  </span>
                ) : (
                  <span className="text-[#888880] text-xs">
                    Click to check status notice.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Active Interactive Lost & Found UI */
          <>
            {/* Controls: Search & Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
              
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'ALL ITEMS' },
                  { id: 'lost', label: 'LOST ONLY' },
                  { id: 'found', label: 'FOUND ONLY' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id as 'all' | 'lost' | 'found')}
                    className={`px-4 py-2 uppercase font-bold border transition-all ${
                      filterType === tab.id
                        ? 'bg-[#111111] border-[#DC2626] text-white shadow-xs'
                        : 'bg-white/40 border-[#111111]/15 text-[#666660] hover:text-[#111111] hover:border-[#111111]/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <Search className="w-4 h-4 text-[#888880] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BY ITEM, BLOCK OR KEYWORD..."
                  className="w-full pl-9 pr-4 py-2 bg-white/60 border border-[#111111]/20 font-mono text-xs text-[#111111] placeholder:text-[#888880] focus:outline-none focus:border-[#DC2626] uppercase"
                />
              </div>

            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const isLost = item.type === 'lost';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group border border-[#111111]/15 bg-white/40 hover:bg-white/80 hover:border-[#DC2626]/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Photo Container */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111111]/5 border-b border-[#111111]/10">
                        <img
                          src={item.image}
                          alt={item.itemName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Status Pill Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border shadow-xs ${
                              isLost
                                ? 'bg-rose-600 text-white border-rose-700'
                                : 'bg-emerald-600 text-white border-emerald-700'
                            }`}
                          >
                            ● {isLost ? 'LOST' : 'FOUND'}
                          </span>
                          <span className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#111111]/80 backdrop-blur-sm text-white">
                            {item.location}
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[9px] font-mono bg-black/60 backdrop-blur-xs text-white uppercase">
                          {item.category}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-syne text-xl font-bold text-[#111111] uppercase tracking-tight group-hover:text-[#DC2626] transition-colors">
                            {item.itemName}
                          </h3>
                        </div>

                        <p className="font-mono text-xs text-[#666660] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-2 border-t border-[#111111]/10 font-mono text-[11px] text-[#888880] space-y-1">
                          <div className="flex items-center gap-1.5 text-[#111111]">
                            <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                            <span className="truncate">DROP: {item.contactLocation}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#888880] shrink-0" />
                            <span>LOGGED: {item.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="w-full py-2.5 bg-transparent border border-[#111111]/20 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>VIEW DETAILS</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Modal: View Details with Large Item Photo */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                  onClick={() => setSelectedItem(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-[#F5F4EF] border-2 border-[#111111] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 z-10 p-2 bg-[#111111] text-white hover:bg-[#DC2626] transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Modal Large Photo Display */}
                    <div className="relative aspect-video w-full bg-black/10 overflow-hidden border-b border-[#111111]/15">
                      <img
                        src={selectedItem.image}
                        alt={selectedItem.itemName}
                        className="w-full h-full object-contain bg-black/5"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span
                          className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-md ${
                            selectedItem.type === 'lost' ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}
                        >
                          ● {selectedItem.type === 'lost' ? 'REPORTED LOST' : 'FOUND &amp; SECURED'}
                        </span>
                        <span className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider bg-[#111111] text-white">
                          {selectedItem.location}
                        </span>
                      </div>
                    </div>

                    {/* Modal Content Details */}
                    <div className="p-6 sm:p-8 space-y-6 font-mono">
                      <div>
                        <span className="text-xs text-[#DC2626] font-bold uppercase tracking-widest block mb-1">
                          ITEM REFERENCE #{selectedItem.id} // {selectedItem.category.toUpperCase()}
                        </span>
                        <h3 className="font-syne text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                          {selectedItem.itemName}
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs text-[#666660] bg-white/60 p-4 border border-[#111111]/15">
                        <div>LOCATION RECORDED: <strong className="text-[#111111]">{selectedItem.location}</strong></div>
                        <div>DATE REPORTED: <strong className="text-[#111111]">{selectedItem.date}</strong></div>
                        <div>SECURED AT: <strong className="text-[#DC2626]">{selectedItem.contactLocation}</strong></div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-[#111111] uppercase tracking-wider">
                          ITEM DESCRIPTION &amp; MARKS:
                        </div>
                        <p className="text-[#666660] leading-relaxed">
                          {selectedItem.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#111111]/15 flex items-center gap-2 text-[11px] text-[#888880]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>To claim or verify ownership of this item, please visit {selectedItem.contactLocation} with your Student ID card.</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

      </div>
    </section>
  );
};
