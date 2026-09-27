import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Bell } from 'lucide-react';
import { LOST_AND_FOUND_ENABLED } from '../config/features';
import { ThemeToggle } from './ThemeToggle';

interface MinimalNavbarProps {
  onNavigateSection: (sectionId: string) => void;
}

export const MinimalNavbar: React.FC<MinimalNavbarProps> = ({ onNavigateSection }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('sec-hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      // Scrollspy logic to glow the active section button
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      
      const sections = [
        { id: 'sec-lostfound', navId: 'sec-lostfound' },
        { id: 'sec-report', navId: 'sec-report' },
        { id: 'sec-faculty', navId: 'sec-faculty' },
        { id: 'sec-find', navId: 'sec-find' },
        { id: 'sec-map', navId: 'sec-map' },
        { id: 'sec-see', navId: 'sec-map' },
        { id: 'sec-ask', navId: 'sec-ask' },
        { id: 'sec-problem', navId: 'sec-hero' },
        { id: 'sec-hero', navId: 'sec-hero' },
      ];

      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          if (scrollPosition >= top) {
            setActiveSection(sec.navId);
            return;
          }
        }
      }
      setActiveSection('sec-hero');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
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
    { id: 'sec-map', label: '03 / MAP' },
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
    setActiveSection(id);
    onNavigateSection(id);
    setMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#F5F4EF]/90 dark:bg-[#0E0F12]/90 backdrop-blur-md py-3 border-b border-[#111111]/10 dark:border-white/10' 
        : 'bg-transparent py-6'
    }`}>
      {/* Toast Notification for Feature Status */}
      {toastMessage && (
        <div 
          role="alert"
          aria-live="assertive"
          className="fixed top-24 right-4 sm:right-8 z-[9999] max-w-sm bg-[#111111] dark:bg-[#1A1C24] text-[#F5F4EF] border border-[#DC2626] shadow-2xl p-4 flex items-center gap-3"
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

      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between font-mono text-xs text-[#111111] dark:text-[#F3F3EE]">
        
        {/* Campus Pulse Brand Logo */}
        <button 
          onClick={() => handleNavClick('sec-hero')}
          aria-label="Campus Pulse Home"
          title="Campus Pulse • UVERMA"
          className="cursor-pointer font-bold text-sm uppercase flex items-center gap-2.5 sm:gap-3 group focus:outline-none transition-transform hover:opacity-95"
        >
          <img 
            src={`${import.meta.env.BASE_URL}assets/campus-pulse-logo.png`} 
            alt="Campus Pulse" 
            title="Campus Pulse • UVERMA"
            className="h-8 sm:h-10 md:h-11 w-auto max-w-none object-contain drop-shadow-[0_2px_10px_rgba(220,38,38,0.25)] transition-transform duration-300 group-hover:scale-105" 
          />
          <span className="hidden min-[380px]:inline-block font-syne font-extrabold tracking-tight text-sm sm:text-base text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors">
            CAMPUS PULSE
          </span>
        </button>

        {/* Minimal Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-7 text-[11px] tracking-wider text-[#666660] dark:text-[#9CA3AF]">
          {navItems.map((item) => {
            const isLfDisabled = item.id === 'sec-lostfound' && !LOST_AND_FOUND_ENABLED;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-all duration-300 uppercase font-mono flex items-center gap-1.5 py-1 ${
                  isActive
                    ? 'text-[#DC2626] font-extrabold drop-shadow-[0_0_8px_rgba(220,38,38,0.55)] border-b-2 border-[#DC2626]'
                    : isLfDisabled 
                    ? 'text-[#888880] hover:text-[#DC2626] cursor-pointer' 
                    : 'text-[#666660] dark:text-[#9CA3AF] hover:text-[#DC2626]'
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

        {/* Action / Theme Toggle & Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle variant="compact" />

          {/* Menu Drawer Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="px-3 sm:px-3.5 py-1.5 border border-[#111111]/20 dark:border-white/20 hover:border-[#DC2626] dark:hover:border-[#DC2626] hover:text-[#DC2626] dark:hover:text-[#DC2626] text-[10px] sm:text-[11px] tracking-widest uppercase transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-white/70 dark:bg-white/5 text-[#111111] dark:text-[#F3F3EE]"
          >
            {menuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 top-[54px] sm:top-16 bg-[#F5F4EF] dark:bg-[#0E0F12] z-40 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col justify-between border-t border-[#111111]/10 dark:border-white/10 overflow-y-auto">
          <div className="max-w-4xl space-y-6 my-auto w-full mx-auto">
            {/* Theme Toggle Drawer Row */}
            <ThemeToggle variant="drawer" />

            <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase font-bold pt-2">
              NAVIGATION // SYSTEM INDEX
            </div>
            <div className="space-y-2 sm:space-y-3">
              {navItems.map((item) => {
                const isLfDisabled = item.id === 'sec-lostfound' && !LOST_AND_FOUND_ENABLED;
                const isActive = activeSection === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group cursor-pointer flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3 sm:pb-4 text-2xl sm:text-4xl md:text-6xl font-syne font-black transition-colors uppercase ${
                      isActive ? 'text-[#DC2626] drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'text-[#111111] dark:text-[#F3F3EE] hover:text-[#DC2626]'
                    }`}
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
                      <ArrowUpRight className={`w-8 h-8 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 ${
                        isActive ? 'text-[#DC2626]' : 'text-[#666660] dark:text-[#9CA3AF] group-hover:text-[#DC2626]'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="font-mono text-xs text-[#666660] dark:text-[#9CA3AF] flex justify-between border-t border-[#111111]/10 dark:border-white/10 pt-6">
            <span>REAL-TIME OPERATING LAYER</span>
            <span className="text-[#888880]">BUILD 2026.09 • UVERMA</span>
          </div>
        </div>
      )}
    </header>
  );
};
