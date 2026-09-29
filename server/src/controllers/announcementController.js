import { getLiveAnnouncements } from '../services/msritService.js';

export async function getAnnouncements(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getLiveAnnouncements(forceRefresh);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
