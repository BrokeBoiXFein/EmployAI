// ============================================================
// Resume routes — manage a user's library of saved resumes
// ============================================================
//
//   GET    /api/resumes              list all (with active marker)
//   GET    /api/resumes/:id          fetch one (verifies ownership)
//   POST   /api/resumes              upload + analyze (creates new)
//   PATCH  /api/resumes/:id          rename (label field)
//   POST   /api/resumes/:id/activate set as the user's active resume
//   DELETE /api/resumes/:id          remove
//
// Every endpoint requires auth. Every read/write verifies that the
// resume actually belongs to the requesting user — never trust
// req.params.id alone, even with JWT auth.
// ============================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { analyzeResumeFile } = require('../services/gemini');

const router = express.Router();
router.use(requireAuth);

// ------------------------------------------------------------
// Multer config for file uploads (PDF / Word / image)
// ------------------------------------------------------------
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = '/tmp/uploads';
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) { cb(err); }
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Helper: strip the file extension for a default label
function defaultLabelFromFilename(filename) {
  return path.parse(filename).name.replace(/[_-]/g, ' ').trim() || 'Untitled resume';
}

// Helper: ownership guard — fetch resume if it belongs to user, else null
async function findOwnedResume(resumeId, userId) {
  return prisma.resume.findFirst({ where: { id: resumeId, userId } });
}

// ------------------------------------------------------------
// GET /api/resumes  → list all resumes for the user
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [resumes, user] = await Promise.all([
      prisma.resume.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { activeResumeId: true }
      })
    ]);
    res.json({ resumes, activeResumeId: user?.activeResumeId || null });
  } catch (err) {
    console.error('List resumes error:', err);
    res.status(500).json({ error: 'Failed to load resumes' });
  }
});

// ------------------------------------------------------------
// GET /api/resumes/:id  → single resume
// ------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({ resume });
  } catch (err) {
    console.error('Get resume error:', err);
    res.status(500).json({ error: 'Failed to load resume' });
  }
});

// ------------------------------------------------------------
// POST /api/resumes  → upload + analyze (create new resume)
// ------------------------------------------------------------
router.post('/', upload.single('resume'), async (req, res) => {
  let tempPath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { language = 'English', label: providedLabel } = req.body;

    // 1. Run Gemini analysis
    const analysis = await analyzeResumeFile(req.file.path, req.file.mimetype, language);

    // 2. Decide on label: explicit > Gemini candidate name > filename
    const label =
      (providedLabel && providedLabel.trim()) ||
      (analysis.name && analysis.name.trim()) ||
      defaultLabelFromFilename(req.file.originalname);

    // 3. Create the Resume row.
    // 4. If this is the user's FIRST resume, auto-set it as active.
    // Both in one transaction so we don't end up half-done if one fails.
    const result = await prisma.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId: req.user.id,
          label,
          parsedData: analysis,
          detectedLanguage: analysis.originalLanguage || null,
          candidateName: analysis.name || null
        }
      });

      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { activeResumeId: true }
      });

      let becameActive = false;
      if (!user.activeResumeId) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { activeResumeId: resume.id }
        });
        becameActive = true;
      }

      return { resume, becameActive };
    });

    res.status(201).json({
      success: true,
      resume: result.resume,
      analysis,
      becameActive: result.becameActive
    });
  } catch (err) {
    console.error('Create resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to create resume' });
  } finally {
    // Always clean up the temp file
    if (tempPath) {
      try { await fs.unlink(tempPath); } catch (_) { /* ignore */ }
    }
  }
});

// ------------------------------------------------------------
// PATCH /api/resumes/:id  → rename
// ------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const { label } = req.body || {};
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Label is required' });
    }

    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const updated = await prisma.resume.update({
      where: { id: req.params.id },
      data: { label: label.trim() }
    });
    res.json({ resume: updated });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// ------------------------------------------------------------
// POST /api/resumes/:id/activate  → set as active
// ------------------------------------------------------------
router.post('/:id/activate', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { activeResumeId: resume.id }
    });
    res.json({ success: true, activeResumeId: resume.id });
  } catch (err) {
    console.error('Activate resume error:', err);
    res.status(500).json({ error: 'Failed to activate resume' });
  }
});

// ------------------------------------------------------------
// DELETE /api/resumes/:id
// ------------------------------------------------------------
// If the deleted resume was the active one, auto-pick the next
// most recent remaining resume as active (nicer UX than leaving
// the user with no active resume after a delete).
router.delete('/:id', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const result = await prisma.$transaction(async (tx) => {
      // Schema has onDelete: SetNull on User.activeResumeId — so deleting
      // the active resume automatically clears the pointer. We then set
      // it to the next remaining one (if any).
      await tx.resume.delete({ where: { id: resume.id } });

      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { activeResumeId: true }
      });

      let newActiveId = user.activeResumeId;
      if (!user.activeResumeId) {
        const fallback = await tx.resume.findFirst({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' }
        });
        if (fallback) {
          await tx.user.update({
            where: { id: req.user.id },
            data: { activeResumeId: fallback.id }
          });
          newActiveId = fallback.id;
        }
      }
      return { newActiveId };
    });

    res.json({ success: true, activeResumeId: result.newActiveId });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
