import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Bell } from 'lucide-react';
import { LOST_AND_FOUND_ENABLED } from '../config/features';

interface MinimalNavbarProps {
  onNavigateSection: (sectionId: string) => void;
}

export const MinimalNavbar: React.FC<MinimalNavbarProps> = ({ onNavigateSection }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const navItems = [
    { id: 'sec-hero', label: '01 / HOME' },
    { id: 'sec-ask', label: '02 / ASK' },
    { id: 'sec-see', label: '03 / MAP' },
    { id: 'sec-find', label: '04 / SPACES' },
    { id: 'sec-faculty', label: '05 / FACULTY' },
    { id: 'sec-report', label: '06 / ISSUES' },
    { id: 'sec-lostfound', label: '07 / LOST & FOUND' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'sec-lostfound' && !LOST_AND_FOUND_ENABLED) {
      setToastMessage('Lost & Found is coming soon');
      return;
    }
    onNavigateSection(id);
    setMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#F5F4EF]/90 backdrop-blur-md py-3 border-b border-[#111111]/10' 
        : 'bg-transparent py-6'
    }`}>
      {/* Toast Notification for Feature Status */}
      {toastMessage && (
        <div 
          role="alert"
          aria-live="assertive"
          className="fixed top-24 right-4 sm:right-8 z-[9999] max-w-sm bg-[#111111] text-[#F5F4EF] border border-[#DC2626] shadow-2xl p-4 flex items-center gap-3"
        >
          <div className="p-1.5 bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#DC2626]">
            <Bell className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="flex-1 space-y-0.5 font-mono">
            <div className="text-[10px] text-[#DC2626] font-bold tracking-widest uppercase">
              CAMPUS PULSE // NOTICE
            </div>
            <div className="text-xs font-semibold text-white">
              {toastMessage}
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#888880] hover:text-white transition-colors p-1"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1700px] mx-auto px-6 sm:px-12 flex items-center justify-between font-mono text-xs text-[#111111]">
        
        {/* Campus Pulse Brand Logo */}
        <button 
          onClick={() => handleNavClick('sec-hero')}
          aria-label="Campus Pulse Home"
          title="Campus Pulse • UVERMA"
          className="cursor-pointer font-bold text-sm uppercase flex items-center gap-3 group focus:outline-none transition-transform hover:opacity-95"
        >
          <img 
            src={`${import.meta.env.BASE_URL}assets/campus-pulse-logo.png`} 
            alt="Campus Pulse" 
            title="Campus Pulse • UVERMA"
            className="h-9 sm:h-10 md:h-11 w-auto max-w-none object-contain drop-shadow-[0_2px_10px_rgba(220,38,38,0.25)] transition-transform duration-300 group-hover:scale-105" 
          />
          <span className="hidden min-[380px]:inline-block font-syne font-extrabold tracking-tight text-sm sm:text-base text-[#111111] group-hover:text-[#DC2626] transition-colors">
            CAMPUS PULSE
          </span>
        </button>

        {/* Minimal Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-7 text-[11px] tracking-wider text-[#666660]">
          {navItems.map((item) => {
            const isLfDisabled = item.id === 'sec-lostfound' && !LOST_AND_FOUND_ENABLED;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors uppercase font-mono flex items-center gap-1.5 ${
                  isLfDisabled 
                    ? 'text-[#888880] hover:text-[#DC2626] cursor-pointer' 
                    : 'hover:text-[#DC2626]'
                }`}
                title={isLfDisabled ? 'Lost & Found is coming soon' : undefined}
              >
                <span>{item.label}</span>
                {isLfDisabled && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action / Menu Trigger */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="px-3.5 py-1.5 border border-[#111111]/20 hover:border-[#DC2626] hover:text-[#DC2626] text-[11px] tracking-widest uppercase transition-all flex items-center gap-2"
          >
            {menuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 bg-[#F5F4EF] z-40 px-6 sm:px-12 py-12 flex flex-col justify-between border-t border-[#111111]/10">
          <div className="max-w-4xl space-y-6 my-auto">
            <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase">
              NAVIGATION // SYSTEM INDEX
            </div>
            <div className="space-y-4">
              {navItems.map((item) => {
                const isLfDisabled = item.id === 'sec-lostfound' && !LOST_AND_FOUND_ENABLED;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="group cursor-pointer flex items-center justify-between border-b border-[#111111]/10 pb-4 text-3xl sm:text-6xl font-syne font-black text-[#111111] hover:text-[#DC2626] transition-colors uppercase"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={isLfDisabled ? 'opacity-70' : ''}>{item.label}</span>
                      {isLfDisabled && (
                        <span className="text-xs sm:text-sm font-mono font-bold tracking-widest px-2.5 py-1 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 uppercase">
                          COMING SOON
                        </span>
                      )}
                    </div>
                    {isLfDisabled ? (
                      <span className="text-xs font-mono font-bold tracking-widest text-[#888880] group-hover:text-[#DC2626] uppercase">
                        [TEMPORARILY UNAVAILABLE]
                      </span>
                    ) : (
                      <ArrowUpRight className="w-8 h-8 text-[#666660] group-hover:text-[#DC2626] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="font-mono text-xs text-[#666660] flex justify-between border-t border-[#111111]/10 pt-6">
            <span>REAL-TIME OPERATING LAYER</span>
            <span className="text-[#888880]">BUILD 2026.09 • UVERMA</span>
          </div>
        </div>
      )}
    </header>
  );
};
