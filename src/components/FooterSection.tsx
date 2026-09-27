import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface FooterSectionProps {
  onNavigateToTab: (tab: string) => void;
  onOpenAssistant: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onNavigateToTab, onOpenAssistant }) => {
  return (
    <footer className="w-full bg-[#03050d] border-t border-white/10 pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Brand & Tagline */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-syne text-5xl sm:text-7xl font-black uppercase tracking-tighter text-white">
              CAMPUS<span className="text-blue-500">PULSE.</span>
            </h2>
            <p className="text-lg font-light text-slate-300 max-w-md">
              “Ask your campus. See your campus. Navigate your campus. Improve your campus.”
            </p>
            <div className="text-xs font-mono text-slate-500 pt-2">
              REAL-TIME CAMPUS OPERATING SYSTEM LAYER • BUILD 2.4.0
            </div>
          </div>

          {/* Nav Quick Links */}
          <div className="lg:col-span-3 space-y-3 font-mono text-xs">
            <div className="text-slate-500 uppercase tracking-widest font-bold">NAVIGATION</div>
            <ul className="space-y-2">
              {[
                { id: 'home', label: '01 // LANDING HOME' },
                { id: 'assistant', label: '02 // AI CAMPUS ASSISTANT' },
                { id: 'map', label: '03 // LIVE CAMPUS MAP' },
                { id: 'occupancy', label: '04 // LIVE OCCUPANCY' },
                { id: 'recommend', label: '05 // AI STUDY FINDER' },
                { id: 'faculty', label: '06 // FACULTY AVAILABILITY' },
                { id: 'issues', label: '07 // ISSUE REPORTING' }
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigateToTab(item.id)}
                    className="text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick CTA Box */}
          <div className="lg:col-span-3 space-y-4 glass-panel p-6 border-white/10">
            <div className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              ASK CAMPUS AI
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Query occupancy, quiet study desks, or faculty office check-ins in natural language.
            </p>
            <button
              onClick={onOpenAssistant}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,102,255,0.3)]"
            >
              <span>LAUNCH AI ASSISTANT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Bottom Line Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} CAMPUS PULSE OPERATING LAYER. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">● IoT NODE MESH: ACTIVE</span>
            <span>DESIGN LANGUAGE: BLEIBTGLEICH.DEV INSPIRED</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
