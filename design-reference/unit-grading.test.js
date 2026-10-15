/* Probe suite for the FG grading module inlined in a unit file (Unité 5 v0.2.0 onward).
   Run: node design-reference/unit-grading.test.js [unit file, default unite-5/index.html]
   Runs the reference grading.test.js cases against the unit's own inlined copy, plus the dossier additions. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const unit = path.resolve(process.argv[2] || path.join(__dirname, "..", "unite-5", "index.html"));
const html = fs.readFileSync(unit, "utf8");
const i = html.indexOf("var FG=(function(){"), j = html.indexOf("\n})();", i);
if (i < 0 || j < 0) { console.log("FG module not found in " + unit); process.exit(1); }
const ctx = {}; vm.createContext(ctx); vm.runInContext(html.slice(i, j + 6), ctx);
const { prepare, grade, diff } = ctx.FG;
const ref = fs.readFileSync(path.join(__dirname, "grading.test.js"), "utf8");
const cases = eval(ref.match(/const cases = (\[[\s\S]*?\n\]);/)[1]);
cases.push(
  [{f: "avait fini", type: "pc"}, "a fini", "wrong"],            // wrong tense of the auxiliary is not "wrong auxiliary"
  [{f: "avait fini", type: "pc"}, "avait finie", "agreement"],
  [{f: "était parti", type: "pc", a: ["était partie"]}, "avait parti", "auxiliary"],
  [{f: "s'est lavée", type: "pc"}, "s'est lavé", "agreement"],
  [{f: "réussiraient", type: "x"}, "reussiraient", "accent"],
  [{f: "auraient", type: "x"}, "avraient", "close"],
  [{f: "anticipé", type: "x", a: ["anticipée"]}, "anticipée", "ok"],
  [{f: "le long desquels", type: "x"}, "le long desquels", "ok"],
  [{f: "l'élève", type: "n", g: "f"}, "une élève", "ok"],
  [{f: "l'élève", type: "n", g: "f"}, "un élève", "gender"]
);
let fail = 0;
for (const [item, input, want] of cases) { const got = grade(input, prepare(item)).v; if (got !== want) { fail++; console.log(`FAIL  ${input.padEnd(24)} expected ${want}, got ${got}`); } }
const c = diff("renom", "le renom")[1].filter(x => x.bad).map(x => x.c).join("");
if (c !== "le ") { fail++; console.log("FAIL  diff marks the missing 'le '"); }
console.log(fail ? `${fail} failed` : `all ${cases.length + 1} probes pass`);
process.exitCode = fail ? 1 : 0;
