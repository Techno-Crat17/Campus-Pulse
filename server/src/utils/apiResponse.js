/**
 * Centralized API Response Helpers
 */

export const successResponse = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...meta
  });
};

export const errorResponse = (res, message, errorCode = 'INTERNAL_ERROR', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
    errorCode
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
