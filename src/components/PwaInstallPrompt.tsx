import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  MapPin,
  ShieldAlert,
  Search,
  CheckCircle2
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const PwaInstallPrompt: React.FC = () => {
  const {
    isInstalled,
    isPromptVisible,
    hasNativePrompt,
    isIOS,
    installApp,
    dismissPrompt,
  } = usePwaInstall();

  // If already installed or prompt is not visible, render nothing
  if (isInstalled || !isPromptVisible) {
    return null;
  }

  const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
    ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
    : '/';

  return (
    <AnimatePresence>
      <motion.div
        key="pwa-install-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
        onClick={dismissPrompt}
      >
        <motion.div
          key="pwa-install-card"
          initial={{ y: 50, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#121318] text-[#F3F3EE] border border-[#DC2626]/30 shadow-2xl overflow-hidden rounded-none pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Top Red Accent Line */}
          <div className="h-1 w-full bg-[#DC2626]" />

          {/* Close Button */}
          <button
            onClick={dismissPrompt}
            aria-label="Close install prompt"
            className="absolute top-4 right-4 p-2 text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Header / Brand & Badge */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-black border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src={`${BASE_URL}assets/campus-pulse-icon.png`}
                  alt="Campus Pulse"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="font-mono text-[10px] text-[#DC2626] uppercase font-bold tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-ping" />
                  <span>CAMPUS PULSE // MOBILE PWA</span>
                </div>
                <h3 className="font-syne text-xl font-bold uppercase tracking-tight text-white">
                  Install Campus Pulse
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed font-sans">
              Get instant, full-screen access to your campus operating layer right from your home screen with faster load times and offline support.
            </p>

            {/* Feature Highlights Matrix */}
            <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/10 font-mono text-xs text-[#E5E7EB]">
              <div className="flex items-center gap-2.5 py-1">
                <Sparkles className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span>Ask Campus AI &amp; Instant Answers</span>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span>Interactive Map &amp; Real-Time Spaces</span>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <Search className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span>Faculty Directory &amp; Lost &amp; Found</span>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span>Fast Issue Reporting &amp; Contacts</span>
              </div>
            </div>

            {/* Action / Instructions State */}
            {hasNativePrompt ? (
              // Native Browser Install Flow
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => installApp()}
                  className="w-full py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>INSTALL APP</span>
                </button>

                <button
                  onClick={dismissPrompt}
                  className="w-full py-2.5 bg-transparent hover:bg-white/5 text-[#9CA3AF] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  NOT NOW
                </button>
              </div>
            ) : isIOS ? (
              // iOS Safari Custom Instructions
              <div className="space-y-3 pt-2">
                <div className="bg-black/60 border border-white/15 p-3.5 space-y-2.5 text-xs text-[#D1D5DB] font-mono">
                  <div className="text-[11px] text-[#DC2626] font-bold uppercase tracking-wider">
                    HOW TO INSTALL ON SAFARI (IOS):
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span className="flex items-center gap-1.5">
                      Tap the <Share className="w-3.5 h-3.5 text-sky-400 inline mx-0.5" /> <strong>Share</strong> button below
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span className="flex items-center gap-1.5">
                      Scroll and tap <PlusSquare className="w-3.5 h-3.5 text-[#DC2626] inline mx-0.5" /> <strong>Add to Home Screen</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>Tap <strong>Add</strong> in the top-right corner</span>
                  </div>
                </div>

                <button
                  onClick={dismissPrompt}
                  className="w-full py-3 bg-[#1F2026] hover:bg-[#2B2D35] text-white font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>GOT IT</span>
                </button>
              </div>
            ) : (
              // Generic Mobile Browser Instructions
              <div className="space-y-3 pt-2">
                <div className="bg-black/60 border border-white/15 p-3.5 space-y-2 text-xs text-[#D1D5DB] font-mono">
                  <div className="text-[11px] text-[#DC2626] font-bold uppercase tracking-wider">
                    INSTALLATION INSTRUCTIONS:
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Open your browser options menu (<strong>⋮</strong>) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>

                <button
                  onClick={dismissPrompt}
                  className="w-full py-3 bg-[#1F2026] hover:bg-[#2B2D35] text-white font-mono text-xs uppercase font-bold tracking-widest transition-all cursor-pointer"
                >
                  <span>GOT IT</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
