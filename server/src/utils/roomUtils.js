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
