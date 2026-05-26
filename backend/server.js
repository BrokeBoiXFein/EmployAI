const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');
const { chat: chatWithGemini } = require('./services/gemini');

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
app.use('/api/auth', authRoutes);       // signup, login, me
app.use('/api/resumes', resumeRoutes);  // multi-resume CRUD + activate

// ------------------------------------------------------------
// Job search via Adzuna (no auth required for now — could add later)
// ------------------------------------------------------------
app.post('/api/search-jobs', async (req, res) => {
  try {
    const { jobTitles } = req.body;
    if (!jobTitles || !Array.isArray(jobTitles)) {
      return res.status(400).json({ error: 'Job titles required' });
    }

    const allJobs = [];
    for (const title of jobTitles.slice(0, 3)) {
      const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_API_KEY}&results_per_page=10&what=${encodeURIComponent(title)}`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) allJobs.push(...data.results);
        }
      } catch (fetchErr) {
        console.error('Fetch error for', title, ':', fetchErr);
      }
    }

    const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values()).slice(0, 15);
    res.json({ success: true, jobs: uniqueJobs });
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
