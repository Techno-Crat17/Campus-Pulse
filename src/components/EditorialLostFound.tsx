import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  X,
  Eye,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  PlusCircle,
  User,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  LOST_FOUND_CATEGORIES,
  getStoredLostFoundItems,
  saveLostFoundItem,
  isValidUSN
} from '../data/lostFoundData';
import type { LostFoundItem } from '../data/lostFoundData';
import { fetchLostFound, createLostFound } from '../services/api';
import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers';

export const EditorialLostFound: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>(() => getStoredLostFoundItems());
  const [filterType, setFilterType] = useState<'all' | 'found' | 'recovered'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  // Form State: 7 Mandatory Fields
  const [category, setCategory] = useState<LostFoundItem['category']>('Electronics');
  const [itemTitle, setItemTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [foundAt, setFoundAt] = useState<string>('');
  const [foundOn, setFoundOn] = useState<string>('');
  const [usn, setUsn] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // Form feedback state
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Synchronize items from backend or storage on mount
  useEffect(() => {
    async function loadRemoteItems() {
      try {
        const remote = await fetchLostFound();
        if (Array.isArray(remote) && remote.length > 0) {
          const mapped: LostFoundItem[] = remote.map((item: any) => ({
            id: item.id || item._id,
            itemName: item.itemName || item.title || item.itemTitle || 'Item',
            itemTitle: item.itemTitle || item.itemName || item.title,
            category: item.category || 'Other',
            description: item.description || '',
            foundAt: item.foundAt || item.location || 'Campus Facilities',
            location: item.foundAt || item.location || 'Campus Facilities',
            foundOn: item.foundOn || item.date || '2026-09-30',
            date: item.foundOn || item.date || '2026-09-30',
            usn: item.usn || '',
            status: (item.status === 'RECOVERED' || item.status === 'recovered') ? 'RECOVERED' : 'FOUND',
            contactLocation: item.contactLocation || 'Security Enquiry Desk',
            statusLabel: (item.status === 'RECOVERED' || item.status === 'recovered') ? 'RECOVERED & CLAIMED' : 'FOUND & SECURED',
            type: (item.status === 'RECOVERED' || item.status === 'recovered') ? 'recovered' : 'found',
            image: item.image || '',
            isDemo: item.isDemo || false
          }));
          setItems(mapped);
          return;
        }
      } catch (err) {
        console.warn('[EditorialLostFound] Failed to fetch remote items:', err);
      }
      setItems(getStoredLostFoundItems());
    }

    loadRemoteItems();

    const handleUpdate = () => {
      setItems(getStoredLostFoundItems());
    };
    window.addEventListener('campus_pulse_lost_found_updated', handleUpdate);
    return () => window.removeEventListener('campus_pulse_lost_found_updated', handleUpdate);
  }, []);

  const getItemStatus = (item: LostFoundItem): 'FOUND' | 'RECOVERED' => {
    const s = (item.status || item.type || '').toUpperCase();
    if (s === 'RECOVERED' || s === 'CLAIMED' || s === 'RESOLVED') return 'RECOVERED';
    return 'FOUND';
  };

  const getItemLocation = (item: LostFoundItem): string => {
    return item.foundAt || item.location || 'Campus Facilities';
  };

  const filteredItems = items.filter((item) => {
    const itemStatus = getItemStatus(item);
    const matchesType =
      filterType === 'all' ||
      (filterType === 'found' && itemStatus === 'FOUND') ||
      (filterType === 'recovered' && itemStatus === 'RECOVERED');

    const locationStr = getItemLocation(item);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.itemName.toLowerCase().includes(q) ||
      locationStr.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.usn && item.usn.toLowerCase().includes(q)) ||
      itemStatus.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Mandatory Field Validation
    if (!category) {
      setErrorMsg('Please select a category.');
      return;
    }
    if (!itemTitle.trim()) {
      setErrorMsg('Please enter the item title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a description of the item.');
      return;
    }
    if (!foundAt.trim()) {
      setErrorMsg('Please specify where the item was found.');
      return;
    }
    if (!foundOn.trim()) {
      setErrorMsg('Please select the date the item was found.');
      return;
    }
    if (!usn.trim()) {
      setErrorMsg('Please enter your USN.');
      return;
    }
    if (!imagePreview) {
      setErrorMsg('Please upload at least one image of the found item.');
      return;
    }

    const cleanUsn = usn.trim().toUpperCase();

    // 2. Strict USN Format Validation
    if (!isValidUSN(cleanUsn)) {
      setErrorMsg('Enter a valid USN. Example: 1MS24IS094');
      return;
    }

    // 3. Centralized blocked user check
    if (isBlockedUser(cleanUsn)) {
      setErrorMsg(BLOCKED_USER_ERROR_MESSAGE);
      return;
    }

    setSubmitting(true);

    const payload = {
      category,
      itemTitle: itemTitle.trim(),
      description: description.trim(),
      foundAt: foundAt.trim(),
      foundOn: foundOn.trim(),
      usn: cleanUsn,
      status: 'found',
      image: imagePreview,
      images: [imagePreview]
    };

    try {
      const saved = await createLostFound(payload);

      const newItem: LostFoundItem = {
        id: saved?.id || saved?._id || (`lf-local-${Date.now()}`),
        itemName: itemTitle.trim(),
        itemTitle: itemTitle.trim(),
        category,
        description: description.trim(),
        foundAt: foundAt.trim(),
        location: foundAt.trim(),
        foundOn: foundOn.trim(),
        date: foundOn.trim(),
        usn: cleanUsn,
        status: 'FOUND',
        contactLocation: 'Security Enquiry Desk',
        statusLabel: 'FOUND & SECURED',
        type: 'found',
        image: imagePreview,
        isDemo: false
      };

      const updated = saveLostFoundItem(newItem);
      setItems(updated);
      setSubmitted(true);

      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch {
        // Fallback if confetti unavailable
      }

      // Reset Form Fields
      setItemTitle('');
      setDescription('');
      setFoundAt('');
      setFoundOn('');
      setUsn('');
      setImagePreview('');
      setCategory('Electronics');

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      console.error('[EditorialLostFound] Submit error:', err);
      // Fallback local persistence
      const newItem: LostFoundItem = {
        id: `lf-local-${Date.now()}`,
        itemName: itemTitle.trim(),
        itemTitle: itemTitle.trim(),
        category,
        description: description.trim(),
        foundAt: foundAt.trim(),
        location: foundAt.trim(),
        foundOn: foundOn.trim(),
        date: foundOn.trim(),
        usn: cleanUsn,
        status: 'FOUND',
        contactLocation: 'Security Enquiry Desk',
        statusLabel: 'FOUND & SECURED',
        type: 'found',
        image: imagePreview,
        isDemo: false
      };

      const updated = saveLostFoundItem(newItem);
      setItems(updated);
      setSubmitted(true);

      setItemTitle('');
      setDescription('');
      setFoundAt('');
      setFoundOn('');
      setUsn('');
      setImagePreview('');
      setCategory('Electronics');

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="sec-lostfound" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-12 sm:space-y-16">

        {/* Section Header & Report Found Item Entry Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-[#111111]/10 pb-12 items-start">

          {/* Left Column (5 Cols): Section Title & Overview */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-syne font-black text-[#111111] uppercase tracking-tighter leading-none">
                LOST &amp;
              </h2>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-syne font-black text-[#DC2626] uppercase tracking-tighter leading-none">
                FOUND
              </h2>
            </div>

            <p className="font-mono text-xs sm:text-sm text-[#666660] leading-relaxed">
              Report items found across the campus or search for misplaced belongings. All turned-in items are verified and deposited at the campus Security Enquiry Desk for owner claim and recovery.
            </p>

            <div className="font-mono text-xs text-[#666660] space-y-2 pt-2 border-t border-[#111111]/10">
              <div className="inline-flex items-center gap-2 text-[#DC2626] font-bold uppercase tracking-wider bg-[#DC2626]/10 px-3 py-1 border border-[#DC2626]/20">
                <HelpCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>STATUS SYSTEM // FOUND → RECOVERED</span>
              </div>
              <div className="text-[11px] text-[#111111]">
                MODEL: PEER RECOVERY &amp; CAMPUS SECURITY DESK DEPOSITS
              </div>
              <div className="text-[10px] text-[#888880]">
                NOTICE: REPORTED ITEMS ENTER THE DISPATCH REGISTRY IMMEDIATELY
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Report Found Item Entry Form (Yellow Marked Target Area) */}
          <div className="lg:col-span-7 bg-white/70 border-2 border-[#111111]/15 p-6 sm:p-8 space-y-6 font-mono text-xs shadow-xs">

            <div className="border-b border-[#111111]/10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#111111] font-bold uppercase text-xs sm:text-sm font-syne">
                <PlusCircle className="w-4 h-4 text-[#DC2626]" />
                <span>REPORT FOUND ITEM</span>
              </div>
            </div>

            {/* Success Notification */}
            {submitted && (
              <div
                role="alert"
                className="p-4 border-2 border-[#16A34A] bg-emerald-50 text-emerald-900 font-mono text-xs flex items-center gap-3 shadow-xs animate-in fade-in"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-800 text-sm">Found item reported successfully.</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Your entry has been logged and published to the active Found registry.
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Field 1: Category */}
              <div className="space-y-1.5">
                <label htmlFor="found-category-select" className="text-[#666660] uppercase tracking-widest font-bold block">
                  1. CATEGORY *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {LOST_FOUND_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 border text-left transition-all cursor-pointer text-[11px] ${
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

              {/* Field 2: Item Title & Field 4: Found At in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 2: Item Title */}
                <div className="space-y-1.5">
                  <label htmlFor="found-item-title" className="text-[#666660] uppercase tracking-widest font-bold block">
                    2. ITEM TITLE *
                  </label>
                  <input
                    id="found-item-title"
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="E.G. WIRELESS BLUETOOTH MOUSE"
                    className="w-full bg-white border border-[#111111]/25 px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-bold"
                    required
                  />
                </div>

                {/* Field 4: Found At */}
                <div className="space-y-1.5">
                  <label htmlFor="found-location-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                    4. FOUND AT *
                  </label>
                  <input
                    id="found-location-input"
                    type="text"
                    value={foundAt}
                    onChange={(e) => setFoundAt(e.target.value)}
                    placeholder="E.G. ISE LAB 3, LHC ROOM 306"
                    className="w-full bg-white border border-[#111111]/25 px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-bold"
                    required
                  />
                </div>
              </div>

              {/* Field 3: Description */}
              <div className="space-y-1.5">
                <label htmlFor="found-description-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                  3. DESCRIPTION *
                </label>
                <textarea
                  id="found-description-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="DESCRIBE THE ITEM, COLOR, DISTINCT MARKS, CASING, BRAND, ETC."
                  className="w-full bg-white border border-[#111111]/25 p-3 text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-medium resize-y"
                  required
                />
              </div>

              {/* Field 5: Found On & Field 6: Your USN in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 5: Found On Date */}
                <div className="space-y-1.5">
                  <label htmlFor="found-date-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                    5. FOUND ON *
                  </label>
                  <input
                    id="found-date-input"
                    type="date"
                    value={foundOn}
                    onChange={(e) => setFoundOn(e.target.value)}
                    className="w-full bg-white border border-[#111111]/25 px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] shadow-2xs font-bold cursor-pointer"
                    required
                  />
                </div>

                {/* Field 6: Your USN */}
                <div className="space-y-1.5">
                  <label htmlFor="found-usn-input" className="text-[#666660] uppercase tracking-widest font-bold block">
                    6. YOUR USN *
                  </label>
                  <input
                    id="found-usn-input"
                    type="text"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="E.G. 1MS24IS094"
                    maxLength={14}
                    className="w-full bg-white border border-[#111111]/25 px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#DC2626] uppercase shadow-2xs font-bold tracking-wider"
                    required
                  />
                  <div className="text-[10px] text-[#888880]">
                    FORMAT: 1MS[YEAR][BRANCH][001-300] (OPTIONAL -T)
                  </div>
                </div>
              </div>

              {/* Field 7: Image Upload (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-[#666660] uppercase tracking-widest font-bold block">
                  7. ITEM PHOTO *
                </label>
                {imagePreview ? (
                  <div className="relative border-2 border-[#111111]/25 p-2 bg-white flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      className="w-20 h-20 object-cover border border-[#111111]/20"
                    />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-[#111111] uppercase">PHOTO ATTACHED</div>
                      <div className="text-[10px] text-[#666660]">Ready for dispatch submission</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagePreview('')}
                      className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#111111]/25 hover:border-[#DC2626] p-4 bg-white/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                    <Upload className="w-5 h-5 text-[#888880] group-hover:text-[#DC2626] transition-colors" />
                    <span className="text-[11px] text-[#666660] group-hover:text-[#111111] font-bold uppercase">
                      CLICK TO UPLOAD PHOTO (PNG, JPG, WEBP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'LOGGING DISPATCH...' : 'SUBMIT FOUND ITEM REPORT →'}</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Active Interactive Lost & Found Registry UI */}
        <div className="space-y-8">
          {/* Controls: Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">

            {/* Filter Pills (3 Options: ALL ITEMS, FOUND, RECOVERED) */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'ALL ITEMS' },
                { id: 'found', label: 'FOUND' },
                { id: 'recovered', label: 'RECOVERED' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as 'all' | 'found' | 'recovered')}
                  className={`px-4 py-2 uppercase font-bold border transition-all cursor-pointer ${
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
              const status = getItemStatus(item);
              const isFound = status === 'FOUND';
              const location = getItemLocation(item);

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
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.itemName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#111111]/5 font-mono text-xs text-[#888880] p-4 text-center space-y-1">
                          <Tag className="w-8 h-8 text-[#DC2626]/40" />
                          <span className="text-[10px] font-bold uppercase">{item.category}</span>
                        </div>
                      )}

                      {/* Dynamic Status Pill Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border shadow-xs ${
                            isFound
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-[#111111] text-white border-black/30'
                          }`}
                        >
                          ● {status}
                        </span>
                        <span className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#111111]/80 backdrop-blur-sm text-white truncate max-w-[140px]">
                          {location}
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
                          <span className="truncate font-semibold">
                            {isFound
                              ? 'DROPPED IN AT LOST & FOUND DEPARTMENT'
                              : 'COLLECTED & RECOVERED BY OWNER'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#888880] shrink-0" />
                            <span>LOGGED: {item.foundOn || item.date}</span>
                          </div>
                          {item.usn && (
                            <div className="flex items-center gap-1 text-[10px] text-[#111111] font-bold">
                              <User className="w-3 h-3 text-[#DC2626]" />
                              <span>{item.usn}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="w-full py-2.5 bg-transparent border border-[#111111]/20 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            {selectedItem && (() => {
              const modalStatus = getItemStatus(selectedItem);
              const modalIsFound = modalStatus === 'FOUND';
              const modalLocation = getItemLocation(selectedItem);

              return (
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
                      className="absolute top-4 right-4 z-10 p-2 bg-[#111111] text-white hover:bg-[#DC2626] transition-colors cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Modal Large Photo Display */}
                    <div className="relative aspect-video w-full bg-black/10 overflow-hidden border-b border-[#111111]/15">
                      {selectedItem.image ? (
                        <img
                          src={selectedItem.image}
                          alt={selectedItem.itemName}
                          className="w-full h-full object-contain bg-black/5"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#111111]/10 font-mono text-xs text-[#888880] p-4 text-center space-y-2">
                          <Tag className="w-12 h-12 text-[#DC2626]/40" />
                          <span className="text-xs font-bold uppercase">{selectedItem.category}</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span
                          className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-md ${
                            modalIsFound ? 'bg-emerald-600' : 'bg-[#111111]'
                          }`}
                        >
                          ● {modalIsFound ? 'FOUND & SECURED' : 'RECOVERED & CLAIMED'}
                        </span>
                        <span className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider bg-[#111111] text-white">
                          {modalLocation}
                        </span>
                      </div>
                    </div>

                    {/* Modal Content Details */}
                    <div className="p-6 sm:p-8 space-y-6 font-mono">
                      <div>
                        <span className="text-xs text-[#DC2626] font-bold uppercase tracking-widest block mb-1">
                          ITEM REFERENCE #{selectedItem.id} // {selectedItem.category?.toUpperCase()}
                        </span>
                        <h3 className="font-syne text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
                          {selectedItem.itemName}
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs text-[#666660] bg-white/60 p-4 border border-[#111111]/15">
                        <div>STATUS: <strong className={modalIsFound ? 'text-emerald-700' : 'text-[#111111]'}>{modalStatus}</strong></div>
                        <div>ORIGINAL FOUND LOCATION: <strong className="text-[#111111]">{modalLocation}</strong></div>
                        <div>DEPARTMENT STATUS: <strong className="text-[#111111]">{modalIsFound ? 'DROPPED IN AT LOST & FOUND DEPARTMENT' : 'COLLECTED & RECOVERED BY OWNER'}</strong></div>
                        <div>DATE FOUND / LOGGED: <strong className="text-[#111111]">{selectedItem.foundOn || selectedItem.date}</strong></div>
                        {selectedItem.usn && (
                          <div>REPORTED BY USN: <strong className="text-[#DC2626]">{selectedItem.usn}</strong></div>
                        )}
                        <div>SECURED AT: <strong className="text-[#DC2626]">{selectedItem.contactLocation || 'Security Enquiry Desk'}</strong></div>
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
                        <span>To claim or verify ownership of this item, please visit {selectedItem.contactLocation || 'Security Enquiry Desk'} with your Student ID card.</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
