import { getLiveEvents } from '../services/msritService.js';

export async function getEvents(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getLiveEvents(forceRefresh);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
