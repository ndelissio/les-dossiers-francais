# Design reference: Unité 4 drills

Two standalone drills were built outside this repo for Test 4 (Unité 4, chapitres 16–19). Nicholas likes them enough to consider redesigning the dossier around them, or at least borrowing heavily from them. This folder is the input for that design discussion. It is not a build order. The build-gate workflow in CLAUDE.md still applies.

| file | what it is |
|---|---|
| `vocab-spelling-drill.html` | 80-word EN → FR spelling quiz plus FR → EN recognition and a word list |
| `grammar-drill.html` | 106 grammar items across 5 topics, mixing typed answers and inline drop-downs |
| `grading.js` | the shared grading and diff logic, extracted as pure functions |
| `grading.test.js` | 23 probes: `node design-reference/grading.test.js` |

Open both HTML files in a browser and use them before reading further. Answer some questions wrong on purpose: miss an accent, drop an article, use the wrong auxiliary, get an agreement wrong. Most of what matters is in how the feedback reacts.

## What Nicholas called out

1. **The answer field looks like a French copybook.** It is ruled like Seyès paper: faint lines every 8px, every fourth line darker, faint verticals every 64px, and a red margin line on the left.
2. **After Check, he sees his own answer corrected in red against the right one.** The **You** row strikes through wrong or extra characters. The **Correct** row underlines what he missed.

These two are settled. The rest of this document is what else the drills do, so you can judge what to carry over.

## Component inventory

**Page frame**
- Narrow single column (max ~680px) with a header: eyebrow (unit · chapters), title, one-line description.
- Settings strip, all choices persisted per viewer:
  - topic (single topic, or all mixed)
  - question count
  - format: mixed, typing only, or drop-down only
  - source: all questions, or "My misses (n)"
  - Strict accents
- **Rule card above the question card, always visible.** It changes with the current item's topic in mixed mode, and is replaced by a by-topic score table on the results screen.

**Question card**
- 4px progress bar, then "Question 3 of 20 · 2 correct so far".
- Topic tag, a one-line instruction, and the sentence in a serif at ~24px.
- **Typed item.** The blank is an underlined gap inside the sentence that fills live as you type. The ruled input sits below, with the accent key row under it (`é è ê ë à â ç î ï ô û ù œ '`). Keys insert at the caret without stealing focus.
- **Drop-down item.** A native `<select>` sits *inline in the sentence* where the blank is, styled as a tinted, underlined gap. It has 2 or 4 options, shuffled on every render, with a disabled "choisir…" placeholder. Keys 1–4 pick an option.
- An infinitive cue in muted parentheses after the sentence, when the item needs one: `(rentrer)`.

**Feedback panel**
- Verdict line, toned green (ok), amber (near-miss) or red (wrong, auxiliary, skip).
- You / Correct diff rows (typed items). A wrong drop-down pick gets a struck-through You row instead.
- The full correct sentence, then a one-line **why**, with the key form in bold.
- "Also accepted: …" for alternates, and a "My answer was right, count it" override link on any miss except a skip.
- The gap and field turn green or red, and the input locks.

**Flow and results**
- Keyboard: Enter checks, and Enter again advances.
- A mixed set is balanced across topics by round-robin.
- Results show:
  - the score with a percentage
  - a per-topic breakdown
  - every miss, with the full correct sentence and what was typed, labelled by verdict
  - a "Retry the N missed" button
- **Misses pile** in `localStorage`:
  - a miss adds 1 and a later correct answer subtracts 1
  - the override clears the item
  - the pile feeds "My misses"
  - every access is wrapped in try/catch

**Look**
- Accent: a violet "encre" ink. Red is the correction-pen color and is used only for errors.
- Tokens are defined in light and dark. The pages follow the system theme with no toggle.
- Fonts: a serif for French text (Literata), a sans for the UI (Libre Franklin). The reference pages pull both from Google Fonts. The dossiers are offline, so use system stacks or embed the fonts.
- Phone width is handled: one column, with the hint text hidden.

## Grading ladder

Implemented in `grading.js`. The first match wins.

| verdict | trigger | tone |
|---|---|---|
| ok | normalized input is in the accepted set | green |
| accent | matches once accents are folded (œ → oe too) | amber; a miss unless Strict accents is off |
| article | noun typed bare where an article is required | amber |
| gender | right noun, wrong-gender article | amber |
| pronoun | reflexive verb without s' / se | amber |
| agreement | passé composé with the right auxiliary, participle ending off | amber |
| auxiliary | passé composé with the right participle and the wrong auxiliary | red |
| close | edit distance ≤ 2 (target ≥ 5 chars) | amber |
| wrong / skip | anything else / "I don't know" | red |

