# Product

## Register

product

## Users

Immigrants in the United States looking for jobs, with English skills ranging from minimal to fluent. Many have strong professional backgrounds in their home country (engineering, healthcare, finance, trades) but are unfamiliar with US-specific job-search infrastructure: resume conventions, credential equivalencies, application norms, and the implicit hiring filters built into the English-language web. They are often using EmployAI on personal devices, sometimes low-end, sometimes shared, frequently in spare moments between work and family. The job they're trying to do: find roles that actually match their experience, in a system that doesn't quietly screen them out before a human reads their resume.

## Product Purpose

EmployAI removes three infrastructure barriers — language, US-resume conventions, and credential mismatch — that screen qualified immigrant candidates out of the US job market before any human evaluation. Concretely, it: parses a resume in any of six languages, maps foreign credentials and experience to US equivalents, semantically ranks live job listings against the user's actual background, generates a US-formatted resume tailored to a specific role, and tracks applications through the pipeline. Success looks like a user who would otherwise apply to thirty jobs and hear nothing instead getting interviews for roles that genuinely fit, with materials that don't get filtered out by ATS or human bias against unfamiliar formats.

## Brand Personality

**Calm, clear, dignified.** The voice is the helpful friend who knows the system and walks the user through it without condescension, urgency, or theatrics. Not chirpy. Not breathless. Not "we believe in you." Quiet competence: the kind of help that respects the user's time and treats them as a professional, which most of them are. The interface should feel like a serious tool, not a charity project and not a startup pitch.

## Anti-references

- **Generic SaaS landing pages.** Gradient hero, big-number metric, three-column feature card grid, "Trusted by [logos]" strip, Series-B-startup polish. EmployAI is not Linear-for-immigrants. The Home page must not look interchangeable with any AI tool that shipped this year.
- **Charity / NGO aesthetics.** Stock photos of smiling diverse people, warm "thank you for trusting us" copy, design that signals the user is a recipient of help. EmployAI's users are professionals who happen to need different infrastructure. The design should never make them feel like beneficiaries.
- **(Implicit, from existing decisions)** Indeed-style aggressive job-board UX — banner ads, popups, recruiter bait. Workday-style enterprise HR density — gray tax-document forms.

## Design Principles

1. **No purely-visual controls.** Every interactive element does something real. No buttons that exist only to look like buttons, no stub toggles, no decorative chrome with onClick handlers. This is a permanent rule that pre-dates this document and outranks aesthetic preferences.
2. **Translate, don't dilute.** Six-language UI must feel native in each language, not English-with-labels-swapped. RTL Arabic gets real layout attention, not a `dir="rtl"` afterthought. Copy is written to translate well, not to be clever in English.
3. **Respect the user's expertise.** Users are often working professionals — engineers, nurses, accountants — operating in an unfamiliar system, not novices who need everything explained. Copy doesn't oversimplify. UI doesn't infantilize. Onboarding doesn't hold their hand more than necessary.
4. **Match honesty over match inflation.** Show real semantic match scores, including bad ones. A 38% match is shown as 38%, not hidden. Trust is built by being accurate; when the system flags a low ceiling, the user can do something about it (see: low-match coach). Never inflate to feel encouraging.
5. **AI is plumbing, not the product.** Gemini does the heavy lifting, but the user came for a job — not to watch an LLM. No "Powered by Gemini" badges, no token-streaming theatrics, no AI personification. The model is a means; the surfaces are the product.

## Accessibility & Inclusion

Target: **WCAG 2.1 AAA where feasible**, AA as the absolute floor. The user base includes screen-reader users, people with low-end devices and slow connections, varied English fluency (so plain language matters as much as semantics), and varied vision (so 7:1 contrast where text is involved, generous tap targets, no color-only state). RTL Arabic must work fully — directional icons, mirrored layouts, correct logical-property usage. Reduced-motion preferences are respected: no animation that conveys meaning the user can't get without it. No timing-dependent UI. Forms support keyboard-only completion. The 6-language i18n architecture is treated as accessibility infrastructure, not localization decoration.
