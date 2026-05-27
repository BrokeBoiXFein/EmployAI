---
name: EmployAI
description: Multilingual AI job-search infrastructure for immigrants. Calm, civic, multilingual; dignified by default.
colors:
  civic-sky: "#0284c7"
  civic-sky-deep: "#0369a1"
  civic-sky-bright: "#0ea5e9"
  civic-sky-pale: "#f0f9ff"
  permit-green: "#16a34a"
  permit-green-deep: "#15803d"
  permit-green-bright: "#22c55e"
  caution-amber: "#f59e0b"
  warning-red: "#b91c1c"
  surface-light: "#f8fafc"
  surface-light-card: "#ffffff"
  surface-dark: "#020617"
  surface-dark-card: "#0f172a"
  surface-dark-sunken: "#1e293b"
  ink-strong-light: "#0f172a"
  ink-body-light: "#334155"
  ink-muted-light: "#64748b"
  ink-strong-dark: "#ffffff"
  ink-body-dark: "#cbd5e1"
  ink-muted-dark: "#94a3b8"
  edge-light: "#e2e8f0"
  edge-dark: "#1e293b"
typography:
  display:
    fontFamily: "'EB Garamond', Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'EB Garamond', Georgia, serif"
    fontSize: "clamp(2.25rem, 4vw, 3rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'EB Garamond', Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "8px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "96px"
components:
  button-cta:
    backgroundColor: "{colors.permit-green}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-cta-hover:
    backgroundColor: "{colors.permit-green-deep}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary:
    backgroundColor: "{colors.civic-sky}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.civic-sky-deep}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  input-text:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-strong-light}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.surface-light-card}"
    textColor: "{colors.ink-body-light}"
    rounded: "{rounded.md}"
    padding: "24px"
  nav-item-active:
    backgroundColor: "{colors.civic-sky}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  score-pill-high:
    backgroundColor: "{colors.permit-green}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  score-pill-mid:
    backgroundColor: "{colors.civic-sky}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  score-pill-low:
    backgroundColor: "{colors.caution-amber}"
    textColor: "{colors.surface-light-card}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: EmployAI

## 1. Overview

**Creative North Star: "The Embassy Desk"**

EmployAI is the visual equivalent of a quiet, well-run embassy desk: a serious counter where someone helps you navigate a foreign system without making a scene of it. The whole interface carries that posture. Tight radii, civic colors, serif headings that lend gravity without ornament, sans-serif body that gets out of the way. The application surfaces and the marketing surface speak the same dialect, with the Home page borrowing a little more headline air and the workspace pages giving it back to make room for data.

The system explicitly rejects the two reflexes that AI tools and "for-immigrants" products usually trip into. It is not a generic SaaS landing page with a gradient hero, a big metric, and three identical feature cards. It is not a charity-coded interface with stock smiling-faces photography and warm "we believe in you" copy. EmployAI's users are professionals operating in unfamiliar infrastructure; the design treats them as such. Color, typography, and components all push toward dignified competence over visual marketing.

**Key Characteristics:**
- **Serif-led display, sans-led body.** EB Garamond carries every headline that does narrative work; Lato carries everything operational.
- **Two-color identity.** Civic Sky for trust, presence, and navigation. Permit Green for action and approval. Nothing else gets to be a brand color.
- **Tight radii, flat by default.** 6px on controls, 8px on cards. No 2xl rounding outside marketing surfaces. No shadows except on the auth card in light mode.
- **Civic neutrals.** Slate everywhere; tinting toward sky in future passes. Backgrounds use the body, not the card.
- **Full first-class dark mode.** Every surface, control, and state is designed in both themes; dark is a real mode, not an inverted skin.
- **Six-language native.** Typography stack and copy structure assume RTL Arabic and ideographic Chinese as equal citizens.

## 2. Colors: The Civic Palette

A constrained, civic palette. Two brand colors do real work; one third color flags warning; everything else is slate. No decorative color exists.

### Primary
- **Civic Sky** (`#0284c7`): The identity color. Navigation active state, every link, eyebrow labels, app primary buttons (Login, app-shell actions), score pill at mid match. The trust signal across the system. Deep variants (`#0369a1`) carry hover and the final-CTA drenched section.

### Secondary
- **Permit Green** (`#16a34a`): The action color. Every primary CTA on marketing surfaces (Sign Up, Get Started, Final CTA), the Check icons in trust strips and bullet lists, and the score pill for high matches. Carries permission and forward motion, never decoration. Hover steps to `#15803d`; dark mode brightens to `#22c55e` over `#020617`.

### Tertiary
- **Caution Amber** (`#f59e0b`): Reserved for the low-match score pill (under 55%) and any future warning state. Never a brand color, never decorative. Its rarity is what makes it readable when it appears.

