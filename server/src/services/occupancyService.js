/**
 * Library Occupancy Calculation & Refresh Service
 * Manages dynamic estimated occupancy for ESB, LHC, and Apex Libraries.
 */

const EVENING_CYCLE_MS = 35000; // 35-second cycle (within 30-60s requirement)
let cachedCycleBucket = -1;
let cachedEveningValues = {};

function generateUniqueValues(count, min, max) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function isLibraryOpen(dateObj = new Date()) {
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
  const openingMinutes = 9 * 60;   // 09:00 = 540 min
  const closingMinutes = 21 * 60;  // 21:00 = 1260 min
  return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
}

export function getEveningOccupancyMap() {
  const now = Date.now();
  const cycleBucket = Math.floor(now / EVENING_CYCLE_MS);

  if (cycleBucket !== cachedCycleBucket || !cachedEveningValues['esb_main_library']) {
    cachedCycleBucket = cycleBucket;
    const uniqueValues = generateUniqueValues(3, 2, 8); // 20%, 30%, 40%, 50%, 60%, 70%, 80%
    const esbVal = (uniqueValues[0] || 4) * 10;
    const lhcVal = (uniqueValues[1] || 7) * 10;
    const apexVal = (uniqueValues[2] || 3) * 10;

    cachedEveningValues = {
      'esb_main_library': esbVal,
      'lhc_unit_2_library': lhcVal,
      'apex_unit_3_library': apexVal
    };
  }
  return cachedEveningValues;
}

export function calculateEstimatedOccupancy(libraryId, dateObj = new Date()) {
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
  const openingMinutes = 9 * 60;   // 09:00
  const closingMinutes = 21 * 60;  // 21:00

  // 1. Outside library hours (00:00-08:59 or 21:00-23:59) -> 0%
  if (currentMinutes < openingMinutes || currentMinutes >= closingMinutes) {
    return 0;
  }

  // 2. Evening period (18:00-20:59) -> Distinct dynamic values for ESB, LHC, Apex
  if (currentMinutes >= 18 * 60 && currentMinutes < 21 * 60) {
    const eveningMap = getEveningOccupancyMap();
    const idKey = libraryId.includes('esb')
      ? 'esb_main_library'
      : libraryId.includes('lhc')
      ? 'lhc_unit_2_library'
      : 'apex_unit_3_library';
    return eveningMap[idKey] || 40;
  }

  // 3. Daytime (09:00-17:59) -> Realistic dynamic estimates
  let base = 40;
  if (libraryId.includes('esb')) base = 46;
  else if (libraryId.includes('lhc')) base = 38;
  else if (libraryId.includes('apex')) base = 32;

  let timeEffect = 0;
  if (currentMinutes >= 540 && currentMinutes < 600) timeEffect = -4;
  else if (currentMinutes >= 600 && currentMinutes < 750) timeEffect = -14;
  else if (currentMinutes >= 750 && currentMinutes < 825) timeEffect = 24;
  else if (currentMinutes >= 825 && currentMinutes < 960) timeEffect = -10;
  else if (currentMinutes >= 960 && currentMinutes < 1020) timeEffect = 20;

  const ripple = Math.round(3 * Math.sin(currentMinutes * 0.3 + libraryId.length));
  const raw = base + timeEffect + ripple;

  return Math.max(0, Math.min(100, Math.round(raw)));
}
