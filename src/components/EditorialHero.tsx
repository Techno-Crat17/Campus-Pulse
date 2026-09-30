import React from 'react';
import { motion } from 'framer-motion';

interface EditorialHeroProps {
  onAskClick?: () => void;
  onExploreClick?: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = () => {
  return (
    <section id="sec-hero" className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-b border-[#111111]/10 dark:border-white/10 relative overflow-hidden bg-[#F5F4EF] dark:bg-[#0E0F12]">
      

      {/* Massive Typography Hero Title */}
      <div className="my-auto py-6 sm:py-8 space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-0"
        >
          <h1 className="text-giant font-syne text-[#111111] dark:text-[#F3F3EE] tracking-tighter uppercase block leading-none">
            CAMPUS
          </h1>
          <h1 className="text-giant font-syne text-[#DC2626] tracking-tighter uppercase block leading-none">
            PULSE
          </h1>
        </motion.div>

        {/* Descriptor & Supporting text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pt-6 sm:pt-8 items-end border-t border-[#111111]/10 dark:border-white/10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 space-y-3 sm:space-y-4"
          >
            <p className="text-lg sm:text-2xl md:text-3xl font-light text-[#111111] dark:text-[#F3F3EE] tracking-tight leading-snug font-heading">
              AN INTELLIGENT REAL-TIME OPERATING LAYER FOR CAMPUS LIFE.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 space-y-2 sm:space-y-4 lg:text-right font-mono text-[11px] sm:text-xs text-[#666660] dark:text-[#9CA3AF] uppercase tracking-widest"
          >
            <div>ASK YOUR CAMPUS.</div>
            <div>SEE YOUR CAMPUS.</div>
            <div>NAVIGATE YOUR CAMPUS.</div>
            <div className="text-[#DC2626] font-bold">IMPROVE YOUR CAMPUS.</div>
          </motion.div>

        </div>
      </div>

    </section>
  );
};

