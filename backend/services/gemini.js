// ============================================================
// Gemini service — wraps the Google Generative AI SDK
// ============================================================
// Extracted from server.js so resume-analysis logic is in one
// place. Anything that needs to call Gemini imports from here.
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RESUME_PROMPT = (language) => `Analyze this resume for an immigrant job matching platform. Extract and provide ONLY a JSON response with no preamble or markdown formatting.

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

// Analyze a resume file with Gemini. Returns the parsed JSON.
async function analyzeResumeFile(filePath, mimeType, language = 'English') {
  const fileBuffer = await fs.readFile(filePath);
  const base64Data = fileBuffer.toString('base64');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64Data } },
    { text: RESUME_PROMPT(language) }
  ]);

  const response = await result.response;
  const text = response.text();
  const cleanedText = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanedText);
}

// Chat with Gemini. Returns the assistant's reply string.
async function chat({ messages, language = 'English', userProfile = null }) {
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  formattedMessages.unshift({ role: 'user', parts: [{ text: systemContext }] });
  formattedMessages.push({ role: 'model', parts: [{ text: 'I understand. I will help with job search guidance.' }] });

  const chat = model.startChat({ history: formattedMessages.slice(0, -1) });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return (await result.response).text();
}

module.exports = { analyzeResumeFile, chat };
