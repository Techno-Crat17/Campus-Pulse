import { getLiveClubs } from '../services/clubService.js';

export async function getClubs(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getLiveClubs(forceRefresh);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
