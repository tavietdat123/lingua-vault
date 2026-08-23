/**
 * Fixed-window in-memory rate limiter. No external dependency and no shared
 * store: this server is a single process, so a Map is sufficient.
 */
const buckets = new Map();
let sweepTimer = null;

const clientKey = (req) =>
  req.ip ||
  req.headers['x-forwarded-for']?.split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown';

function sweep(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit({ max, windowMs, name = 'api', keyFn = clientKey }) {
  if (!sweepTimer) {
    sweepTimer = setInterval(() => sweep(Date.now()), Math.max(windowMs, 30_000));
    sweepTimer.unref?.();
  }

  return (req, res, next) => {
    const now = Date.now();
    const key = `${name}:${keyFn(req)}`;
    let entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút'
      });
    }
    next();
  };
}

/** Test helper: drop all counters. */
export function resetRateLimits() {
  buckets.clear();
}