### Neutral
- **Surface light** (`#f8fafc`): Page background in light mode. Slate-50; gives white cards a visible boundary.
- **Surface light card** (`#ffffff`): Card and panel background, light mode. (Currently literal white; see The Tint Drift Rule in Don'ts.)
- **Surface dark** (`#020617`): Page background, dark mode. Slate-950; deep near-black with a subtle blue undertone.
- **Surface dark card** (`#0f172a`): Card and panel background, dark mode.
- **Edge light** (`#e2e8f0`) / **Edge dark** (`#1e293b`): The only borders that should appear. 1px, always.
- **Ink strong light** (`#0f172a`) / **Ink strong dark** (`#ffffff`): Headings.
- **Ink body light** (`#334155`) / **Ink body dark** (`#cbd5e1`): Body copy.
- **Ink muted light** (`#64748b`) / **Ink muted dark** (`#94a3b8`): Captions, footnotes, eyebrow color in muted contexts.

### Named Rules

**The Two-Voice Rule.** Civic Sky and Permit Green are the only brand colors. Sky carries trust; Green carries action. If a third brand color appears anywhere outside the score scale, it is wrong and must be removed.

**The Match Honesty Rule.** Score pills color by truth, not by encouragement. Green at high match, Sky at mid, Amber at low. Never recolor a low score upward to soften it; the low-match coach exists for that.

**The Drenched Final Section Rule.** The closing CTA section on Home is fully drenched in Civic Sky Deep (`#0369a1`). That is the only place in the entire system where the surface IS the color. Do not introduce a second drenched section.

## 3. Typography

**Display Font:** EB Garamond (with Georgia, serif fallback)
**Body Font:** Lato (with Inter, system-ui fallback)
**Label Font:** Lato

**Character:** A serif of civic gravity paired with a sans of operational clarity. EB Garamond gives headlines the weight of something official without looking like a stock SaaS Inter h1. Lato handles every form, label, button, and paragraph at any size with the same calm legibility, including across the six supported scripts.

### Hierarchy

- **Display** (500, `clamp(3rem, 7vw, 4.5rem)`, line-height 1.05, letter-spacing -0.01em): Home hero only. Applied via `.h-serif` utility plus Tailwind size classes.
- **Headline** (500, `clamp(2.25rem, 4vw, 3rem)`, line-height 1.15): Home section H2s, page-level titles.
- **Title** (500, 1.5rem, line-height 1.25): Card titles, modal titles, the H3 inside step cards on Home.
- **Body** (400, 1rem, line-height 1.6): All paragraph copy. Cap line length at 65–75ch. Slightly larger (1.125rem / 1.25rem) on marketing intros.
- **Label** (700, 0.75rem, letter-spacing 0.12em, uppercase): The signature eyebrow. Civic Sky color on light, Civic Sky Bright on dark. Sits above every section title on Home and above sub-blocks throughout the app.

### Named Rules

**The Serif-For-Headlines Rule.** Every headline (Display, Headline, Title) gets EB Garamond via the `.h-serif` class. Lato never carries a headline. The pairing is the identity; mixing it dilutes the system.

**The Eyebrow Rule.** Section transitions are introduced by a Civic Sky uppercase label set at letter-spacing 0.12em. Lowercase eyebrow text is prohibited; tracking below 0.1em is prohibited. The label is half of the visual hierarchy on long-form pages.

## 4. Elevation

The system is flat. There is no shadow vocabulary; depth comes from a single 1px Edge border between the card and the surface beneath it. Light mode uses Edge light (`#e2e8f0`); dark mode uses Edge dark (`#1e293b`). The one exception is the auth card in light mode, which carries a single `shadow-sm` to lift it off the otherwise empty `#f8fafc` page. Dark mode drops even that.

### Named Rules

**The Flat-By-Default Rule.** Cards, panels, modals, popovers: 1px Edge border, no shadow. If a surface seems to need a shadow to read, the page composition around it is wrong; fix the composition, not the elevation.

**The No-Glass Rule.** The `.glass` utility class lingers in `index.css` from an earlier design. It is forbidden in new work. Glassmorphism is one of the absolute bans in the shared design laws; this system does not use it.

## 5. Components

### Buttons
- **Shape:** Gently curved (6px, `rounded-md`). Same radius on every button at every size.
- **CTA (marketing):** Permit Green background (`#16a34a`), white text, 12px / 24px padding, font-weight 700. Hover steps to Permit Green Deep (`#15803d`). Dark mode keeps Permit Green over the dark surface; on the Drenched Final Section, switches to Permit Green Bright (`#22c55e`) with `slate-950` text for contrast.
- **Primary (app):** Civic Sky background, white text, 10px / 16px padding, font-weight 600. Hover steps to Civic Sky Deep. Used in Login, Signup, and in-app primary actions.
- **Secondary (ghost on dark):** Transparent background, 1px white-30 border, white-90 text. Used on the Drenched Final Section as the lower-emphasis companion to the CTA.
- **Hover / Focus:** Color transition only (`transition-colors`, ~150ms). No translate, no scale, no shadow change. Focus uses a 2px Civic Sky ring (`focus:ring-2 focus:ring-sky-500`) with `focus:border-transparent`.

### Inputs
- **Style:** 6px radius, 1px Edge border, background steps one tone away from the surrounding surface: light mode uses Surface light (`#f8fafc`) inside a white card; dark mode uses Surface dark sunken (`#1e293b`) inside a slate-900 card.
- **Padding:** 10px vertical, 16px horizontal. When prefixed with an icon (mail, lock, search), left padding becomes 40px to clear the absolute-positioned icon.
- **Focus:** 2px Civic Sky ring with transparent border. No glow. No double border.
- **Error:** Combines with an alert chip above the field (red-50 / red-200 / red-700 light; red-500/10 / red-500/30 / red-300 dark) carrying an `AlertCircle` icon and the message. Inputs themselves don't recolor on error.

### Cards
- **Corner Style:** 8px (`rounded-lg`). Never larger. The only place the system tolerates anything more rounded is the score pill (full).
- **Background:** Surface light card (`#ffffff`) on light, Surface dark card (`#0f172a`) on dark.
- **Border:** 1px Edge. Always present.
- **Shadow:** None (see Elevation). Auth card is the one exception.
- **Internal Padding:** 24px (`p-6`) default; 28px on step cards; 32px on the auth card. Nested cards are forbidden.

### Navigation
- **Style:** Fixed top bar, 64px tall, 1px Edge bottom border, white / slate-900 background.
- **Idle item:** Lato 500, slate-700 / slate-300 text, 12px / 6px padding, 6px radius, slate-100 / slate-800 hover background.
- **Active item:** Civic Sky background (light) or Civic Sky Bright (dark), white / slate-950 text. The active state is intentionally bold; users navigating in their second or third language need a strong "you are here" signal.
- **Brand mark:** A 36px Civic Sky square with white "E" plus the wordmark in Lato 700.

### Score Pill (Signature Component)
- **Shape:** Pill (`rounded-full`), 10px / 4px padding, Lato 700, 12px text.
- **High match (≥70%):** Permit Green background, white text.
- **Mid match (55–69%):** Civic Sky background, white text.
- **Low match (<55%):** Caution Amber background, white text.
- **The rule:** Color carries meaning. Score pill is the only place these three colors appear together; that's how the legend stays readable without a key.

### Eyebrow Label
- **Style:** Lato 700, 12px, uppercase, letter-spacing 0.12em, Civic Sky color (Sky Bright on dark).
- **Use:** Above every section title on long-form pages, above sub-blocks in the app. Never used as standalone body, never used in card titles, never used at body-text size.

## 6. Do's and Don'ts

### Do
- **Do** use `.h-serif` on every Display, Headline, and Title element. EB Garamond is half the identity.
- **Do** carry Civic Sky for trust and presence (links, nav active, eyebrows, primary in-app actions); carry Permit Green for action and approval (CTAs, check marks, high-match score).
- **Do** use 6px radius on controls and 8px on cards. No mixing radii within a single screen.
- **Do** rely on a single 1px Edge border for depth. Light: `#e2e8f0`. Dark: `#1e293b`.
- **Do** introduce sections with a Civic Sky uppercase eyebrow at letter-spacing 0.12em, followed by a serif headline.
- **Do** color score pills by truth: Green high, Sky mid, Amber low. Show the real number.
- **Do** design every component in both light and dark themes from the start. Dark is not an afterthought.
- **Do** treat layout direction (LTR / RTL) as structural. Use logical properties (`ms-*`, `me-*`, `start-*`, `end-*`) and mirror directional icons.

### Don't
- **Don't** ship a generic SaaS landing page. No gradient hero, no big-metric hero block, no "Trusted by [logos]" strip, no three-identical-feature-cards grid. (Carries PRODUCT.md's anti-references directly.)
- **Don't** use charity / NGO design tropes: stock smiling-faces photography, warm "we believe in you" copy, recipient-coded visual language. Users are professionals, not beneficiaries.
- **Don't** use the `.glass` utility class. It lingers in `index.css` from an earlier design and is the visual signature of an aesthetic this system rejects.
- **Don't** use the legacy `--primary: #4f46e5` indigo variable in `:root`. It pre-dates the Civic Sky palette and should be removed. New components reference Tailwind sky-* utilities directly.
- **Don't** introduce a third brand color. Sky and Green are the brand. Amber is functional. Everything else is slate.
- **Don't** use gradient text, side-stripe borders, identical card grids, hero-metric templates, or modals as a first thought. (Cross-register absolute bans.)
- **Don't** use em dashes in UI copy. Comma, colon, semicolon, period, or parentheses.
- **Don't** add shadows to lift a surface that doesn't need lifting. The system is flat; if it reads wrong, the composition is wrong.
- **Don't** use `rounded-2xl` or larger outside the Home page hero card. Tight radii are part of the civic-tool feel.

### Named Rules (continued)

**The Tint Drift Rule.** Cards currently use literal `#ffffff` and headings use literal `#ffffff` in dark mode. The shared design laws prefer near-white tinted toward the brand hue (chroma 0.005–0.01). Until a tinting pass lands, document this as a known drift, not a future-proofed pattern. New design work that introduces a near-white surface should tint toward Civic Sky.
