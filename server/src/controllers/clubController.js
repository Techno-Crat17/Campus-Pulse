import { getLiveClubs, getClubById } from '../services/clubService.js';

export async function getClubs(req, res, next) {
  try {
    const { category, q, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    const result = await getLiveClubs({ category, q, limit, forceRefresh });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getClub(req, res, next) {
  try {
    const { id } = req.params;
    const club = await getClubById(id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: `Club '${id}' not found in MSRIT verified directory.`
      });
    }
    return res.status(200).json({
      success: true,
      data: club
    });
  } catch (err) {
    next(err);
  }
}
