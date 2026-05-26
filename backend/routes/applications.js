// ============================================================
// Applications routes
// ============================================================
//   GET    /api/applications           → list (most-recent first)
//   POST   /api/applications           → snapshot + create (status APPLIED)
//   PATCH  /api/applications/:id       → update status/notes
//   DELETE /api/applications/:id       → remove
//   DELETE /api/applications/by-adzuna/:adzunaId  → remove by adzuna id
//
// Status is a string enum we enforce in code (Prisma stores it as
// String for SQLite compat — we never migrated to a real enum).
// Allowed: APPLIED, INTERVIEWING, OFFERED, REJECTED, WITHDRAWN.
//
// To prevent duplicates ("I clicked Mark Applied twice"), POST uses
// findFirst+update-or-create pattern. If a user has already logged
// an application for this Adzuna id, we update the snapshot rather
// than creating a second row.
// ============================================================

const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_STATUSES = ['APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN'];

// ------------------------------------------------------------
// GET /api/applications
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      orderBy: { appliedAt: 'desc' }
    });
    res.json({ applications });
  } catch (err) {
    console.error('List applications error:', err);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// ------------------------------------------------------------
// POST /api/applications  → create (snapshot + status APPLIED)
// ------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { adzunaId, title, company, applyUrl } = req.body || {};
    if (!adzunaId || !title || !applyUrl) {
      return res.status(400).json({ error: 'adzunaId, title, applyUrl required' });
    }

    // Schema has no unique constraint on (userId, adzunaId) for Application,
    // so we enforce it in code: refresh existing row instead of duplicating.
    const existing = await prisma.application.findFirst({
      where: { userId: req.user.id, adzunaId: String(adzunaId) }
    });

    let application;
    if (existing) {
      application = await prisma.application.update({
        where: { id: existing.id },
        data: { title, company, applyUrl }
      });
    } else {
      application = await prisma.application.create({
        data: {
          userId: req.user.id,
          adzunaId: String(adzunaId),
          title, company, applyUrl,
          status: 'APPLIED'
        }
      });
    }
    res.status(201).json({ application });
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ error: 'Failed to record application' });
  }
});

// ------------------------------------------------------------
// PATCH /api/applications/:id  → update status / notes
// ------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body || {};

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Ownership check
    const owned = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!owned) return res.status(404).json({ error: 'Application not found' });

    // Build update payload from only the fields the client sent
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data
    });
    res.json({ application });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// ------------------------------------------------------------
// DELETE /api/applications/by-adzuna/:adzunaId
// ------------------------------------------------------------
router.delete('/by-adzuna/:adzunaId', async (req, res) => {
  try {
    await prisma.application.deleteMany({
      where: { userId: req.user.id, adzunaId: req.params.adzunaId }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ------------------------------------------------------------
// DELETE /api/applications/:id
// ------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await prisma.application.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;
