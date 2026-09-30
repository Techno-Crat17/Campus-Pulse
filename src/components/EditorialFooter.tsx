import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export const EditorialFooter: React.FC = () => {
  return (
    <footer className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 bg-[#F5F4EF] text-[#111111] relative overflow-hidden border-t border-[#111111]/10">
      <div className="max-w-[1700px] mx-auto space-y-16 sm:space-y-24">
        
        {/* Massive Closing Typography */}
        <div className="space-y-4">

          <h2 className="text-subgiant font-syne text-[#666660] uppercase tracking-tighter leading-none">
            MAKE THE CAMPUS
          </h2>
          <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
            SEARCHABLE.
          </h2>
          <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
            UNDERSTANDABLE.
          </h2>
          <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
            ACTIONABLE.
          </h2>
        </div>

        {/* Final CTA Line */}
        <div className="pt-8 border-t border-[#111111]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <Link
              to="/"
              className="font-syne text-2xl sm:text-3xl font-bold uppercase text-[#111111] dark:text-[#F3F3EE] cursor-pointer hover:text-[#DC2626] transition-colors flex items-center gap-3"
            >
              <img 
                src={`${import.meta.env.BASE_URL}assets/campus-pulse-icon.png`} 
                alt="Campus Pulse Icon" 
                className="w-8 h-8 rounded-lg bg-[#0A0A0A] object-contain shadow-xs border border-black/15 dark:border-white/15" 
              />
              <span>CAMPUS PULSE <span className="text-[#DC2626]">→</span></span>
            </Link>
            <div className="font-mono text-xs text-[#666660] uppercase">
              ASK YOUR CAMPUS. SEE YOUR CAMPUS. NAVIGATE YOUR CAMPUS.
            </div>
          </div>

          <Link
            to="/ask-ai"
            className="w-full sm:w-auto px-8 py-4 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span>LAUNCH ASSISTANT</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Minimal Footer Line */}
        <div className="pt-8 sm:pt-12 border-t border-[#111111]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono text-xs text-[#666660] gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span>CAMPUS PULSE © 2026. REAL-TIME CAMPUS OPERATING LAYER.</span>
            <span className="text-[#111111]/20">•</span>
            <span className="text-[10px] text-[#888880] tracking-widest uppercase hover:text-[#DC2626] transition-colors cursor-default" title="Creator: UVERMA">
              UVERMA
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
