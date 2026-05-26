# EmployAI

**A multilingual AI-powered job search tool built for immigrants.**

Upload your resume in any of six languages → get a translated analysis, semantically-ranked job matches, and a complete US-tailored resume you can download as Word. Designed to remove the language, formatting, and credential barriers that quietly keep qualified immigrant talent out of US jobs.

**Live demo:** https://BrokeBoiXFein.github.io/EmployAI/

> First load takes ~30–60s while the backend wakes up (Render free tier sleeps after 15 min of inactivity).

---

## What it does

- **Upload a resume in any language** (PDF, Word, or image). Gemini 2.5 Flash parses it into a structured profile and translates it into the user's chosen language.
- **Maps foreign credentials to US equivalents** and suggests relevant US certifications.
- **Semantic job matching:** every resume gets a 3,072-dimensional embedding (Google `gemini-embedding-001`); live Adzuna job listings get the same; cosine similarity ranks results with a color-coded % match badge.
- **Multi-resume library:** save many versions ("Tech resume," "Healthcare resume"), one active at a time.
- **Save & track applications:** heart-to-save, mark-applied button, status pipeline (Applied → Interviewing → Offered / Rejected / Withdrawn), per-job notes.
- **Resume Studio:**
  - *Coach* — typed suggestion cards (rewrite bullet, add skill, etc.) with Apply/Skip; applying invalidates the embedding so your next job search reflects the improvement.
  - *Builder* — generates a complete US-tailored resume in one shot. Three templates (Chronological / Hybrid / Skills-first). Inline preview + downloadable `.docx`.
- **Low-match coach:** when your top job score drops below 55%, a banner opens the chat with a pre-filled "what should I improve?" prompt — the assistant already has your profile in context.
- **Six UI languages** (English, Spanish, French, Arabic with RTL, Chinese, Hindi).

---

## Tech stack

- **Frontend** — React 19 + Vite + Tailwind CSS · Zustand for auth state · deployed to GitHub Pages
- **Backend** — Node + Express · Prisma ORM over Postgres (Neon) · JWT auth with bcrypt · deployed to Render
- **AI** — Google Gemini 2.5 Flash (parsing, suggestions, builder, chat) · `gemini-embedding-001` (matching)
- **External** — Adzuna API (job listings) · `docx` package for Word export

---

## Run it locally

```bash
# 1. Backend (terminal A)
cd backend
npm install
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, ADZUNA_*
npx prisma migrate dev        # set up the database
npm run dev                   # listens on :5000

# 2. Frontend (terminal B)
cd frontend
npm install
npm run dev                   # opens http://localhost:5173/EmployAI/
```

You'll need:
- A free Neon Postgres database — get a connection string at https://neon.tech
- A Gemini API key — https://aistudio.google.com/apikey
- Adzuna API credentials — https://developer.adzuna.com/

---

## Documentation

- **[docs/EmployAI_Proposal.docx](docs/EmployAI_Proposal.docx)** — full project report (mirrors the original SAAWA proposal; methodology section describes what's actually built and why)
- **[docs/EmployAI_Beginners_Guide.docx](docs/EmployAI_Beginners_Guide.docx)** — plain-English explainer of how embeddings, LLMs, and the architecture work, for readers with no programming background

---

## Authors

Alexander Apostol · Ayaan Khandelwal · Richard Nie · Srinivasa Polisetty
Jericho Senior High School, Jericho, NY

Built for the SAAWA Bright Mind project.
