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

// ------------------------------------------------------------
// Resume coach — generate structured improvement suggestions
// ------------------------------------------------------------
// Returns an array of suggestion objects the frontend can render
// as cards with Apply / Skip buttons. Each one has a `type` that
// tells the backend how to apply it (see applySuggestion).
//
// We constrain Gemini tightly:
//   - explicit JSON schema in the prompt
//   - enumerated suggestion types so we can apply them programmatically
//   - rationales in the user's chosen language for clarity
// ------------------------------------------------------------

const SUGGESTION_TYPES = [
  'rewrite_summary',           // replaces parsedData.summary
  'rewrite_responsibilities',  // replaces experience[target.experienceIndex].responsibilities
  'rewrite_skill',             // replaces skills[target.skillIndex]
  'add_skill',                 // appends to skills[]
  'add_target_role',           // appends to recommendedJobTitles[]
  'add_certification'          // appends to usEquivalents.certifications (string)
];

const SUGGEST_PROMPT = (parsedData, language, focus) => `You are a resume coach helping an immigrant strengthen their resume for the US job market. Look at this parsed resume and suggest up to 8 concrete, high-impact improvements.

CURRENT RESUME (JSON):
${JSON.stringify(parsedData, null, 2)}

${focus ? `USER'S SPECIFIC FOCUS: ${focus}\n` : ''}
INSTRUCTIONS:
- Each suggestion must target a SPECIFIC field in the resume (not vague advice).
- Prefer changes that add quantifications, strong action verbs, US conventions, and missing keywords related to recommendedJobTitles.
- For experience bullets ("rewrite_responsibilities"), write the new text in the SAME language as the existing field (usually English).
- Write each "rationale" in ${language} so the user can understand WHY this helps.
- Do NOT invent facts the candidate didn't provide. If you're suggesting metric placeholders, write them as bracketed placeholders (e.g. "led team of [N] engineers").
- Output ONLY a JSON array. No preamble, no markdown.

QUALITY RULES (CRITICAL — skip the suggestion entirely if you can't meet these):
- BANNED phrases (do not produce text containing these): "hardworking", "hard-working", "team player", "results-driven", "results driven", "passionate", "self-motivated", "go-getter", "detail-oriented professional", "seeking opportunities", "looking to grow", "dynamic individual". These are filler that hurts more than helps.
- For "rewrite_summary":
  * 2-4 sentences MAX. No long paragraphs.
  * MUST include at least 2 concrete skills or specializations pulled from the actual resume (not invented).
  * MUST be targeted to the recommendedJobTitles when they exist.
  * If the candidate worked at foreign companies, add brief US-recognizable context (e.g. "Latin America's largest e-commerce platform", "national bank in Vietnam"). This helps US recruiters who don't recognize the company names.
  * If the existing summary is ALREADY specific and good (mentions concrete skills, no banned phrases, role-targeted), skip — don't suggest a change just for the sake of it.
- For "rewrite_responsibilities":
  * Start with a strong action verb (Led, Built, Designed, Reduced, Shipped, etc. — not "Responsible for").
  * Include a measurable outcome where possible (use [bracketed placeholders] if the candidate didn't provide numbers).
  * Avoid duplicating words already in the bullet.

SUGGESTION SHAPE (strict):
[
  {
    "id": "s1",
    "type": "rewrite_summary" | "rewrite_responsibilities" | "rewrite_skill" | "add_skill" | "add_target_role" | "add_certification",
    "target": {
      // for rewrite_responsibilities: { "experienceIndex": 0 }
      // for rewrite_skill: { "skillIndex": 2 }
      // for rewrite_summary, add_skill, add_target_role, add_certification: {} (empty)
    },
    "currentText": "what is there now, or '[empty]' if not present",
    "suggestedText": "what to change it to (or just the new thing for add_*)",
    "rationale": "1-2 sentence why, in ${language}"
  }
]

Return only the JSON array. If you can't find any meaningful improvements, return [].`;

async function suggestResumeImprovements(parsedData, language = 'English', focus = null) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(SUGGEST_PROMPT(parsedData, language, focus));
  const text = (await result.response).text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('Suggestion parse error. Raw:', cleaned.slice(0, 500));
    throw new Error('Coach returned malformed suggestions');
  }
  if (!Array.isArray(parsed)) return [];
  // Filter to known types + minimal validation so a bad suggestion can't
  // crash the apply step downstream.
  return parsed.filter(s =>
    s && SUGGESTION_TYPES.includes(s.type) &&
    typeof s.suggestedText === 'string' && s.suggestedText.trim().length > 0
  );
}

