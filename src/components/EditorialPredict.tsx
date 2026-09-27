import React from 'react';
import { motion } from 'framer-motion';
import { PREDICTIVE_FORECASTS } from '../data/campusData';

export const EditorialPredict: React.FC = () => {
  return (
    <section id="sec-predict" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1700px] mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold">
          SECTION 09 // PREDICTIVE PATTERN ENGINE
        </div>

        {/* Section Heading */}
        <div>
          <h2 className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter leading-none">
            THE CAMPUS
          </h2>
          <h2 className="text-subgiant font-syne text-[#DC2626] uppercase tracking-tighter leading-none">
            LEARNS.
          </h2>
        </div>

        {/* Minimal Timeline Representation - NO DASHBOARD CHARTS */}
        <div className="space-y-12 pt-8 border-t border-[#111111]/10">
          {PREDICTIVE_FORECASTS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#111111]/10 pb-12"
            >
              {/* Location Name */}
              <div className="lg:col-span-4">
                <h3 className="text-3xl sm:text-5xl font-syne font-bold text-[#111111] uppercase tracking-tight">
                  {item.location}
                </h3>
                <div className="font-mono text-xs text-[#666660] mt-1">
                  HISTORICAL PEAK CAPACITY: {item.historicalPeakPct}%
                </div>
              </div>

              {/* Peak & Quiet Times Timeline Stream */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
                
                <div className="p-6 border border-[#111111]/10 bg-white/40 space-y-2">
                  <span className="text-amber-600 font-bold uppercase tracking-wider block">
                    ● USUALLY CROWDED PERIOD:
                  </span>
                  <div className="text-2xl font-syne font-bold text-[#111111]">
                    {item.peakPeriod}
                  </div>
                  <p className="text-[#666660]">High student occupancy expected based on class schedules.</p>
                </div>

                <div className="p-6 border border-[#DC2626]/30 bg-[#DC2626]/5 space-y-2">
                  <span className="text-[#DC2626] font-bold uppercase tracking-wider block">
                    ● RECOMMENDED QUIET PERIOD:
                  </span>
                  <div className="text-2xl font-syne font-bold text-[#DC2626]">
                    {item.quietPeriod}
                  </div>
                  <p className="text-[#666660]">Optimal low-density window for focused study.</p>
                </div>

              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
