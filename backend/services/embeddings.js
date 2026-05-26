// ============================================================
// Embeddings service — Gemini text-embedding-004 API
// ============================================================
// Same interface as before (embedText, embedTexts, cosineSimilarity,
// buildResumeText, buildJobText), but the vectors now come from
// Google's hosted embedding model instead of running locally.
//
// Why Gemini and not local sentence-transformers?
//   - This codebase targets a wide range of dev machines, including
//     Intel Macs where the current ONNX Runtime no longer ships
//     native binaries. Cloud API sidesteps the entire platform mess.
//   - Free at our usage levels (1500 requests/min limit).
//   - text-embedding-004 is multilingual, which is critical for an
//     immigrant job-matching tool.
//   - We were already using the @google/generative-ai SDK for resume
//     analysis and chat — no new dependency.
//
// Vector dimensions: 768 (Gemini) vs 384 (Sentence-BERT MiniLM).
// Higher-dim = slightly better quality at the same speed.
//
// IMPORTANT: vectors are L2-normalized here, so cosineSimilarity can
// be a simple dot product downstream.
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// gemini-embedding-001 is Google's current production embedding model.
// 3072 dimensions (higher = slightly better quality, ~12KB per stored
// vector). Earlier models (text-embedding-004, embedding-001) were
// removed from the v1beta endpoint that the @google/generative-ai
// SDK targets.
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM = 3072;

// L2-normalize a vector in place. After this, cosine(a, b) == dot(a, b).
function l2Normalize(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm;
  return vec;
}

// Embed a single text via Gemini. Returns a 768-dim normalized array.
async function embedText(text) {
  if (!text || typeof text !== 'string') text = String(text || '');
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  const vec = Array.from(result.embedding.values);
  return l2Normalize(vec);
}

// Embed many texts. The Gemini SDK's batchEmbedContents() targets a
// deprecated batch endpoint that gemini-embedding-001 doesn't expose.
// Instead we fire all the single-embed calls in parallel with
// Promise.all — for ~30 jobs this finishes in roughly one round-trip
// of latency and stays well under the free-tier rate limit (1500 rpm).
async function embedTexts(texts) {
  if (!Array.isArray(texts)) texts = [texts];
  if (texts.length === 0) return [];
  return Promise.all(texts.map(embedText));
}

// Cosine similarity. With L2-normalized inputs this is just a dot
// product, which is what we do here. Range [-1, 1]; in practice
// Gemini embeddings cluster slightly tighter than sentence-BERT,
// so expect typical scores around 0.5–0.85.
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

// Exported for the search-jobs route to detect old/incompatible
// embeddings and trigger a backfill (e.g., 384-dim leftovers from
// the prior local-ML attempt).
const VECTOR_DIM = EMBEDDING_DIM;

// ------------------------------------------------------------
// Text builders — unchanged from before. Quality of these strings
// directly affects match quality.
// ------------------------------------------------------------

function buildResumeText(parsedData) {
  if (!parsedData) return '';
  const parts = [];
  if (parsedData.name) parts.push(parsedData.name);
  if (parsedData.summary) parts.push(parsedData.summary);
  if (Array.isArray(parsedData.skills) && parsedData.skills.length) {
    parts.push('Skills: ' + parsedData.skills.join(', '));
  }
  if (Array.isArray(parsedData.experience)) {
    const exp = parsedData.experience
      .slice(0, 5)
      .map(e => [e.title, e.company, e.responsibilities].filter(Boolean).join(' — '))
      .filter(Boolean)
      .join('. ');
    if (exp) parts.push('Experience: ' + exp);
  }
  if (Array.isArray(parsedData.recommendedJobTitles) && parsedData.recommendedJobTitles.length) {
    parts.push('Target roles: ' + parsedData.recommendedJobTitles.join(', '));
  }
  return parts.join('. ');
}

function buildJobText(job) {
  if (!job) return '';
  const parts = [];
  if (job.title) parts.push(job.title);
  if (job.company?.display_name) parts.push('at ' + job.company.display_name);
  if (job.description) {
    const text = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    parts.push(text.slice(0, 600));
  }
  return parts.join('. ');
}

module.exports = {
  embedText,
  embedTexts,
  cosineSimilarity,
  buildResumeText,
  buildJobText,
  VECTOR_DIM
};