// ------------------------------------------------------------
// Resume Builder — produce a US-tailored structured resume
// ------------------------------------------------------------
// Returns a STRUCTURED resume object (the same shape both
// renderMarkdown and renderDocx consume in services/resumeRender.js).
//
// The template only affects section order; the structural conversions
// (drop photo/birthdate/marital status, action-verb bullets, etc.)
// happen unconditionally because they're universal to US convention.
// ------------------------------------------------------------

const TEMPLATE_DESCRIPTIONS = {
  chronological: `Standard US chronological resume. Section order: Summary → Experience (reverse chronological) → Skills → Education → Certifications. Best for steady career progression.`,
  hybrid:        `Hybrid (combination) resume. Section order: Summary → Skills → Experience (reverse chronological) → Education → Certifications. Best for immigrants — leads with US-recognizable skills BEFORE foreign company names. For Skills, organize as categorized groups (e.g. "Backend: Node.js, Python; Cloud: AWS, GCP").`,
  skills_first:  `Skills-first / functional resume. Section order: Summary → Skills (heavily categorized) → Certifications → Education → Experience. Best for career changers or candidates with gaps. Use categorized skill groups.`
};

const BUILD_PROMPT = (parsedData, template, language, userEmail) => `You are converting a resume into a US-employer-ready ${template} format.

SOURCE RESUME (JSON, may be in any language):
${JSON.stringify(parsedData, null, 2)}

USER EMAIL (for the contact block): ${userEmail || '[your-email@example.com]'}

TARGET TEMPLATE: ${TEMPLATE_DESCRIPTIONS[template] || TEMPLATE_DESCRIPTIONS.chronological}

OUTPUT LANGUAGE: ${language} (translate all text into ${language}; keep proper nouns like company names as-is).

REQUIRED US CONVENTIONS (apply unconditionally):
- DROP: photo, birthdate, marital status, nationality, gender, religion, "References available upon request". These are common abroad, discouraged or illegal-to-consider in US hiring.
- KEEP & strengthen: name, contact info, summary, skills, experience, education, certifications.
- Bullets MUST start with strong action verbs (Led, Built, Designed, Reduced, Shipped, Increased — NEVER "Responsible for" or "Duties included").
- Include measurable outcomes when source provides numbers. Use [bracketed placeholders] like "[N]%" if numbers aren't in the source — do NOT invent specific figures.
- Dates: "Month YYYY" format (e.g. "Mar 2022"). Never DD/MM/YYYY.
- Summary: 2-4 sentences, role-targeted (use recommendedJobTitles), mentions 2+ concrete skills from the resume. For foreign companies, add brief US-recognizable context (e.g. "Latin America's largest e-commerce platform"). NEVER use these clichés: "hardworking", "team player", "results-driven", "passionate", "self-motivated", "seeking opportunities", "dynamic individual".

CONTACT FIELD: use the provided user email. For phone and location, use clear placeholders: "[Your phone]" and "[City, State]". Do NOT invent these.

OUTPUT STRICTLY this JSON shape (no preamble, no markdown):
{
  "name": "...",
  "contact": { "email": "...", "phone": "[Your phone]", "location": "[City, State]", "url": null },
  "summary": "...",
  "skills": [ "skill1", "skill2", ... ]   // flat list for chronological
                                          // OR for hybrid/skills_first: [{ "category": "Backend", "items": ["Node.js", "Python"] }, ...]
  "experience": [
    {
      "title": "...", "company": "...", "location": "...",
      "startDate": "Mar 2022", "endDate": "Present",
      "bullets": ["Led ...", "Built ..."]
    }
  ],
  "education": [
    { "degree": "...", "institution": "...", "location": "...", "year": "..." }
  ],
  "certifications": ["..."]   // optional, omit field if none
}

Return ONLY the JSON.`;

async function buildTailoredResume(parsedData, template = 'hybrid', language = 'English', userEmail = null) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(
    BUILD_PROMPT(parsedData, template, language, userEmail)
  );
  const text = (await result.response).text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  let structured;
  try {
    structured = JSON.parse(cleaned);
  } catch (err) {
    console.error('Build parse error. Raw:', cleaned.slice(0, 600));
    throw new Error('Builder returned malformed resume');
  }
  // Stamp the template into the structure so renderers know section order
  structured.template = template;
  return structured;
}

module.exports = {
  analyzeResumeFile,
  chat,
  suggestResumeImprovements,
  buildTailoredResume,
  SUGGESTION_TYPES
};
