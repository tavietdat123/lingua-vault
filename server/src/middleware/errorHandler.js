import { config } from '../config.js';

/**
 * Wraps a handler so a rejected promise or thrown error reaches the central
 * error middleware instead of hanging the request.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res, next);
    if (out && typeof out.catch === 'function') out.catch(next);
  } catch (err) {
    next(err);
  }
};

/** Unknown /api/* path -> JSON 404 instead of the SPA fallback. */
export function apiNotFound(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    error: `Không tìm thấy endpoint ${req.method} ${req.path}`
  });
}

/**
 * Last-resort handler. Keeps the existing `{ success, error }` response shape
 * so no client needs to change, and hides internals in production.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    console.error(`[${req.id || '-'}] ${req.method} ${req.originalUrl} ->`, err);
  }

  if (res.headersSent) return next(err);

  res.status(status).json({
    success: false,
    code,
    error: status >= 500 && config.isProduction ? 'Lỗi hệ thống, vui lòng thử lại' : err.message,
    requestId: req.id,
    ...(err.fields ? { fields: err.fields } : {})
  });
}
