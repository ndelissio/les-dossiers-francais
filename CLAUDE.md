# Français Dossiers — Project Rules for Claude Code

## What this project is
Self-contained, single-file HTML/JS study dossiers (localStorage progress tracking)
for French Basic Course students, built by Nicholas (student, Monterey). Used by
him and classmates. Product is class-agnostic — not tied to one
cohort's test date. Hosted on Cloudflare (Workers static assets; see
`wrangler.jsonc`). Live site:
https://les-dossiers-francais.5cr2cb4wzp.workers.dev/

Repo layout (adjust to match actual repo once cloned):
- Working/in-progress files: wherever we're actively editing
- Deployed dossiers: one HTML file per unit (fork-per-unit pattern)
- Source textbooks / prior dossiers: reference material, read-only

## STANDING RULE: Build-gate workflow — DO NOT SKIP
Never commit or push until explicitly told to. After discussing changes, summarize
the queued changes and open decisions, then wait for an explicit go-ahead
("build", "go", "confirmed", "ship it") before running git commit/push.
Batch small changes — don't commit piecemeal unless asked to.

## Versioning
- Scheme: MAJOR.MINOR.PATCH, with an optional 4th segment for hotfixes
  (e.g., v1.0.0.1).
- If content was missed in a prior release, use a PATCH bump, not a MINOR bump.
- Every release needs a changelog entry.
- Version string appears in exactly three places in each unit file — all three
  MUST be updated together:
  1. `<title>` tag
  2. `.eyebrow` div
  3. `<strong>` tag in the footer masthead
- Before building: verify the actual current version in the working file first.
  Building on a stale base silently reverts intervening changes.
- The landing page (`index.html`) shows each unit's version as a separate
  hardcoded `<span>` in that unit's folder card footer — it does NOT read from
  the unit files. Whenever a unit's version bumps, update its landing-page
  label in the same commit, or it silently drifts out of sync.

## Content & pedagogy rules
- Source-text authority: labeling, chapter titles, grouping, and sequencing
  follow the current unit's own source text (its textbook / glossaire) unless an
  explicit project rule says otherwise. When a forked engine carries a donor
  unit's labels or scope copy, correct them to the current unit — don't preserve
  the inherited wording.
- Drills must require a real decision. Fill-in-the-blank items where only one
  token is ever plausible test nothing — this applies even if conjugation isn't
  the target concept; ask "could a student get this right without applying the
  target grammar?"
- No clue-leakage: question text must never label the required tense/auxiliary/
  structure; distractors must not carry answer-revealing artifacts (e.g. stray
  "d'accord!", tense labels like "PC avec être/avoir" inside question text).
- Grammar drill instructions should orient students toward what they must DO
  (decide tense, produce full phrase, check pronoun category) — not restate the
  grammar rule itself.
- Grammar drill explainers: brief, always-visible, passive-exposure text at the
  top of every grammar drill.
- Vocab bank field discipline (applies to ALL vocab builds going forward):
  - `f:` = clean primary answer ONLY. Never embed synonyms, parentheticals, or
    slash-alternatives inside `f:`.
  - `a:[...]` = accepted alternate answers/synonyms.
  - `n:` = notes.
- Vocab grouping size: keep each topic/subtag group to ~20–25 words max. Split
  oversized groups into coherent subtopics rather than letting one balloon.
- Articles are always required in Vocabulaire spelling grading (no toggle).
- EN-side glossaire nouns always carry their article (the/a/an), even when the
  textbook omits it.
- Split-verb rule: a verb appearing as an infinitive in one chapter's glossaire
  but conjugated in a later chapter goes into the vocab trainer at the glossaire
  chapter; conjugation tables stay where taught.
- Mini-glossaire rule: chapters often have mid-activity "Vocabulaire"/
  "Vocabulaire utile" word lists tied to a specific reading or listening clip,
  separate from the end-of-chapter glossaire — and these words do show up on
  exams (confirmed via the Test 3 study guide: "appartenir" is only taught in a
  Ch 14 mid-activity matching exercise, never the end-of-chapter list). Fold
  genuinely useful mini-glossaire words into the vocab trainer as a flagged
  exception, same pattern as the Ch 6 exterior/restaurant sets in Unit 2 — own
  topic tag, own comment header ("activity-sourced — flagged exception to
  glossaire parity"), not silently merged into the main glossaire group. Skip
  words that are proper nouns, ungradable function words, or already covered by
  an existing card. Surface the shortlist for review before building, same as
  any other vocab bank content.
- Study-guide-dependent content stays marked "à venir" until the guide is
  actually uploaded.

## Build integrity / technical gotchas
- Unit 3 files use CR-only line terminators (classic Mac). Convert with
  `tr '\r' '\n'` before any line-based processing.
- Drill item banks: access via `d.bankItems || d.items` — some drills store the
  full bank under `bankItems` pre-shuffle.
- DOM stub / headless validation requires `setInterval`/`clearInterval` stubs in
  addition to standard ones — omitting them causes silent runtime failures.
- Script extraction from HTML: `sed -n '/<script>/,/<\/script>/p' | sed '1d;$d'`
  (don't rely on line numbers as the file grows).
- Node.js validation = syntax check + headless DOM probe (`vm.createContext`
  sandbox). Python used for assembly/patch scripts. Bash for glue.

## Communication style
- Terse, directional. Execute once a direction is approved — don't re-confirm
  repeatedly.
- No unsolicited scope expansion.
- Surface ambiguous judgment calls explicitly rather than resolving them
  silently — Nicholas reviews item banks / instruction text / design decisions
  before build authorization.

## Model preference
- Default to Sonnet for dossier builds.
- Reserve Opus-tier reasoning for isolated edge-case judgment calls only.
