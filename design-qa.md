# Hybrid CV and Cover Letter Design QA

## Comparison setup

- Source visual truth: `tmp/pdfs/walleed-1.png`, `tmp/pdfs/birgitte10-1.png`, `tmp/pdfs/helle7-1.png`, and `tmp/pdfs/guide-en-1.png`.
- Implementation evidence: `tmp/pdfs/implementation-cv-viewport.png` and `tmp/pdfs/implementation-cover-letter-final.png`.
- Browser viewport: 1280 x 720 CSS px, device scale factor 1.
- Source pixels: CV references 993 x 1404; application guide 992 x 1404.
- Implementation pixels: 1280 x 720 browser captures. The print documents are rendered as responsive A4 canvases inside the desktop app; density was not rescaled because the comparison focused on hierarchy, typography, spacing, palette, and readable document treatment rather than pixel-identical cloning of one source.
- State: desktop, app dark theme, English CV and cover letter; Danish cover-letter mode was also exercised.

## Full-view comparison evidence

- CV: the implementation combines the references rather than reproducing one template. It carries Birgitte's ATS-safe single-column hierarchy and aligned dates, Helle's skills-first ordering and strong uppercase section labels, and Walleed's restrained pale-sage profile treatment. Contact details, summary, skills, quantified experience, projects, education, languages, and certifications remain selectable text.
- Cover letter: the implementation follows the guide's headline, motivation, evidence/contribution, and closing sequence while using the same sage-and-black document language as the CV.
- The app chrome remains theme-aware while both document canvases stay white with fixed print-safe dark text.

## Focused-region comparison evidence

- CV header/profile region: name and contact hierarchy are compact; the sage profile panel is visually distinct without introducing ATS-hostile icons, photos, sidebars, or tables.
- CV experience region: role, company, dates, and achievement bullets remain easy to scan and mirror the strongest structural patterns in the references.
- Cover-letter header/body region: candidate contact data, factual role/company headline, localized subheads, three concise paragraphs, closing, and signature fit the guide's intended reading order.

## Findings and iteration history

1. P1 - Dark-mode paper contrast. Initial browser capture showed a dark document canvas with fixed dark document text. Fixed both previews to force white paper, `#111111` body text, and explicit muted grays. Post-fix computed styles are white background and `rgb(17, 17, 17)` text in both documents.
2. P1 - Repeated quantified evidence. Initial generated cover letter repeated the same 40% achievement in its evidence paragraph. The generator now suppresses a quantified suffix when that normalized claim is already present. English and Danish regression tests confirm the metric appears once.
3. No remaining P0, P1, or P2 visual issues were found in the final comparison.

## Required fidelity surfaces

- Fonts and typography: passed. Arial/Helvetica-compatible sans-serif typography, strong uppercase section labels, readable body sizes, and clear heading weights match the references' professional tone.
- Spacing and layout rhythm: passed. A4 margins, section rules, compact contact block, profile inset, aligned dates, and consistent vertical gaps preserve scanability.
- Colors and visual tokens: passed. Black/gray print palette with a restrained sage accent is consistent across CV and cover letter and remains readable in app dark mode.
- Image quality and asset fidelity: passed. The hybrid intentionally uses no photo or decorative asset because the verified data model does not contain one and the ATS-safe direction does not require it; no placeholder, CSS art, or fake icon was introduced.
- Copy and content: passed. Generated content remains verified-data-only, uses three guide-aligned cover-letter paragraphs, and removes repeated quantified evidence.
- Responsiveness and accessibility: passed for the desktop document workflow. Document text remains selectable, semantic headings and lists are retained, language toggles expose pressed state, and no browser console errors were observed.

## Interaction and technical checks

- Tested local job analysis, CV and cover-letter navigation, English/Danish language switching, live previews, and dark-theme document contrast in the in-app browser.
- Console errors: none in the final cover-letter verification state.
- Automated checks: 177 tests passed; lint, typecheck, production build, and `git diff --check` passed.

## Follow-up polish

- P3: a future optional photo field could support a more literal Walleed/Helle variant, but it should remain disabled by default for ATS submissions.

final result: passed
