import crypto from 'node:crypto';
import { verifyToken } from '../services/authService.js';

/**
 * Reads the Bearer token, if any, and attaches the decoded payload to req.user.
 * Never rejects: routes decide whether authentication is required.
 */
export function attachUser(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const decoded = verifyToken(header.slice(7).trim());
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  }
  next();
}

/**
 * Rejects the request unless attachUser found a valid, unexpired token.
 */
export function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Bạn cần đăng nhập để sử dụng chức năng này'
    });
  }
  next();
}

/**
 * Rejects the request unless the caller holds one of the given roles.
 * Must run after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        error: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    next();
  };
}

/**
 * The owning account for every scoped query. Throws rather than silently
 * falling back to a shared account, which is what previously let any caller
 * read and write the admin's data.
 */
export function currentUserId(req) {
  const id = req?.user?.id;
  if (!id) {
    const err = new Error('Thiếu thông tin người dùng đã xác thực');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  return id;
}

/**
 * Tags each request so log lines and error responses can be correlated.
 */
export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
