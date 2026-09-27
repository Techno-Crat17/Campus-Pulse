import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'full' | 'drawer';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'drawer') {
    return (
      <div className={`flex items-center justify-between p-4 border border-[#111111]/15 dark:border-white/15 bg-white/40 dark:bg-white/5 font-mono text-xs ${className}`}>
        <div className="space-y-0.5">
          <div className="text-[10px] text-[#DC2626] font-bold uppercase tracking-widest">
            DISPLAY THEME
          </div>
          <div className="text-sm font-syne font-bold text-[#111111] dark:text-[#F3F3EE] flex items-center gap-2">
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>DARK MODE</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>LIGHT MODE</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="px-3.5 py-2 border border-[#111111]/25 dark:border-white/25 hover:border-[#DC2626] dark:hover:border-[#DC2626] bg-[#111111] dark:bg-white text-white dark:text-[#0E0F12] hover:bg-[#DC2626] dark:hover:bg-[#DC2626] dark:hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-white" />
              <span>DARK</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`px-3 py-1.5 border border-[#111111]/20 dark:border-white/20 hover:border-[#DC2626] dark:hover:border-[#DC2626] text-[11px] tracking-widest uppercase transition-all flex items-center gap-1.5 bg-white/70 dark:bg-white/5 hover:text-[#DC2626] text-[#111111] dark:text-[#F3F3EE] font-mono cursor-pointer shadow-2xs select-none active:scale-95 ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          <span className="font-bold">LIGHT</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#DC2626] transition-transform duration-300 hover:-rotate-12" />
          <span className="font-bold">DARK</span>
        </>
      )}
    </button>
  );
};
