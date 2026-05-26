// ============================================================
// Saved jobs routes
// ============================================================
//   GET    /api/saved          → list (most-recent first)
//   POST   /api/saved          → snapshot + save a job
//   DELETE /api/saved/:id      → unsave (by saved-row id)
//   DELETE /api/saved/by-adzuna/:adzunaId  → unsave (by Adzuna id, easier from job cards)
//
// All require auth. We snapshot the Adzuna data at save time because
// Adzuna listings expire — without a snapshot, saved jobs would
// turn into dead links over time.
// ============================================================

const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ------------------------------------------------------------
// GET /api/saved
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: req.user.id },
      orderBy: { savedAt: 'desc' }
    });
    res.json({ savedJobs });
  } catch (err) {
    console.error('List saved error:', err);
    res.status(500).json({ error: 'Failed to load saved jobs' });
  }
});

// ------------------------------------------------------------
// POST /api/saved  → save a job (snapshot)
// ------------------------------------------------------------
// Expects body: { adzunaId, title, company, location, salaryMin,
//                 salaryMax, description, applyUrl, matchScore }
// Uses upsert against the (userId, adzunaId) unique constraint so
// re-saving an already-saved job is a no-op instead of an error.
router.post('/', async (req, res) => {
  try {
    const {
      adzunaId, title, company, location,
      salaryMin, salaryMax, description, applyUrl, matchScore
    } = req.body || {};

    if (!adzunaId || !title || !applyUrl) {
      return res.status(400).json({ error: 'adzunaId, title, applyUrl required' });
    }

    const saved = await prisma.savedJob.upsert({
      where: { userId_adzunaId: { userId: req.user.id, adzunaId: String(adzunaId) } },
      create: {
        userId: req.user.id,
        adzunaId: String(adzunaId),
        title, company, location,
        salaryMin, salaryMax, description, applyUrl,
        matchScore: typeof matchScore === 'number' ? matchScore : null
      },
      update: {
        // Refresh the snapshot — Adzuna might've updated the listing.
        // Saved date stays the same (Prisma doesn't change @default fields on update).
        title, company, location, salaryMin, salaryMax, description, applyUrl,
        matchScore: typeof matchScore === 'number' ? matchScore : null
      }
    });

    res.status(201).json({ saved });
  } catch (err) {
    console.error('Save job error:', err);
    res.status(500).json({ error: 'Failed to save job' });
  }
});

// ------------------------------------------------------------
// DELETE /api/saved/by-adzuna/:adzunaId  → unsave by Adzuna id
// ------------------------------------------------------------
// More convenient from the job-card UI — we have the Adzuna id at
// hand, not the SavedJob row id.
router.delete('/by-adzuna/:adzunaId', async (req, res) => {
  try {
    await prisma.savedJob.deleteMany({
      where: { userId: req.user.id, adzunaId: req.params.adzunaId }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Unsave error:', err);
    res.status(500).json({ error: 'Failed to unsave job' });
  }
});

// ------------------------------------------------------------
// DELETE /api/saved/:id  → unsave by row id (used from /jobs page)
// ------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await prisma.savedJob.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Unsave error:', err);
    res.status(500).json({ error: 'Failed to unsave job' });
  }
});

module.exports = router;
