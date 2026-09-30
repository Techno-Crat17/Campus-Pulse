// Campus Pulse PWA Service Worker Registration

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    // Build base-aware SW URL
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
      ? import.meta.env.BASE_URL
      : '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const swUrl = `${cleanBase}sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (isLocalhost) {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        }
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}
