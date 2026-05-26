const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');
const savedRoutes = require('./routes/saved');
const applicationRoutes = require('./routes/applications');
const { chat: chatWithGemini } = require('./services/gemini');
const { requireAuth } = require('./middleware/auth');
const prisma = require('./db');
const {
  embedText,
  embedTexts,
  cosineSimilarity,
  buildResumeText,
  buildJobText,
  VECTOR_DIM
} = require('./services/embeddings');

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------------------------------------
// CORS — which frontend origins can talk to this API
// ------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://BrokeBoiXFein.github.io',
  'https://brokeboixfein.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// ------------------------------------------------------------
// Route mounts
// ------------------------------------------------------------
app.use('/api/auth', authRoutes);              // signup, login, me
app.use('/api/resumes', resumeRoutes);         // multi-resume CRUD + activate
app.use('/api/saved', savedRoutes);            // saved-job bookmarks
app.use('/api/applications', applicationRoutes); // application tracking

// ------------------------------------------------------------
// Job search via Adzuna, ranked by Sentence-BERT similarity
// ------------------------------------------------------------
// Flow:
//   1. Look up the user's resume (ownership verified via userId)
//   2. Backfill embedding if missing (e.g., resume uploaded before
//      this feature shipped, or embed failed at upload time)
//   3. Query Adzuna using the resume's recommendedJobTitles
//   4. Dedupe results
//   5. Batch-embed every job's title + description
//   6. Score each job: cosine(resume_vec, job_vec) → number in [-1, 1]
//   7. Sort by score descending, attach matchScore, return
// ------------------------------------------------------------
app.post('/api/search-jobs', requireAuth, async (req, res) => {
  try {
    const { resumeId } = req.body || {};
    if (!resumeId) return res.status(400).json({ error: 'resumeId required' });

    // Step 1: ownership-checked fetch
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: req.user.id }
    });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const titles = resume.parsedData?.recommendedJobTitles;
    if (!Array.isArray(titles) || titles.length === 0) {
      return res.json({ success: true, jobs: [] });
    }

    // Step 2: backfill embedding if missing OR wrong dimensions.
    // The dim check catches stale 384-dim vectors left over from when
    // we used local sentence-transformers — those can't be compared to
    // current 768-dim Gemini vectors and would silently score 0.
    let resumeVec = resume.embedding;
    if (!resumeVec || resumeVec.length !== VECTOR_DIM) {
      console.log(`[search-jobs] (Re)computing embedding for resume ${resume.id}`);
      resumeVec = await embedText(buildResumeText(resume.parsedData));
      await prisma.resume.update({
        where: { id: resume.id },
        data: { embedding: resumeVec }
      });
    }

    // Step 3: fetch jobs from Adzuna (up to 3 titles * 10 results = 30 jobs)
    const allJobs = [];
    for (const title of titles.slice(0, 3)) {
      const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_API_KEY}&results_per_page=10&what=${encodeURIComponent(title)}`;
      try {
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          if (data.results?.length) allJobs.push(...data.results);
        }
      } catch (fetchErr) {
        console.error('Fetch error for', title, ':', fetchErr);
      }
    }

    // Step 4: dedupe
    const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.id, j])).values());
    if (uniqueJobs.length === 0) return res.json({ success: true, jobs: [] });

    // Step 5: batch-embed all jobs in one model call (much faster than looping)
    const jobTexts = uniqueJobs.map(buildJobText);
    const jobVecs = await embedTexts(jobTexts);

    // Step 6: score each job
    const scored = uniqueJobs.map((job, i) => ({
      ...job,
      matchScore: cosineSimilarity(resumeVec, jobVecs[i])
    }));

    // Step 7: sort by score desc, take top 15
    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ success: true, jobs: scored.slice(0, 15) });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to search jobs' });
  }
});

// ------------------------------------------------------------
// Chat with Gemini assistant
// ------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, language, userProfile } = req.body;
    const message = await chatWithGemini({ messages, language, userProfile });
    res.json({ success: true, message });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get chat response' });
  }
});

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
