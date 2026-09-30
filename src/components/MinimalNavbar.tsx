import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const MinimalNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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
    { path: '/', label: 'HOME' },
    { path: '/ask-ai', label: 'ASK' },
    { path: '/map', label: 'MAP' },
    { path: '/libraries', label: 'LIBRARIES' },
    { path: '/faculty', label: 'FACULTY' },
    { path: '/issues', label: 'ISSUES' },
    { path: '/lost-found', label: 'LOST & FOUND' },
    { path: '/others', label: 'OTHERS' },
  ];

  const isNavItemActive = (itemPath: string) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    if (itemPath === '/ask-ai') {
      return location.pathname === '/ask-ai' || location.pathname === '/ask' || location.pathname === '/query';
    }
    if (itemPath === '/libraries') {
      return location.pathname === '/libraries' || location.pathname === '/spaces';
    }
    if (itemPath === '/issues') {
      return location.pathname === '/issues' || location.pathname === '/report';
    }
    if (itemPath === '/lost-found') {
      return location.pathname === '/lost-found' || location.pathname === '/lostfound';
    }
    return location.pathname.startsWith(itemPath);
  };

  // Close menu on route change or when screen resizes to desktop
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            className="text-[#888880] hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between font-mono text-[#111111] dark:text-[#F3F3EE] gap-3 sm:gap-4 lg:gap-6">
        
        {/* Campus Pulse Brand Logo */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          aria-label="Campus Pulse Home"
          title="Campus Pulse • UVERMA"
          className="cursor-pointer font-bold uppercase flex items-center gap-2 sm:gap-2.5 lg:gap-3 group focus:outline-none transition-transform hover:opacity-95 shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/campus-pulse-icon.png`}
            alt="Campus Pulse"
            title="Campus Pulse • UVERMA"
            style={{ width: 'clamp(32px, 2.2vw, 38px)', height: 'clamp(32px, 2.2vw, 38px)' }}
            className="rounded-lg object-contain bg-[#0A0A0A] border border-black/15 dark:border-white/15 shadow-xs transition-transform duration-300 group-hover:scale-105"
          />
          <span
            style={{ fontSize: 'clamp(14px, 0.85vw + 4px, 17px)' }}
            className="hidden min-[380px]:inline-block font-syne font-extrabold tracking-tight text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors whitespace-nowrap"
          >
            CAMPUS PULSE
          </span>
        </Link>

        {/* Complete Desktop Route Navigation (Laptop & Desktop, Fluid Responsive Sizing) */}
        <nav
          aria-label="Main Navigation"
          style={{ gap: 'clamp(10px, 1.2vw, 26px)' }}
          className="hidden lg:flex items-center tracking-wider whitespace-nowrap text-[#666660] dark:text-[#9CA3AF]"
        >
          {navItems.map((item) => {
            const active = isNavItemActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{ fontSize: 'clamp(13.5px, 0.32vw + 10.5px, 16.5px)' }}
                className={`transition-all duration-200 uppercase font-mono whitespace-nowrap flex items-center py-1.5 px-0.5 sm:px-1 border-b-2 font-medium shrink-0 leading-none ${
                  active
                    ? 'text-[#DC2626] font-bold drop-shadow-[0_0_8px_rgba(220,38,38,0.55)] border-[#DC2626]'
                    : 'text-[#666660] dark:text-[#9CA3AF] hover:text-[#DC2626] dark:hover:text-[#DC2626] border-transparent'
                }`}
              >
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Action / Theme Toggle & Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle variant="compact" />

          {/* Menu Drawer Button (Mobile & Tablet Only, Hidden on Laptop/Desktop) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex lg:hidden px-3 sm:px-3.5 py-1.5 border border-[#111111]/20 dark:border-white/20 hover:border-[#DC2626] dark:hover:border-[#DC2626] hover:text-[#DC2626] dark:hover:text-[#DC2626] text-[10px] sm:text-[11px] tracking-widest uppercase transition-all items-center gap-1.5 sm:gap-2 cursor-pointer bg-white/70 dark:bg-white/5 text-[#111111] dark:text-[#F3F3EE]"
          >
            {menuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Menu Drawer (Mobile & Tablet Only) */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[54px] sm:top-16 bg-[#F5F4EF] dark:bg-[#0E0F12] z-40 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col justify-between border-t border-[#111111]/10 dark:border-white/10 overflow-y-auto">
          <div className="max-w-4xl space-y-6 my-auto w-full mx-auto">
            {/* Theme Toggle Drawer Row */}
            <ThemeToggle variant="drawer" />

            <div className="font-mono text-xs text-[#DC2626] tracking-widest uppercase font-bold pt-2">
              NAVIGATION // SYSTEM INDEX
            </div>
            <div className="space-y-2 sm:space-y-3">
              {navItems.map((item) => {
                const active = isNavItemActive(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`group cursor-pointer flex items-center justify-between border-b border-[#111111]/10 dark:border-white/10 pb-3 sm:pb-4 text-2xl sm:text-4xl md:text-6xl font-syne font-black transition-colors uppercase whitespace-nowrap ${
                      active ? 'text-[#DC2626] drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'text-[#111111] dark:text-[#F3F3EE] hover:text-[#DC2626]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>{item.label}</span>
                    </div>
                    <ArrowUpRight className={`w-8 h-8 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 ${
                      active ? 'text-[#DC2626]' : 'text-[#666660] dark:text-[#9CA3AF] group-hover:text-[#DC2626]'
                    }`} />
                  </NavLink>
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
