import { processAiQuery } from '../services/aiService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function handleAiQuery(req, res, next) {
  try {
    const { query, sessionId } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return errorResponse(res, 'Query string is required in request body', 'VALIDATION_ERROR', 400);
    }

    const result = await processAiQuery(query, sessionId || 'default-session');

    // Ensure safe, structured response per spec Section 36
    return res.status(200).json({
      success: true,
      intent: result.intent || 'GENERAL_CAMPUS_QUERY',
      answer: result.answer || result.responseText || '',
      data: result.data || null,
      actions: result.actions || []
    });
  } catch (err) {
    // Prevent exposing database errors, stack traces, or Mongo errors (Section 36 & 40)
    console.error('[Ask Campus AI Engine Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Campus data is temporarily unavailable.'
    });
  }
}
