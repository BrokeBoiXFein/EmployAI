// ============================================================
// Auth middleware — the "wristband checker"
// ============================================================
// Pattern: this function sits between the request arriving and
// the route handler running. It either:
//   (a) verifies the JWT, attaches req.user, calls next()
//       → route handler runs as normal
//   (b) sends a 401 response and DOES NOT call next()
//       → route handler never runs
//
// Usage in a route file:
//   router.get('/protected', requireAuth, (req, res) => {
//     // req.user.id is now guaranteed to exist
//   });
// ============================================================

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // 1. Pull the token out of the Authorization header.
  //    Standard format: "Authorization: Bearer eyJhbGc..."
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  // 2. Verify the signature using our JWT_SECRET.
  //    If the token was tampered with, or signed with a different
  //    secret, this throws. We catch and 401.
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload looks like: { userId: "abc123", iat: ..., exp: ... }
    req.user = { id: payload.userId };
    next(); // hand off to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth: attach req.user if a valid token is present, but
// don't reject the request if it's missing. Useful for endpoints
// that work for both logged-in and anonymous users.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.userId };
    } catch (_) {
      // bad token? treat as anonymous, don't error
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
