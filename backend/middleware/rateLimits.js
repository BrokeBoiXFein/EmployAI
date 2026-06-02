// ============================================================
// Rate limiters — Tier 1 abuse protection
// ============================================================
// Why this file exists: without rate limits, anyone with a `for`
// loop can:
//   - Create 100,000 accounts and fill our Neon DB
//   - Spam resume uploads, costing real money in Gemini API calls
//   - Brute-force a known email's password at ~10 guesses/sec
//   - Run the chat / Coach / Builder until the GEMINI_API_KEY quota
//     is exhausted for everyone
//
// Each limiter is a tiny piece of Express middleware. The route
// runs only if the request is under the limit; otherwise the
// limiter sends a 429 (Too Many Requests) and the route never
// executes. Counts are kept in-memory per process. That's fine
// on a single Render dyno; if we ever scale to multiple instances
// we'd need a shared store (Redis), but for now in-memory is
// simpler and accurate enough.
// ============================================================

const rateLimit = require('express-rate-limit');

// Standard JSON error shape so the frontend can show a nice message
const message = (label) => ({
  error: `You've hit the rate limit for ${label}. Try again in a bit.`
});

// Key by the authenticated user when we can, fall back to IP for
// unauthenticated endpoints. The userKey function expects this
// middleware to run AFTER requireAuth on protected routes.
const userKey = (req) => req.user?.id || req.ip;

// Key by IP + (lowercased) email for the login endpoint. Catches
// "same attacker hammering the same account" and "same attacker
// trying many accounts" with one rule.
const ipEmailKey = (req) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  return `${req.ip}|${email || 'no-email'}`;
};

// ------------------------------------------------------------
// Auth limiters
// ------------------------------------------------------------

// Signup: 5 per hour per IP. Real users sign up once.
const signupHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('signups in the last hour'),
});

// Signup: 5 per 24 hours per IP. Stops slow-burn enumeration —
// an attacker who creates 5/hour stops here at 5/day total.
const signupDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('signups today'),
});

// Login: 5 per 15 min per (IP, email) combo. The combo key means
// one bad actor can't lock out a victim by triggering the limiter
// on the victim's email from a different IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipEmailKey,
  message: message('login attempts'),
});

// ------------------------------------------------------------
// Per-user limiters (require auth first)
// ------------------------------------------------------------

// Resume upload: 10/day per user. Each upload is a Gemini parse
// AND a Gemini embedding call — the most expensive endpoint we
// have. A real user uploads ~1-3 over the life of their account.
const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: message('resume uploads today'),
});

// Job search: 60/hour per user. A real user runs maybe 5-10
// searches in a session.
const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: message('job searches in the last hour'),
});

// Chat: 30/hour. Chat endpoint is unauthenticated, so this keys
// on IP via the userKey fallback.
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: message('chat messages in the last hour'),
});

// Studio Coach + Builder: 30/hour per user. Each is a Gemini
// generateContent call.
const geminiUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: message('Coach/Builder generations in the last hour'),
});

module.exports = {
  signupHourLimiter,
  signupDayLimiter,
  loginLimiter,
  uploadLimiter,
  searchLimiter,
  chatLimiter,
  geminiUserLimiter,
};
