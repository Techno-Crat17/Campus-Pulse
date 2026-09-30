import React, { useState } from 'react';
import { Sparkles, MapPin, Activity, Compass, AlertTriangle, UserCheck, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAssistant }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'HOME', icon: Activity },
    { id: 'assistant', label: 'AI ASSISTANT', icon: Sparkles },
    { id: 'map', label: 'LIVE MAP', icon: MapPin },
    { id: 'occupancy', label: 'OCCUPANCY', icon: Activity },
    { id: 'recommend', label: 'AI FINDER', icon: Compass },
    { id: 'faculty', label: 'FACULTY', icon: UserCheck },
    { id: 'issues', label: 'REPORT ISSUE', icon: AlertTriangle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#050811]/80 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Badge */}
          <button 
            onClick={() => setActiveTab('home')}
            aria-label="Campus Pulse Home"
            className="cursor-pointer group flex items-center gap-3 text-left focus:outline-none"
          >
            <img 
              src={`${import.meta.env.BASE_URL}assets/campus-pulse-icon.png`} 
              alt="Campus Pulse" 
              className="h-10 w-10 rounded-lg bg-[#0A0A0A] border border-white/15 object-contain transition-transform duration-300 group-hover:scale-105 shadow-xs" 
            />
            <div>
              <div className="font-syne text-xl sm:text-2xl font-extrabold tracking-tighter text-white group-hover:text-red-400 transition-colors flex items-center gap-1">
                CAMPUS<span className="text-red-500">PULSE</span>
              </div>
              <div className="text-[9px] tracking-widest text-slate-400 uppercase font-mono hidden min-[400px]:block">
                REAL-TIME OPERATING LAYER
              </div>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all duration-200 border ${
                    isActive
                      ? 'bg-red-600/15 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.2)]'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenAssistant}
              className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-mono uppercase tracking-widest rounded-none border border-red-500/40 hover:border-red-400 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300 overflow-hidden"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-200 group-hover:rotate-12 transition-transform" />
              <span>ASK AI ASSISTANT</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-red-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-white/10 text-slate-300 hover:text-white hover:border-white/30"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#060913] border-b border-white/10 px-4 pt-4 pb-6 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-3 text-sm font-mono tracking-wider border transition-all ${
                  activeTab === item.id
                    ? 'bg-red-600/20 border-red-500 text-red-300'
                    : 'border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onOpenAssistant();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-red-600 text-white font-mono text-xs tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              ASK AI ASSISTANT NOW
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
