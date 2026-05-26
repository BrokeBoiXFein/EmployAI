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
const { analyzeResumeFile, suggestResumeImprovements, buildTailoredResume } = require('../services/gemini');
const { embedText, buildResumeText } = require('../services/embeddings');
const { renderMarkdown, renderPlainText, renderDocx } = require('../services/resumeRender');

// ------------------------------------------------------------
// Apply a coach suggestion to a parsed-resume object.
// Returns a NEW object (doesn't mutate the input) so we can compare
// before/after if we ever want diffing later.
// Unknown suggestion types are silently ignored — defensive against
// the LLM occasionally going off-schema.
// ------------------------------------------------------------
function applySuggestion(parsedData, suggestion) {
  const next = JSON.parse(JSON.stringify(parsedData || {}));
  const text = (suggestion?.suggestedText || '').trim();
  if (!text) return next;

  switch (suggestion.type) {
    case 'rewrite_summary':
      next.summary = text;
      break;

    case 'rewrite_responsibilities': {
      const i = suggestion.target?.experienceIndex;
      if (Array.isArray(next.experience) && next.experience[i]) {
        next.experience[i].responsibilities = text;
      }
      break;
    }

    case 'rewrite_skill': {
      const i = suggestion.target?.skillIndex;
      if (Array.isArray(next.skills) && next.skills[i] !== undefined) {
        next.skills[i] = text;
      }
      break;
    }

    case 'add_skill':
      next.skills = next.skills || [];
      if (!next.skills.includes(text)) next.skills.push(text);
      break;

    case 'add_target_role':
      next.recommendedJobTitles = next.recommendedJobTitles || [];
      if (!next.recommendedJobTitles.includes(text)) next.recommendedJobTitles.push(text);
      break;

    case 'add_certification':
      next.usEquivalents = next.usEquivalents || {};
      next.usEquivalents.certifications = next.usEquivalents.certifications
        ? `${next.usEquivalents.certifications}; ${text}`
        : text;
      break;
  }
  return next;
}

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

    // 3. Compute the resume embedding — a 384-number vector that captures
    // the candidate's "shape" in semantic space. Cached on the row so we
    // never re-embed unless the resume itself changes.
    let embedding = null;
    try {
      embedding = await embedText(buildResumeText(analysis));
    } catch (embedErr) {
      // If the model fails to load (e.g. no internet on first run), don't
      // block the upload — the resume still saves, just without a vector.
      // /api/search-jobs will lazily backfill on next request.
      console.warn('Resume embedding failed; will backfill later:', embedErr.message);
    }

    // 4. Create the Resume row.
    // 5. If this is the user's FIRST resume, auto-set it as active.
    // Both in one transaction so we don't end up half-done if one fails.
    const result = await prisma.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId: req.user.id,
          label,
          parsedData: analysis,
          detectedLanguage: analysis.originalLanguage || null,
          candidateName: analysis.name || null,
          embedding
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

// ------------------------------------------------------------
// POST /api/resumes/:id/suggestions  → generate coach suggestions
// ------------------------------------------------------------
// Body: { language?: string, focus?: string }
//   language defaults to the user's preferredLanguage (so rationales
//   come back in their native tongue)
//   focus is optional free-text the user typed to steer the coach
//   ("emphasize leadership", "shorter bullets", etc.)
router.post('/:id/suggestions', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const { language, focus } = req.body || {};
    let lang = language;
    if (!lang) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { preferredLanguage: true }
      });
      lang = user?.preferredLanguage || 'English';
    }

    const suggestions = await suggestResumeImprovements(resume.parsedData, lang, focus || null);
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate suggestions' });
  }
});

// ------------------------------------------------------------
// POST /api/resumes/:id/apply-suggestion
// ------------------------------------------------------------
// Body: { suggestion: { type, target, suggestedText, ... } }
// Mutates parsedData per the suggestion, persists it, and clears the
// stored embedding so the next job search will recompute against the
// improved resume (which is the whole point — see your score go up).
router.post('/:id/apply-suggestion', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const { suggestion } = req.body || {};
    if (!suggestion || !suggestion.type) {
      return res.status(400).json({ error: 'suggestion required' });
    }

    const newParsed = applySuggestion(resume.parsedData, suggestion);

    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: {
        parsedData: newParsed,
        // Invalidate embedding — next /api/search-jobs call backfills it.
        embedding: null,
        // Keep candidateName in sync if the summary/name section moved
        candidateName: newParsed.name || resume.candidateName
      }
    });
    res.json({ resume: updated });
  } catch (err) {
    console.error('Apply suggestion error:', err);
    res.status(500).json({ error: err.message || 'Failed to apply suggestion' });
  }
});

// ------------------------------------------------------------
// POST /api/resumes/:id/build  → produce US-tailored resume
// ------------------------------------------------------------
// Body: { template?: 'chronological'|'hybrid'|'skills_first',
//         language?: string }
// Response: { structured, markdown, plainText }
//
// The frontend keeps `structured` in state and posts it back to
// /export-docx if the user clicks Download — that way we don't
// burn another Gemini call just to render the same content as docx.
router.post('/:id/build', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const { template = 'hybrid', language } = req.body || {};
    const validTemplates = ['chronological', 'hybrid', 'skills_first'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({ error: `template must be one of: ${validTemplates.join(', ')}` });
    }

    // Pull preferredLanguage + email from the user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, preferredLanguage: true }
    });
    const lang = language || user?.preferredLanguage || 'English';

    const structured = await buildTailoredResume(
      resume.parsedData, template, lang, user?.email
    );
    const markdown = renderMarkdown(structured);
    const plainText = renderPlainText(structured);
    res.json({ structured, markdown, plainText });
  } catch (err) {
    console.error('Build resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to build resume' });
  }
});

// ------------------------------------------------------------
// POST /api/resumes/:id/export-docx
// ------------------------------------------------------------
// Body: { structured }   ← the object returned by /build
// Streams a .docx file as a download. Ownership-checked but we don't
// re-run Gemini — the frontend already has the content from /build.
router.post('/:id/export-docx', async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const { structured } = req.body || {};
    if (!structured || typeof structured !== 'object') {
      return res.status(400).json({ error: 'structured resume payload required' });
    }

    const buffer = await renderDocx(structured);
    const safeName = (structured.name || 'resume').replace(/[^\w\- ]/g, '').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('Export docx error:', err);
    res.status(500).json({ error: err.message || 'Failed to export .docx' });
  }
});

module.exports = router;
