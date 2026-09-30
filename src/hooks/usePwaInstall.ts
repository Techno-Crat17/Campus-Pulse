import { useState, useEffect, useCallback } from 'react';

// Standard TypeScript interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'campuspulse_pwa_dismissed_at';
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  useEffect(() => {
    // 1. Detect Standalone / Already Installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // 2. Detect Mobile / Tablet device using robust User Agent & Touch heuristics
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileDevice = isMobileUA || (hasCoarsePointer && isTouchDevice);
    setIsMobileOrTablet(isMobileDevice);

    // 3. Detect iOS Safari specifically
    const isIOSDevice =
      (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // If already installed or not on mobile/tablet, do not display prompt
    if (isStandalone || !isMobileDevice) {
      return;
    }

    // Check dismissal persistence cooldown
    const lastDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
    const now = Date.now();
    const isCooldownActive = lastDismissed && now - parseInt(lastDismissed, 10) < DISMISS_COOLDOWN_MS;

    // 4. Capture native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      if (!isCooldownActive) {
        // Small initial delay so user sees the page first
        setTimeout(() => {
          setIsPromptVisible(true);
        }, 1200);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsPromptVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. For iOS or browsers without beforeinstallprompt: display prompt if not dismissed
    if (isIOSDevice && !isCooldownActive) {
      setTimeout(() => {
        setIsPromptVisible(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsPromptVisible(false);
        setDeferredPrompt(null);
        return true;
      } else {
        // User dismissed the browser prompt
        localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
        setIsPromptVisible(false);
        return false;
      }
    } catch (err) {
      console.error('[PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    setIsPromptVisible(false);
  }, []);

  const openPromptManually = useCallback(() => {
    setIsPromptVisible(true);
  }, []);

  return {
    isInstallable,
    isInstalled,
    isMobileOrTablet,
    isIOS,
    isPromptVisible,
    hasNativePrompt: !!deferredPrompt,
    installApp,
    dismissPrompt,
    openPromptManually,
  };
}
