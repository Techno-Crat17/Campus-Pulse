import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FloatingScrollArrowProps {
  /** Threshold in pixels from the top where the arrow points down vs up */
  threshold?: number;
  /** Optional ID of the section to scroll down to */
  mainContentId?: string;
}

export const FloatingScrollArrow: React.FC<FloatingScrollArrowProps> = ({
  threshold = 280,
  mainContentId = 'sec-problem'
}) => {
  const [isNearTop, setIsNearTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsNearTop(scrollY < threshold);
    };

    // Initialize state on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const handleClick = () => {
    if (isNearTop) {
      // Scroll down to main content
      const targetElement = document.getElementById(mainContentId) || document.getElementById('sec-ask');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({
          top: window.innerHeight * 0.95,
          behavior: 'smooth'
        });
      }
    } else {
      // Scroll smoothly back to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isNearTop ? 'Scroll down' : 'Scroll to top'}
      title={isNearTop ? 'Scroll down to content' : 'Scroll to top'}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#111111] text-white border-2 border-[#DC2626] shadow-xl hover:bg-[#DC2626] hover:border-[#B91C1C] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 focus:ring-offset-[#F5F4EF] group cursor-pointer"
    >
      {isNearTop ? (
        <ChevronDown className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-y-0.5" />
      ) : (
        <ChevronUp className="w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-y-0.5" />
      )}
    </button>
  );
};
