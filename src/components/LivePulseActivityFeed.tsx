import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { INITIAL_ACTIVITIES } from '../data/campusData';
import type { LiveActivity } from '../data/campusData';

interface LivePulseActivityFeedProps {
  onNavigateToTab?: (tab: string) => void;
}

export const LivePulseActivityFeed: React.FC<LivePulseActivityFeedProps> = ({ onNavigateToTab }) => {
  const [activities, setActivities] = useState<LiveActivity[]>(INITIAL_ACTIVITIES);

  useEffect(() => {
    const eventsPool: Omit<LiveActivity, 'id'>[] = [
      {
        timestamp: 'Just now',
        type: 'occupancy',
        message: 'ISE Lab 2 occupancy dropped to 18% (Optimal quiet study window).',
        location: 'ISE Lab 2',
        level: 'success'
      },
      {
        timestamp: 'Just now',
        type: 'faculty',
        message: 'Dr. Aris Thorne checked into Office B-310 (Available for consult).',
        location: 'Faculty Block B',
        level: 'info'
      },
      {
        timestamp: 'Just now',
        type: 'occupancy',
        message: 'Central Cafeteria lunch rush peak settling down (Now 58% busy).',
        location: 'Central Food Court',
        level: 'info'
      },
      {
        timestamp: 'Just now',
        type: 'issue',
        message: 'Wi-Fi guest network telemetry restored in Cafeteria.',
        location: 'Cafeteria',
        level: 'success'
      }
    ];

    let counter = 0;
    const interval = setInterval(() => {
      const nextEvent = eventsPool[counter % eventsPool.length];
      counter++;

      const newAct: LiveActivity = {
        ...nextEvent,
        id: 'act-live-' + Date.now()
      };

      setActivities((prev) => [newAct, ...prev.slice(0, 7)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#040712] border-y border-white/10 py-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Live Ticker Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div className="font-syne font-bold text-sm tracking-wider text-white uppercase flex items-center gap-2">
            LIVE CAMPUS PULSE
            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-600/30 border border-cyan-400 text-cyan-300">
              REAL-TIME STREAM
            </span>
          </div>
        </div>

        {/* Ticking Live Stream Row */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activities[0]?.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 text-xs font-mono"
            >
              <span className="text-cyan-400 font-bold shrink-0">
                ● [{activities[0]?.timestamp}]
              </span>
              <span className="text-slate-200 truncate">
                {activities[0]?.message}
              </span>
              {activities[0]?.location && (
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 shrink-0 hidden lg:inline">
                  {activities[0]?.location}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action button */}
        <button
          onClick={() => onNavigateToTab?.('map')}
          className="shrink-0 text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1 uppercase"
        >
          <span>VIEW FULL STREAM MAP</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
