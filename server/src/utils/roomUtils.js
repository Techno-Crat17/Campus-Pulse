/**
 * Room Number Normalization Utility
 * Converts variations like "AB401", "AB 401", "AB-401", "LHC 204", "LHC204" to uniform keys.
 */

export function normalizeRoomNumber(roomStr) {
  if (!roomStr || typeof roomStr !== 'string') return '';
  return roomStr
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '');
}

export function normalizeRoomNameForSearch(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[’‘`'"]/g, '')
    .replace(/[–—_–-]/g, ' ')
    .replace(/\b(ii|2)\b/gi, '2')
    .replace(/\b(i|1)\b/gi, '1')
    .replace(/\b(iii|3)\b/gi, '3')
    .replace(/\b(iv|4)\b/gi, '4')
    .replace(/\b(v|5)\b/gi, '5')
    .replace(/\b(vi|6)\b/gi, '6')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildRoomSearchQuery(queryStr) {
  const norm = normalizeRoomNumber(queryStr);
  if (!norm) return {};

  return {
    $or: [
      { roomNumber: { $regex: norm, $options: 'i' } },
      { roomNumberNormalized: { $regex: norm, $options: 'i' } }
    ]
  };
}
