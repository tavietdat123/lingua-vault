import { config } from '../config.js';

/**
 * Minimal security headers. Kept hand-rolled so the server keeps its
 * three-dependency footprint; only the headers that matter for a JSON API
 * plus a static SPA are set.
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.removeHeader('X-Powered-By');

  if (config.isProduction && (req.secure || req.headers['x-forwarded-proto'] === 'https')) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}

/**
 * CORS options for the `cors` package. With no CORS_ORIGINS configured the
 * request origin is reflected, which is what LAN device testing needs; set the
 * env var to lock a deployment down to known front-ends.
 */
export const corsOptions = {
  origin(origin, callback) {
    if (config.corsOrigins.length === 0) return callback(null, true);
    if (!origin) return callback(null, true); // curl, native fetch, same-origin
    callback(null, config.corsOrigins.includes(origin));
  },
  credentials: true,
  maxAge: 600
};
