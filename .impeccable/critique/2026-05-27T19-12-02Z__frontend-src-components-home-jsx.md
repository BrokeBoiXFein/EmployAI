---
target: Home.jsx (marketing surface)
total_score: 29
p0_count: 1
p1_count: 2
timestamp: 2026-05-27T19-12-02Z
slug: frontend-src-components-home-jsx
---
# Critique: Home.jsx (marketing surface)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Intent persists with hint, but form submit has no loading state |
| 2 | Match System / Real World | 4 | Copy is clear and translates well; conventions met |
| 3 | User Control and Freedom | 3 | Nav always present; no trap states on a marketing page |
| 4 | Consistency and Standards | 2 | Footer brand mark uses bg-white while nav uses bg-sky-600; placeholder anchors look interactive |
| 5 | Error Prevention | 3 | No destructive actions on Home; intent field is forgiving |
| 6 | Recognition Rather Than Recall | 4 | Every option visible; nothing hidden behind memory |
| 7 | Flexibility and Efficiency | 2 | No keyboard accelerators; popular chips don't pre-fill the intent field they sit next to |
| 8 | Aesthetic and Minimalist Design | 2 | Three identical-card grids (How it works, Languages, Stories) trip the SaaS reflex; dot-grid hero background reads as templated |
| 9 | Error Recovery | 3 | n/a on Home; nothing to recover from |
| 10 | Help and Documentation | 3 | "How it works" section IS the help; contextual but mid-page |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict

LLM assessment: hero is the SaaS-landing reflex almost beat for beat. The middle of the page is three identical-card grids in a row (How it works 3, Languages 6, Stories 3). PRODUCT.md anti-references explicitly name this pattern. Bottom drenched CTA section is the one section that breaks rhythm.

Deterministic scan: 1 finding, false positive. gray-on-color at line 216 (text-slate-950 on bg-green-500). slate-950 is near-black, not gray; intentional high-contrast on the Drenched Final Section. Ignored.

## Overall Impression

Strong identity in the hero typography and the final CTA section. Between them, the page falls into templated grid-card composition three times in a row. Combined with literal href="#" links on every Popular chip and every About footer link, Home violates PRODUCT.md's #1 design principle (No purely-visual controls). That's the single biggest opportunity.

## What's Working

1. Hero typography hierarchy. Civic Sky eyebrow + EB Garamond serif h1 + Lato sub + green CTA. Strongest moment on the page.
2. Drenched Final CTA section. The one section that commits.
3. Translation discipline. Every string runs through t.*. RTL gets dir="rtl" at the App level. Real, not cosmetic.

## Priority Issues

### [P0] Placeholder href="#" links violate the project's #1 design principle

At least 7 violations:
- Home.jsx:96 - every Popular role chip is <a href="#">
- Home.jsx:250-253 - Footer About links (Team, Mission, Privacy) all href="#"

Why it matters: This is the project's load-bearing design rule. Shipping seven instances undermines its authority.

Fix: Wire popular chips to pre-fill intent + submit. For footer links without real pages, remove or replace with non-anchor spans.

Suggested command: /impeccable harden

### [P1] Three identical-card grids in a row trip the SaaS reflex

Middle of page is 3 cards, 6 cards, 3 cards. Exactly the DESIGN.md Don't (three-identical-feature-cards grid).

Fix: Break cadence. Languages as inline display-size running prose. Stories down to one quotation until real testimonials exist. How it works keeps three (semantically right), but unifies vertical rhythm so it doesn't look like the same grid as the other two.

Suggested command: /impeccable bolder (Languages + Stories) or /impeccable distill if remove instead of rework.

### [P1] Stories section is charity-trope-coded

Placeholder initials on sky/slate/green backgrounds with placeholder names. Reads exactly like the PRODUCT.md anti-reference (design that signals the user is a recipient of help). Also burns brand-color budget on decorative initial backgrounds.

Fix: Remove until real testimonial with consent exists. If something must stay, one pull-quote from research notes.

Suggested command: /impeccable distill (Stories).

### [P2] Em dash literal in copy

Home.jsx:144 and siblings: <b>...</b> -- text. Shared design law prohibits em dashes; DESIGN.md repeats it.

Fix: Replace " -- " with ": " (label-then-description pattern).

Suggested command: /impeccable clarify

### [P2] Hero dot-grid background is a templated tell

radial-gradient dot pattern at 22px 22px is a saturated SaaS reflex. Contradicts the Embassy Desk North Star.

Fix: Drop the dot-grid layer. Serif headline against Civic-Sky-tinted near-white is more on-brand. If texture needed, a single horizontal Edge rule (the embassy-desk counter).

Suggested command: /impeccable distill (hero only).

## Persona Red Flags

Maria (mid-career RN, Spanish UI, mobile): types "Enfermera registrada" in intent input, CTA works. But Popular chips below are her natural next click and every one is href="#". Thinks the chip system is broken in Spanish. Primary failure: P0.

Ahmad (civil engineer, RTL Arabic, mobile): page wraps dir="rtl" at App level, mostly works. But ArrowRight icon on green CTA does not mirror in RTL; still points right. Primary failure: directional icons not mirrored for CTAs in RTL.

Jordan (skeptical evaluator): hits Stories. Reads placeholder initial avatars and "based on user research" footnote. Pattern-matches to "school project with fabricated testimonials." Walks away. Primary failure: P1 charity-coded Stories.

## Minor Observations

- Footer brand mark uses bg-white while nav uses bg-sky-600. Should be the same.
- JobPreview uses US tech companies (Stripe/Plaid/Block) with US salary bands. Worth one nursing role and one trades role to broaden audience signal.
- Story sub-component nests h-serif span around colored-circle span with empty style={{}}. Code smell.
- "Featured Top Matches" preview card reads as live data. Label "Example" or load real data.

## Questions to Consider

- What if Popular chips populated the intent field instead of href="#"?
- What if Stories was one quote, not three cards?
- What if Languages was display-size running type (English . Espanol . Francais . arabic . zhongwen . hindi) instead of a 6-card grid?
- What does the hero look like without the dot-grid background?