The accepted set is the canonical form plus alternates, with these expansions:
- **Nouns:** each form is also accepted with the other article: le↔un, la↔une, les↔des, and l' by gender.
- **Vocab:** articles stay required, per the existing standard.
- **Nominalisation:** sets `articleOptional`. Gender is not what that drill tests, but a wrong-gender article is still caught.

## Item schemas

**Vocab entry.** Compatible with the existing `f` / `a` / `n` bank, plus two fields:

```js
{f: "l'effondrement", a: [], type: "n", g: "m"}   // g only needed for l' nouns
{f: "un citadin", a: ["une citadine"], type: "n"}
{f: "s'avérer", type: "v"}                         // reflexive detected from f
```

**Grammar item.** `"___"` marks the single blank:

```js
// typed
{t: "pc", k: "type", s: "Hier soir, Léa ___ très tard.", a: ["est rentrée"], cue: "(rentrer)",
 x: "rentrer with no direct object → être; agrees with Léa → <b>est rentrée</b>."}
// drop-down: correct option FIRST, shuffled at render; 2 or 4 options only
{t: "rel", k: "pick", s: "Voici le médicament ___ tu as besoin.", ch: ["dont", "que", "qui", "où"],
 x: "avoir besoin <b>de</b> → <b>dont</b>."}
```

Other optional fields: `ins` (instruction line), `noun` + `g` + `articleOptional` (typed nominalisation).

## Authoring lessons from building the grammar drill

These are leaks and traps that came up while writing the 106 items.

- **Never let the sentence give the answer away.**
  - `La ___ de l'école est prévue…` gave away the feminine suffix through *prévue*.
  - An article in front of the blank (`Le ___ durable`) gave away the suffix's gender. Put the article *inside* each option instead: `le développement / la développation / le développage / la développure`.
- **Check every distractor once it's placed in the sentence.** `___ on trouve` makes `que on` look wrong because of elision, which gives the answer away. Reword so every option reads naturally.
- **Distractors should be plausible wrong forms,** not obviously impossible ones: made-up suffixes, the conditionnel next to the futur, *pouvra* next to *pourra*.
- **Avoid real words with the wrong meaning** as distractors unless the item is about that difference (*arrivage* or *haussement* would be unfair).
- **Cues are infinitives only.** Never label the auxiliary or hint at agreement (existing standard).
- **Gender-only questions are weak tests of nominalisation.** Nicholas pushed back on "choose le / la". Test producing the noun, by spelling it or choosing among suffix forms.
- **Reuse the unit's vocabulary inside grammar sentences,** so every grammar item doubles as vocab review.
- **Everyday, neutral contexts only.** No military content (standing preference).
- **Every item gets a one-line `x`.** It shows after the answer, right or wrong.

## Rule card guideline

- At most 5 bullets.
- Bold the forms, give one short example per bullet, and use the unit's own vocabulary where possible.
- It is reference material, not a hint for the current item, so it must not single out the answer.
- It satisfies the existing standard that grammar drills carry an always-visible rule explainer.

## Questions to settle with Nicholas

Read the current dossier first. Then come back with 2–3 concrete options and rough effort for each, and put the choice to him through the usual decision widget. Questions worth raising:

1. **Scope.** Which of these?
   - A full visual redesign of the dossier.
   - Adopting the drill components (ruled field, diff feedback, inline drop-downs, rule card, results) inside the current shell.
   - A shared drill engine that every unit uses.
2. **Visual identity.** Move the dossier to this palette and type (violet ink, Seyès ruling, serif French), or keep its identity and take only the components?
3. **Existing drill data.** Current grammar items look like `{q, a, hint}` with cues in parentheses inside `q`. Migrating to `{s, a | ch, cue, x}` means:
   - splitting out cues
   - writing a `why` line for every item
   - auditing the parenthetical hints for leaks
   - picking which items become drop-downs

   How much of that is worth it per unit?
4. **Single-file offline constraint.** Where should the shared engine live? Options: duplicated per unit, or a build step that inlines a shared module into each dossier.
5. **Misses pile and analytics.** Merge the per-item misses tally into the dossier's existing analytics, or keep it separate?
6. **Schema additions.** Add `type` and `g` to the vocab bank (needed for article and gender verdicts on l' nouns), `articleOptional` for nominalisation, and `pc` handling for passé composé.
7. **Rollout.** Build Unit 4 on the new design first and backport later, or retrofit Units 1–3 at the same time? Either way, a design change this size is a MAJOR version bump.
