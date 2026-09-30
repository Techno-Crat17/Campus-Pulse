import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Grid,
  ArrowRight,
  Tag
} from 'lucide-react';
import { EditorialHero } from '../components/EditorialHero';
import { EditorialFooter } from '../components/EditorialFooter';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const HomePage: React.FC = () => {
  const { isInstalled } = usePwaInstall();

  const moduleCards = [
    {
      title: 'ASK CAMPUS AI',
      subtitle: 'Natural language & Hinglish query engine for faculty, libraries & rooms.',
      path: '/ask-ai',
      badge: '02 / AI TELEMETRY',
      icon: Sparkles,
      color: 'border-[#DC2626] text-[#DC2626]',
      desktopOnly: true
    },
    {
      title: 'CAMPUS MAP',
      subtitle: 'Interactive 3D satellite polygon explorer with building label telemetry.',
      path: '/map',
      badge: '03 / GEOGRAPHIC EXPLORER',
      icon: MapPin,
      color: 'border-blue-600 text-blue-600'
    },
    {
      title: 'LIBRARIES & SPACES',
      subtitle: 'Real-time occupancy, operating hours & study hall availability across 6 units.',
      path: '/libraries',
      badge: '04 / LIVE OCCUPANCY',
      icon: BookOpen,
      color: 'border-emerald-600 text-emerald-600'
    },
    {
      title: 'FACULTY DIRECTORY',
      subtitle: 'Dynamic schedule-driven faculty availability, active rooms & cabin locations.',
      path: '/faculty',
      badge: '05 / 409 VERIFIED ROSTER',
      icon: Users,
      color: 'border-amber-600 text-amber-600'
    },
    {
      title: 'REPORT AN ISSUE',
      subtitle: 'Anonymous infrastructure, cleanliness & utility issue dispatch queue.',
      path: '/issues',
      badge: '06 / DISPATCH QUEUE',
      icon: AlertTriangle,
      color: 'border-rose-600 text-rose-600'
    },
    {
      title: 'LOST & FOUND',
      subtitle: 'Community recovery telemetry & campus lost and found item records.',
      path: '/lost-found',
      badge: '07 / COMMUNITY RECOVERY',
      icon: Tag,
      color: 'border-teal-600 text-teal-600'
    },
    {
      title: 'OTHERS & FEEDS',
      subtitle: 'Official MSRIT announcements, live events, emergency contacts & clubs.',
      path: '/others',
      badge: '08 / CAMPUS UTILITIES',
      icon: Grid,
      color: 'border-purple-600 text-purple-600'
    }
  ];

  // In installed/standalone PWA mode, hide the Ask Campus AI card completely
  const visibleCards = moduleCards.filter((mod) => !(mod.desktopOnly && isInstalled));

  return (
    <div className="space-y-12">
      {/* 01. Hero Section */}
      <EditorialHero />

      {/* 02. Dashboard Overview & Modules Section */}
      <section className="py-12 px-4 sm:px-8 lg:px-12 max-w-[1700px] mx-auto space-y-12 font-mono">

        {/* Section Heading */}
        <div className="space-y-2">
          <div className="text-xs text-[#DC2626] font-bold uppercase tracking-widest">
            SYSTEM INDEX // CHOOSE MODULE
          </div>
          <h2 className="text-3xl sm:text-5xl font-syne font-extrabold uppercase text-[#111111] dark:text-[#F3F3EE] tracking-tight">
            CAMPUS MODULES & DIRECTORY
          </h2>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((mod) => {
            const IconComp = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className={`group p-6 sm:p-7 bg-white dark:bg-[#1A1C24] border-2 border-[#111111]/15 dark:border-white/15 hover:border-[#DC2626] transition-all flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xs ${
                  mod.desktopOnly ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#666660] dark:text-[#9CA3AF]">
                      {mod.badge}
                    </span>
                    <IconComp className="w-5 h-5 text-[#DC2626]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors leading-tight">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-[#666660] dark:text-[#9CA3AF] leading-relaxed">
                    {mod.subtitle}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#111111]/10 dark:border-white/10 flex items-center justify-between text-xs font-bold uppercase text-[#111111] dark:text-[#F3F3EE] group-hover:text-[#DC2626] transition-colors">
                  <span>OPEN MODULE</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#DC2626]" />
                </div>
              </Link>
            );
          })}
        </div>

      </section>

      {/* Persistent Footer on HomePage */}
      <EditorialFooter />
    </div>
  );
};
