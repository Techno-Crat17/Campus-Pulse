import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, ArrowRight, Activity, Compass, Cpu, Layers } from 'lucide-react';
import { BUILDINGS_DATA } from '../data/campusData';

interface HeroSectionProps {
  onNavigateToTab: (tab: string) => void;
  onOpenAssistant: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateToTab, onOpenAssistant }) => {
  const avgOccupancy = Math.round(
    BUILDINGS_DATA.reduce((acc, b) => acc + b.occupancy, 0) / BUILDINGS_DATA.length
  );

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between pt-8 pb-16 overflow-hidden">
      
      {/* Top Editorial Ticker Bar */}
      <div className="w-full border-y border-white/10 py-3 bg-[#060913]/60 backdrop-blur-md mb-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-slate-200 uppercase font-semibold">CAMPUS PULSE SYSTEM v2.4</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline text-emerald-400">STATUS: ALL NODES OPERATIONAL</span>
          </div>
          <div className="flex items-center gap-6">
            <div>AVG CAMPUS OCCUPANCY: <span className="text-cyan-400 font-bold">{avgOccupancy}%</span></div>
            <div className="hidden md:block">MONITORED SPACES: <span className="text-white font-bold">12 BLOCKS</span></div>
            <div className="hidden lg:block">LATENCY: <span className="text-blue-400 font-bold">1.2ms</span></div>
          </div>
        </div>
      </div>

      {/* Main Editorial Hero Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Oversized Typography & Storytelling */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tag pill */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/30 bg-blue-950/30 text-cyan-300 font-mono text-xs uppercase tracking-widest"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>INTELLIGENT CAMPUS OPERATING LAYER</span>
            </motion.div>

            {/* Giant Display Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-0"
            >
              <h1 className="font-syne text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-white leading-none">
                CAMPUS
              </h1>
              <h1 className="font-syne text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-300 leading-none">
                PULSE.
              </h1>
            </motion.div>

            {/* Subtitle & Core Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-4 max-w-2xl"
            >
              <p className="text-xl sm:text-2xl font-light text-slate-300 tracking-tight leading-snug">
                An Intelligent Real-Time Operating Layer for Campus Life.
              </p>

              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-blue-400 font-bold block">01. ASK</span>
                  <p className="text-sm text-slate-300">Ask your campus.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-xs text-cyan-400 font-bold block">02. SEE</span>
                  <p className="text-sm text-slate-300">See your campus.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-xs text-indigo-400 font-bold block">03. NAVIGATE</span>
                  <p className="text-sm text-slate-300">Navigate your campus.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-xs text-purple-400 font-bold block">04. IMPROVE</span>
                  <p className="text-sm text-slate-300">Improve your campus.</p>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <button
                onClick={onOpenAssistant}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-mono text-sm font-bold uppercase tracking-widest hover:bg-blue-500 shadow-[0_0_30px_rgba(0,102,255,0.4)] transition-all duration-300"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
                <span>ASK CAMPUS →</span>
              </button>

              <button
                onClick={() => onNavigateToTab('map')}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-white/20 text-slate-200 font-mono text-sm font-semibold uppercase tracking-widest hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300"
              >
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                <span>EXPLORE MAP →</span>
              </button>
            </motion.div>

          </div>

          {/* Right Column: Interactive Core Interaction Loop Preview */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Campus Operating Loop Card */}
            <div className="glass-panel p-6 border-l-2 border-l-blue-500 space-y-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">THE CORE ENGINE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-4">
                {[
                  { step: 'ASK', desc: 'Natural language queries ("Where can I study now?")', color: 'text-blue-400' },
                  { step: 'UNDERSTAND', desc: 'Contextual AI parsing of user intent & constraints', color: 'text-cyan-400' },
                  { step: 'RETRIEVE', desc: 'Real-time IoT sensors & occupancy data streams', color: 'text-indigo-400' },
                  { step: 'RECOMMEND', desc: 'Ranked options by busyness, noise & proximity', color: 'text-purple-400' },
                ].map((item, idx) => (
                  <div key={item.step} className="flex items-start gap-3 text-xs">
                    <span className={`font-mono font-bold ${item.color} min-w-[90px]`}>
                      0{idx + 1}. {item.step}
                    </span>
                    <span className="text-slate-300">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black/40 border border-white/10 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>SAMPLE INTELLIGENCE QUERY</span>
                  <span className="text-cyan-400">ISE Lab 2 • 20%</span>
                </div>
                <p className="text-xs text-cyan-200 font-mono italic">
                  “ISE Lab 2 is 20% occupied and approx. 3 minutes away. Main Library is 85% occupied.”
                </p>
              </div>

              <div className="pt-2 flex justify-between text-[10px] font-mono text-slate-500">
                <span>LATENCY: 1.2s</span>
                <span>ACCURACY: 99.1%</span>
              </div>
            </div>

            {/* Live Campus Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => onNavigateToTab('occupancy')}
                className="glass-panel p-4 cursor-pointer hover:border-cyan-500/40 transition-all group"
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase">QUIETEST LAB</div>
                <div className="text-lg font-syne font-bold text-white group-hover:text-cyan-400 transition-colors">
                  ISE LAB 2
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-emerald-400 font-mono">
                  <span>20% BUSY</span>
                  <span>3 MIN</span>
                </div>
              </div>

              <div 
                onClick={() => onNavigateToTab('faculty')}
                className="glass-panel p-4 cursor-pointer hover:border-blue-500/40 transition-all group"
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase">FACULTY SPOTLIGHT</div>
                <div className="text-lg font-syne font-bold text-white group-hover:text-blue-400 transition-colors">
                  DR. XYZ
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-cyan-300 font-mono">
                  <span>B-204</span>
                  <span className="text-emerald-400">FREE NOW</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Features Storyline Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-16 pt-8 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              id: 'occupancy',
              title: 'LIVE OCCUPANCY',
              desc: 'Real-time percentage busyness tracking across all labs, library zones & cafeterias.',
              icon: Activity
            },
            {
              id: 'recommend',
              title: 'AI STUDY FINDER',
              desc: 'Personalized recommendations tailored to your noise preference, distance & tech needs.',
              icon: Compass
            },
            {
              id: 'issues',
              title: 'ISSUE REPORTING',
              desc: 'Community-driven facility issue tracking with photo uploads & status timeline.',
              icon: Layers
            }
          ].map((feature) => {
            const IconComp = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => onNavigateToTab(feature.id)}
                className="group cursor-pointer space-y-2 p-4 border border-transparent hover:border-white/10 hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center justify-between">
                  <IconComp className="w-5 h-5 text-blue-400 group-hover:text-cyan-300 transition-colors" />
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-syne text-sm font-bold text-white tracking-wider group-hover:text-cyan-300">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
