import React from 'react';

export const EditorialFooter: React.FC = () => {
  return (
    <footer className="py-8 px-4 sm:px-8 lg:px-12 bg-[#F5F4EF] dark:bg-[#0E0F12] text-[#111111] dark:text-[#F3F3EE] relative overflow-hidden border-t border-[#111111]/10 dark:border-white/10 font-mono text-xs">
      <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between text-[#666660] dark:text-[#9CA3AF] gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span>CAMPUS PULSE © 2026. REAL-TIME CAMPUS OPERATING LAYER.</span>
          <span className="text-[#111111]/20 dark:text-white/20">•</span>
          <span className="text-[10px] text-[#888880] tracking-widest uppercase hover:text-[#DC2626] transition-colors cursor-default" title="Creator: UVERMA">
            UVERMA
          </span>
        </div>
      </div>
    </footer>
  );
};
