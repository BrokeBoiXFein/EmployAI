// ============================================================
// Auth routes — signup, login, me
// ============================================================
// All three endpoints work together:
//   POST /api/auth/signup → create account, return JWT
//   POST /api/auth/login  → verify credentials, return JWT
//   GET  /api/auth/me     → return the current user (requires JWT)
// ============================================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  signupHourLimiter,
  signupDayLimiter,
  loginLimiter,
} = require('../middleware/rateLimits');

const router = express.Router();

// bcrypt "cost factor". Higher = slower to hash (good for security) but
// slower to log in. 10 is the standard default — ~100ms per hash.
const BCRYPT_ROUNDS = 10;

// Helper: sign a JWT for a given user ID.
// We put `userId` in the payload because that's all we need to identify
// them. NEVER put passwords or sensitive data in a JWT — the payload
// is base64-encoded, not encrypted. Anyone can read it.
function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Helper: shape the user object we return to the frontend.
// NEVER send passwordHash. Even hashed, it's nobody's business.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt
  };
}

// ------------------------------------------------------------
// POST /api/auth/signup
// ------------------------------------------------------------
router.post('/signup', signupHourLimiter, signupDayLimiter, async (req, res) => {
  try {
    const { email, password, name, preferredLanguage } = req.body || {};

    // Basic validation. We're not trying to be cute here — just block
    // obviously bad input. The DB's @unique on email is the real safety net.
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email is taken BEFORE hashing (hashing is slow).
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash the password. bcrypt also handles salting automatically —
    // each hash gets a unique random salt baked in, so two users with
    // the same password get different hashes.
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        preferredLanguage: preferredLanguage || 'English'
      }
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // SECURITY NOTE: return the same error whether the user doesn't exist
    // OR the password is wrong. If we returned "user not found" vs
    // "wrong password", attackers could enumerate which emails are registered.
    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ------------------------------------------------------------
// GET /api/auth/me  — "who am I?"
// ------------------------------------------------------------
// Frontend calls this on app load to check if the stored JWT is still valid
// and to get the current user data. If 401, the frontend logs them out.
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
