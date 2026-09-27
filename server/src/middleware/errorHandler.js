import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) {
  console.error('[ServerError]', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 'VALIDATION_ERROR', 400);
  }

  if (err.code === 11000) {
    return errorResponse(res, 'Duplicate resource entry already exists', 'DUPLICATE_ENTRY', 409);
  }

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message,
    'INTERNAL_SERVER_ERROR',
    500
  );
}
