const NEWS_FEED_URL = 'https://docs.google.com/spreadsheets/d/1xW5mVzxKNmgPW8qTK4M-OX8jHIEBUga-4ahXS5k-22U/gviz/tq?tqx=out:json';
const EVENTS_FEED_URL = 'https://docs.google.com/spreadsheets/d/1mXLIU_vLZ86GgAiPVY9aASAwXJvWSoiAbYlakLjWCjs/gviz/tq?tqx=out:json';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minutes Cache TTL

let newsCache = {
  data: [],
  lastFetched: null
};

let eventsCache = {
  data: [],
  lastFetched: null
};

/**
 * Clean & sanitize text extracted from MSRIT source feed.
 */
function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper to safely format source link to official MSRIT site if relative.
 */
function sanitizeUrl(url, defaultFallback = 'https://www.msrit.edu/') {
  if (!url || typeof url !== 'string') return defaultFallback;
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('/')) {
    return `https://www.msrit.edu${clean}`;
  }
  return `https://www.msrit.edu/${clean}`;
}

/**
 * Safely parse Google Visualization API JSON response string.
 */
function parseGvizResponse(text) {
  const jsonString = text.replace(/^[^\(]+\(/, '').replace(/\);?\s*$/, '');
  return JSON.parse(jsonString);
}

/**
 * Fetch & Parse Official MSRIT Announcements / News.
 */
export async function getLiveAnnouncements(forceRefresh = false) {
  const now = Date.now();
  if (
    !forceRefresh &&
    newsCache.lastFetched &&
    now - newsCache.lastFetched < CACHE_TTL_MS &&
    newsCache.data.length > 0
  ) {
    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: new Date(newsCache.lastFetched).toISOString(),
      cached: true,
      data: newsCache.data
    };
  }

  try {
    const res = await fetch(NEWS_FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CampusPulseBackend/1.0'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from MSRIT news feed`);
    }

    const rawText = await res.text();
    const parsedJson = parseGvizResponse(rawText);
    const rows = parsedJson.table?.rows || [];

    const items = rows
      .filter((row) => row.c && row.c[6] && row.c[6].v)
      .map((row) => {
        const day = row.c[3] ? row.c[3].f || row.c[3].v : '';
        const month = row.c[4] ? row.c[4].v : '';
        const year = row.c[5] ? row.c[5].f || row.c[5].v : '';
        const title = sanitizeText(row.c[6] ? row.c[6].v : '');
        const desc = row.c[7] ? sanitizeText(row.c[7].v) : null;
        const moreInfo = row.c[10] ? sanitizeUrl(row.c[10].v, 'https://www.msrit.edu/news.html') : 'https://www.msrit.edu/news.html';

        return {
          title,
          date: [day, month, year].filter(Boolean).join(' '),
          startDate: null,
          endDate: null,
          location: 'MSRIT Campus',
          description: desc && desc !== title ? desc : null,
          sourceUrl: moreInfo,
          source: 'MSRIT Official Website',
          fetchedAt: new Date().toISOString()
        };
      })
      .reverse(); // Reverse to present latest items first

    if (items.length > 0) {
      newsCache = {
        data: items,
        lastFetched: now
      };
    }

    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: new Date(newsCache.lastFetched || now).toISOString(),
      cached: false,
      data: newsCache.data
    };
  } catch (err) {
    console.error('[MSRIT Service] Error fetching news:', err.message);
    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: newsCache.lastFetched ? new Date(newsCache.lastFetched).toISOString() : new Date().toISOString(),
      cached: true,
      errorNotice: 'Showing cached data due to MSRIT network latency',
      data: newsCache.data
    };
  }
}

/**
 * Fetch & Parse Official MSRIT Events.
 */
export async function getLiveEvents(forceRefresh = false) {
  const now = Date.now();
  if (
    !forceRefresh &&
    eventsCache.lastFetched &&
    now - eventsCache.lastFetched < CACHE_TTL_MS &&
    eventsCache.data.length > 0
  ) {
    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: new Date(eventsCache.lastFetched).toISOString(),
      cached: true,
      data: eventsCache.data
    };
  }

  try {
    const res = await fetch(EVENTS_FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CampusPulseBackend/1.0'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from MSRIT events feed`);
    }

    const rawText = await res.text();
    const parsedJson = parseGvizResponse(rawText);
    const rows = parsedJson.table?.rows || [];

    const items = rows
      .filter((row) => row.c && row.c[3] && row.c[3].v)
      .map((row) => {
        const title = sanitizeText(row.c[3] ? row.c[3].v : '');
        const pubDate = row.c[4] ? row.c[4].f || row.c[4].v : null;
        const day = row.c[8] ? row.c[8].f || row.c[8].v : '';
        const month = row.c[9] ? row.c[9].v : '';
        const year = row.c[10] ? row.c[10].f || row.c[10].v : '';
        const duration = row.c[11] ? sanitizeText(row.c[11].f || row.c[11].v) : null;
        const loc = row.c[12] ? sanitizeText(row.c[12].v) : 'MSRIT Campus';
        const moreInfo = row.c[13] ? sanitizeUrl(row.c[13].v, 'https://www.msrit.edu/events.html') : 'https://www.msrit.edu/events.html';

        return {
          title,
          date: [day, month, year].filter(Boolean).join(' ') || pubDate || 'Upcoming',
          startDate: duration || null,
          endDate: null,
          location: loc || 'MSRIT Campus',
          description: null,
          sourceUrl: moreInfo,
          source: 'MSRIT Official Website',
          fetchedAt: new Date().toISOString()
        };
      })
      .reverse(); // Reverse to present latest events first

    if (items.length > 0) {
      eventsCache = {
        data: items,
        lastFetched: now
      };
    }

    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: new Date(eventsCache.lastFetched || now).toISOString(),
      cached: false,
      data: eventsCache.data
    };
  } catch (err) {
    console.error('[MSRIT Service] Error fetching events:', err.message);
    return {
      success: true,
      source: 'MSRIT Official Website',
      lastFetched: eventsCache.lastFetched ? new Date(eventsCache.lastFetched).toISOString() : new Date().toISOString(),
      cached: true,
      errorNotice: 'Showing cached data due to MSRIT network latency',
      data: eventsCache.data
    };
  }
}
