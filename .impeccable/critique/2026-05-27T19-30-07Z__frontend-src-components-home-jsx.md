---
target: frontend/src/components/Home.jsx
total_score: 23
p0_count: 0
p1_count: 4
timestamp: 2026-05-27T19-30-07Z
slug: frontend-src-components-home-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Submit gives no loading state; "saved to draft" hint is the only feedback |
| 2 | Match System / Real World | 3 | Copy reads cleanly; preview pills mirror real product behavior |
| 3 | User Control and Freedom | 2 | "Popular" chips auto-navigate on click — no preview, no escape |
| 4 | Consistency and Standards | 3 | Mostly DESIGN.md-aligned; one dead Tailwind class (`font-inherit`) |
| 5 | Error Prevention | 2 | Input has no `<label>`, no `autocomplete`, accepts empty submit silently |
| 6 | Recognition Rather Than Recall | 3 | Surfaces are visible; nav and CTA labels are explicit |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, no autocomplete on the intent input |
| 8 | Aesthetic and Minimalist Design | 2 | Sparkles icon + identical 3-step card grid + nested cards break the system |
| 9 | Error Recovery | 2 | No designed empty/error state on the hero form |
| 10 | Help and Documentation | 2 | "See how it works" link is the only help affordance |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment.** The page does not read "generic SaaS landing" at first glance — the EB Garamond hero and the civic sky/green discipline carry the brand register PRODUCT.md asks for. But three category-reflex tells leak in: a Lucide Sparkles icon in the hero (the universal "AI inside" cliché), a three-equal-cards "How it works" grid, and a "no fee / private / any lang" check-strip. Stacked, they push the page back toward the SaaS landing reflex PRODUCT.md explicitly rejects.

**Deterministic scan.** Detector returned 1 finding — `gray-on-color` at line 188 (`text-slate-950 on bg-green-500`). False positive: `slate-950` is near-black, not gray, and DESIGN.md prescribes this pairing for the Drenched Final Section.

**Visual overlays.** Not attempted (no live browser session).

## Overall Impression

The Home page mostly does what DESIGN.md says it should: civic palette, serif headlines, flat surfaces, tight radii, no glass. The biggest opportunity is not adding more — it's removing three specific tropes (Sparkles icon, identical step cards, nested job-preview cards) and fixing the RTL hostility in the Languages section. Once those are gone, the page reads as the "embassy desk" it's supposed to be.

## What's Working

- **Eyebrow + serif headline rhythm.** Every section opens with the prescribed Civic Sky uppercase eyebrow (tracking 0.12em) and an EB Garamond headline. Exactly the hierarchy DESIGN.md calls "half of the visual hierarchy on long-form pages."
- **Match Honesty in the preview.** The job preview ships a 52% Caution Amber pill among the green/sky scores. PRODUCT.md design principle #4 made flesh — a marketing surface that doesn't inflate the demo.
- **Final CTA section.** Drenched Civic Sky Deep, Permit Green Bright button with slate-950 text, ghost secondary CTA — matches the Drenched Final Section Rule precisely.

## Priority Issues

### [P1] Sparkles icon in the hero input (line 71)
- **Why it matters.** PRODUCT.md design principle #5: *"AI is plumbing, not the product. No AI personification."* Lucide's Sparkles is the most recognizable AI-personification icon on the web. Users coming from any AI tool read it as "this is an AI search box," which is exactly the framing PRODUCT.md rejects.
- **Fix.** Replace with `Search`, `Briefcase`, or no icon at all. The placeholder carries the affordance.
- **Suggested command.** `/impeccable distill`

### [P1] Identical 3-step card grid (lines 119–133)
- **Why it matters.** Shared "identical card grids" absolute ban: same-size cards, number + heading + body, x3. The horizontal rule + serif numeral mitigates slightly but doesn't escape the form. Single most "AI made this" moment on the page.
- **Fix.** Break the structural sameness — horizontal flow with connecting hairlines, alternating-row narrative blocks with a marginal step number, or cut the section (the user already gets upload → match → apply from the hero + spotlight).
- **Suggested command.** `/impeccable shape`

### [P1] Nested cards in Feature Spotlight (lines 154–163)
- **Why it matters.** DESIGN.md: "Nested cards are forbidden." The sky-50 panel with a 1px Edge border contains four white job-preview cards each with their own border. Two card layers, exactly the pattern banned.
- **Fix.** Drop the outer card and let preview rows sit directly on the section background, or keep the outer and make inner rows borderless list items separated by hairlines.
- **Suggested command.** `/impeccable layout`

### [P1] Languages section pinned to LTR (line 174)
- **Why it matters.** `dir="ltr"` forces every script including العربية to render LTR inside a serif display row. PRODUCT.md anti-reference: "RTL Arabic gets real layout attention, not a `dir=\"rtl\"` afterthought." A page boasting multilingual support that pins its own showcase to LTR undermines its own claim.
- **Fix.** Remove `dir="ltr"`. If bidi runs render ugly, present the six languages as a grid of six cells — each renders in its own direction.
- **Suggested command.** `/impeccable adapt`

### [P2] Hero input has no label and no autocomplete (lines 72–78)
- **Why it matters.** PRODUCT.md targets WCAG 2.1 AAA where feasible. Placeholder is not a label; SRs don't read it as one. No `autoComplete`, no `aria-label`, no visible label.
- **Fix.** Add a visually-hidden `<label htmlFor>` and an explicit `autoComplete` attribute. Placeholder can stay as hint.
- **Suggested command.** `/impeccable harden`

## Persona Red Flags

**Maya (Job-Seeker on a slow connection, intermediate English).**
- Hero form has no label; placeholder disappears the moment she types, losing the prompt mid-sentence.
- "Popular" chips auto-navigate on click — she clicks "Software Engineer" out of curiosity and lands on `/signup` with no preview or undo.
- The Sparkles icon frames the product as an AI toy, not the infrastructure tool PRODUCT.md describes.

**Hana (Native Arabic reader, professional engineer).**
- Languages section forces `dir="ltr"`. The one place on the page that should signal "your script is a first-class citizen" signals the opposite.
- The `mx-3` separators between language names will break in an RTL context once the rest of the page mirrors.

**Jordan (First-time visitor, screen-reader user).**
- Sparkles, ArrowRight, Check, ExternalLink icons throughout — none `aria-hidden="true"`. SR users hear icon names interleaved with copy.
- Footer "Product" column header is a `<p>` rather than a heading, breaking landmark navigation.

## Minor Observations

- Line 98: `font-inherit` is not a Tailwind utility. Remove or use `font-[inherit]`.
- Line 188: Final-CTA detector finding is a false positive against DESIGN.md's prescribed pattern.
- Trust strip ("no fee / private / any lang") leans toward generic SaaS checkmark-strip. Consider one sentence of plain copy.
- Footer has effectively one column of links — looks unfinished. Add Company / Legal / Contact or collapse to a single-line minimal footer.
- Empty `intent` submit navigates anyway; the input behaves like ornament on first visit.

## Questions to Consider

- What if Sparkles is removed and the input stands alone? Does the page lose anything besides the AI signal?
- Does "How it works" need three equal steps, or could it be a single narrative paragraph with inline markers?
- What would the Languages section look like with no `dir` attribute and trust given to the browser's bidi shaping?
- Should "Popular roles" chips populate the input instead of auto-navigating, giving a moment of agency before commitment?
