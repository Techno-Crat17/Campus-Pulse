import { Club } from '../models/Club.js';
import { VERIFIED_MSRIT_CLUBS } from '../data/clubsData.js';
import mongoose from 'mongoose';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minutes Cache TTL

let clubCache = {
  data: [],
  lastFetched: null
};

/**
 * Normalizes query string for case-insensitive matching
 */
function normalizeSearch(str) {
  return (str || '').toLowerCase().trim();
}

/**
 * Fetch clubs from MongoDB with in-memory fallback
 */
export async function getLiveClubs({ category, q, limit, forceRefresh = false } = {}) {
  const isDbConnected = mongoose.connection.readyState === 1;

  let allClubs = [];

  if (isDbConnected) {
    try {
      let query = { active: true };
      if (category && category !== 'All') {
        query.category = category;
      }
      if (q && q.trim()) {
        const norm = normalizeSearch(q);
        query.$or = [
          { name: { $regex: norm, $options: 'i' } },
          { normalizedName: { $regex: norm, $options: 'i' } },
          { description: { $regex: norm, $options: 'i' } },
          { category: { $regex: norm, $options: 'i' } },
          { relatedChapters: { $regex: norm, $options: 'i' } }
        ];
      }

      let dbQuery = Club.find(query).sort({ category: 1, name: 1 });
      if (limit && Number.isInteger(Number(limit))) {
        dbQuery = dbQuery.limit(Number(limit));
      }

      allClubs = await dbQuery.lean();

      // If database has records, format and return
      if (allClubs && allClubs.length > 0) {
        return {
          success: true,
          source: 'Provided MSRIT club directory',
          lastFetched: new Date().toISOString(),
          cached: false,
          data: allClubs.map(c => ({
            id: c._id ? String(c._id) : c.normalizedName,
            name: c.name,
            normalizedName: c.normalizedName || normalizeSearch(c.name),
            category: c.category,
            description: c.description,
            type: c.type || 'CLUB',
            relatedChapters: c.relatedChapters || [],
            source: c.source || 'Provided MSRIT club directory',
            active: c.active !== false
          }))
        };
      }
    } catch (err) {
      console.warn('[ClubService] Database query failed, using static verified directory fallback:', err.message);
    }
  }

  // Fallback to verified in-memory dataset
  let fallbackList = [...VERIFIED_MSRIT_CLUBS];

  if (category && category !== 'All') {
    fallbackList = fallbackList.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  if (q && q.trim()) {
    const norm = normalizeSearch(q);
    fallbackList = fallbackList.filter(c =>
      c.normalizedName.includes(norm) ||
      c.name.toLowerCase().includes(norm) ||
      c.description.toLowerCase().includes(norm) ||
      c.category.toLowerCase().includes(norm) ||
      (c.relatedChapters && c.relatedChapters.some(rc => rc.toLowerCase().includes(norm)))
    );
  }

  if (limit && Number.isInteger(Number(limit))) {
    fallbackList = fallbackList.slice(0, Number(limit));
  }

  return {
    success: true,
    source: 'Provided MSRIT club directory',
    lastFetched: new Date().toISOString(),
    cached: false,
    data: fallbackList.map((c, i) => ({
      id: c.id || c.normalizedName || `club-${i + 1}`,
      name: c.name,
      normalizedName: c.normalizedName || normalizeSearch(c.name),
      category: c.category,
      description: c.description,
      type: c.type || 'CLUB',
      relatedChapters: c.relatedChapters || [],
      source: c.source || 'Provided MSRIT club directory',
      active: c.active !== false
    }))
  };
}

/**
 * Fetch single club by ID or normalized name
 */
export async function getClubById(idOrName) {
  const norm = normalizeSearch(idOrName);
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    try {
      let club = null;
      if (mongoose.Types.ObjectId.isValid(idOrName)) {
        club = await Club.findById(idOrName).lean();
      }
      if (!club) {
        club = await Club.findOne({
          $or: [
            { normalizedName: norm },
            { name: { $regex: `^${norm}$`, $options: 'i' } }
          ]
        }).lean();
      }
      if (club) {
        return {
          id: String(club._id),
          name: club.name,
          normalizedName: club.normalizedName,
          category: club.category,
          description: club.description,
          type: club.type || 'CLUB',
          relatedChapters: club.relatedChapters || [],
          source: club.source || 'Provided MSRIT club directory',
          active: club.active !== false
        };
      }
    } catch (err) {
      console.warn('[ClubService] Database lookup failed, falling back to static dataset:', err.message);
    }
  }

  // Static fallback
  const found = VERIFIED_MSRIT_CLUBS.find(c =>
    c.normalizedName === norm ||
    c.name.toLowerCase() === norm ||
    (c.id && c.id === idOrName)
  );

  if (found) {
    return {
      id: found.id || found.normalizedName,
      name: found.name,
      normalizedName: found.normalizedName,
      category: found.category,
      description: found.description,
      type: found.type || 'CLUB',
      relatedChapters: found.relatedChapters || [],
      source: found.source || 'Provided MSRIT club directory',
      active: found.active !== false
    };
  }

  return null;
}
