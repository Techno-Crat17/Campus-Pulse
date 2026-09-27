import React from 'react';
import { motion } from 'framer-motion';

export const EditorialStatement: React.FC = () => {
  return (
    <section id="sec-problem" className="py-32 px-6 sm:px-12 border-b border-[#111111]/10 relative overflow-hidden bg-[#F5F4EF]">
      <div className="max-w-[1600px] mx-auto space-y-16">
        
        {/* Index label */}
        <div className="font-mono text-xs text-[#DC2626] uppercase tracking-widest font-bold">
          SECTION 01 // THE PROBLEM
        </div>

        {/* Huge Split Statement Typography */}
        <div className="space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-subgiant font-syne text-[#111111] uppercase tracking-tighter"
          >
            YOUR CAMPUS<br />HAS ANSWERS.
          </motion.h2>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-subgiant font-syne text-[#666660] uppercase tracking-tighter"
          >
            BUT THEY<br />ARE SCATTERED.
          </motion.h2>
        </div>

        {/* Supporting Copy & Highlight Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-[#111111]/10 items-start">
          
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xl sm:text-2xl font-light text-[#111111] leading-relaxed font-heading">
              Campus information is scattered across people, boards and systems.
            </p>
            <p className="text-base text-[#666660] font-light leading-relaxed">
              Students lose time searching for available study spaces, resources, and faculty office hours. Reporting broken equipment or facility issues is slow and disconnected.
            </p>
          </div>

          <div className="lg:col-span-6 lg:pl-12 space-y-4 border-l-0 lg:border-l border-[#111111]/10">
            <span className="font-mono text-xs text-[#DC2626] uppercase tracking-widest block font-bold">
              CORE INSIGHT:
            </span>
            <p className="text-xl sm:text-3xl font-syne font-bold text-[#111111] uppercase tracking-tight leading-tight">
              THE CAMPUS HOLDS THE ANSWERS. <span className="text-[#DC2626]">BUT STUDENTS LACK A SINGLE INTELLIGENT LAYER.</span>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
