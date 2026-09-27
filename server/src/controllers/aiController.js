import { processAiQuery } from '../services/aiService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function handleAiQuery(req, res, next) {
  try {
    const { query, sessionId } = req.body;

    if (!query || typeof query !== 'string') {
      return errorResponse(res, 'Query string is required in request body', 'VALIDATION_ERROR', 400);
    }

    const result = await processAiQuery(query, sessionId || 'default-session');
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}
