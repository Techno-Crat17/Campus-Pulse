import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface EditorialHeroProps {
  onAskClick: () => void;
  onExploreClick: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({ onAskClick, onExploreClick }) => {
  return (
    <section id="sec-hero" className="min-h-screen pt-32 pb-16 px-6 sm:px-12 flex flex-col justify-between border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      
      {/* Top Metadata Line */}
      <div className="flex justify-between items-start font-mono text-xs text-[#666660]">
        <div>01 // SYSTEM START — MSRIT DATASET ACTIVE</div>
        <div className="text-right">
          <span className="text-[#DC2626] font-bold">SOURCE: MSRIT.EDU</span>
          <span className="mx-2">•</span>
          <span className="text-[#111111]">LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Massive Typography Hero Title */}
      <div className="my-auto py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-0"
        >
          <h1 className="text-giant font-syne text-[#111111] tracking-tighter uppercase block leading-none">
            CAMPUS
          </h1>
          <h1 className="text-giant font-syne text-[#DC2626] tracking-tighter uppercase block leading-none">
            PULSE
          </h1>
        </motion.div>

        {/* Descriptor & Supporting text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-end border-t border-[#111111]/10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 space-y-4"
          >
            <p className="text-xl sm:text-3xl font-light text-[#111111] tracking-tight leading-snug font-heading">
              AN INTELLIGENT REAL-TIME OPERATING LAYER FOR CAMPUS LIFE.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 space-y-4 lg:text-right font-mono text-xs text-[#666660] uppercase tracking-widest"
          >
            <div>ASK YOUR CAMPUS.</div>
            <div>SEE YOUR CAMPUS.</div>
            <div className="text-[#DC2626] font-bold">NAVIGATE YOUR CAMPUS.</div>
          </motion.div>

        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[#111111]/10 pt-6 font-mono text-xs gap-4">
        
        <button
          onClick={onAskClick}
          className="px-6 py-3.5 bg-[#111111] hover:bg-[#DC2626] text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-300"
        >
          <span>ASK CAMPUS</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <button
          onClick={onExploreClick}
          className="group flex items-center gap-2 text-[#666660] hover:text-[#111111] transition-colors"
        >
          <ArrowDownRight className="w-4 h-4 text-[#DC2626] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
          <span>SCROLL TO EXPLORE ↓</span>
        </button>

      </div>

    </section>
  );
};
