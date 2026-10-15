/* Probe suite for grading.js. Run: node design-reference/grading.test.js
   Fold these cases into the dossier's vm.createContext probe suite when the engine adopts the module. */
const {prepare, grade} = require("./grading.js");

const cases = [
  // vocab: articles required, definite/indefinite interchangeable
  [{f: "la canicule", type: "n"}, "une canicule", "ok"],
  [{f: "la canicule", type: "n"}, "canicule", "article"],
  [{f: "le genou", type: "n"}, "la genou", "gender"],
  [{f: "l'effondrement", type: "n", g: "m"}, "un effondrement", "ok"],
  [{f: "les mœurs", type: "n", g: "fp"}, "les moeurs", "accent"],
  [{f: "un citadin", type: "n", a: ["une citadine"]}, "la citadine", "ok"],
  [{f: "jeûner", type: "v"}, "jeuner", "accent"],
  [{f: "s'avérer", type: "v"}, "avérer", "pronoun"],
  [{f: "s'avérer", type: "v"}, "s’avérer", "ok"],
  [{f: "la canicule", type: "n"}, "la canicul", "close"],
  // nominalisation: article optional, wrong gender still a miss
  [{f: "l'amélioration", type: "n", g: "f", articleOptional: true}, "amélioration", "ok"],
  [{f: "le sauvetage", type: "n", articleOptional: true}, "la sauvetage", "gender"],
  [{f: "le jeûne", type: "n", articleOptional: true}, "le jeune", "accent"],
  // passé composé
  [{f: "est rentrée", type: "pc"}, "est rentré", "agreement"],
  [{f: "est rentrée", type: "pc"}, "a rentrée", "auxiliary"],
  [{f: "est restée", type: "pc"}, "a resté", "auxiliary"],
  [{f: "ai vue", type: "pc"}, "ai vu", "agreement"],
  [{f: "avons descendu", type: "pc"}, "avons descendus", "agreement"],
  [{f: "se sont effondrées", type: "pc"}, "se sont effondrés", "agreement"],
  [{f: "nous sommes impliqués", type: "pc", a: ["nous sommes impliquées"]}, "nous sommes impliquées", "ok"],
  // short answers
  [{f: "où", type: "x"}, "ou", "accent"],
  [{f: "emmènerons", type: "x"}, "emmenerons", "accent"],
  [{f: "viendront", type: "x"}, "viendrons", "close"]
];

let fail = 0;
for(const [item, input, want] of cases){
  const got = grade(input, prepare(item)).v;
  if(got !== want){ fail++; console.log(`FAIL  ${input.padEnd(24)} expected ${want}, got ${got}`); }
}
console.log(fail ? `${fail} of ${cases.length} failed` : `all ${cases.length} probes pass`);
process.exitCode = fail ? 1 : 0;
