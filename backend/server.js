const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://BrokeBoiXFein.github.io',
  'https://brokeboixfein.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Analyze resume endpoint
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { language = 'English' } = req.body;
    const filePath = req.file.path;
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze this resume for an immigrant job matching platform. Extract and provide ONLY a JSON response with no preamble or markdown formatting. 

IMPORTANT: Provide the "summary", "responsibilities" for each experience, and "suggestion" for each suggestionForUS in ${language}. All other keys should remain in English as specified.

Structure:
{
  "name": "candidate name",
  "originalLanguage": "detected language of resume",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "time period",
      "responsibilities": "brief description translated into ${language}"
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year"
    }
  ],
  "usEquivalents": {
    "degreeEquivalent": "US equivalent degree if foreign",
    "certifications": "relevant US certifications recommended"
  },
  "recommendedJobTitles": ["title1", "title2", "title3"],
  "summary": "brief professional summary translated into ${language}",
  "suggestionsForUS": [
    {
      "category": "Format",
      "suggestion": "specific suggestion about resume format for US employers translated into ${language}"
    },
    {
      "category": "Content",
      "suggestion": "specific suggestion about what to add or emphasize translated into ${language}"
    },
    {
      "category": "Skills",
      "suggestion": "specific suggestion about skills presentation translated into ${language}"
    }
  ]
}`;
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('AI Response Text:', text);
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    // Clean up uploaded file
    await fs.unlink(filePath);

    res.json({ success: true, analysis });

  } catch (error) {
    console.error('Analysis error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze resume'
    });
  }
});

// Search jobs endpoint
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
          if (data.results && data.results.length > 0) {
            allJobs.push(...data.results);
          }
        }
      } catch (fetchErr) {
        console.error('Fetch error for', title, ':', fetchErr);
      }
    }

    const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values()).slice(0, 15);
    res.json({ success: true, jobs: uniqueJobs });

  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search jobs'
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, language, userProfile } = req.body;

    let systemContext = `You are a helpful job search assistant for immigrants seeking employment in the United States. 
The user is speaking ${language}. Please respond in ${language}.

You provide guidance on:
- Understanding US job market terminology
- Resume and application help
- Interview preparation
- Work visa information (general guidance only)
- Job search strategies
- Cultural workplace norms in the US

Keep responses concise, friendly, and practical.`;

    if (userProfile) {
      systemContext += `\n\nThe user has uploaded their resume. Here's their profile:
Name: ${userProfile.name}
Skills: ${userProfile.skills}
Experience: ${userProfile.experience}
Recommended Jobs: ${userProfile.recommendedJobs}

Use this context when relevant to provide personalized advice.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    formattedMessages.unshift({
      role: 'user',
      parts: [{ text: systemContext }]
    });

    formattedMessages.push({
      role: 'model',
      parts: [{ text: 'I understand. I will help with job search guidance.' }]
    });

    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, message: text });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get chat response'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});