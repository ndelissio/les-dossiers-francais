/* Answer grading for typed French answers.
   Reference module distilled from the Unité 4 Spelling Drill and Unité 4 Grammar Drill.
   Pure functions, no DOM. The dossiers are single-file offline pages, so inline this
   into the engine at build time instead of loading it as a separate script.

   Usage:
     const it = prepare({f:"la canicule", type:"n"});
     grade("une canicule", it)  // {v:"ok", target:"une canicule"}
     const [you, correct] = diff(norm(input), result.target);
     youRow.innerHTML = marked(you, "x"); correctRow.innerHTML = marked(correct, "m");
*/

const VOWEL = /^[aeiouyàâäéèêëîïôöûüùœh]/i;

/* Comparison form: NFC, straight apostrophes, lowercase, collapsed spaces, no space after an elided l' s' d' j' m' t' qu'. */
function norm(s){
  return (s || "").normalize("NFC").replace(/[’‘`´]/g, "'").toLowerCase()
    .replace(/\s+/g, " ").trim().replace(/\b(l|s|d|j|m|t|qu)' +/g, "$1'");
}

/* Accent-blind form, used only to classify a near miss as an accent slip. */
function fold(s){
  return norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
}

function splitArt(s){
  const m = s.match(/^(les|le|la|une|un|des|l')\s?(.+)$/);
  return m ? {art: m[1], body: m[2]} : null;
}

/* le↔un, la↔une, les↔des, l' by gender. g ("m" | "f" | "mp" | "fp") is needed only for l' nouns. */
function articleForms(form, g){
  const p = splitArt(form); if(!p) return [form];
  const b = p.body, v = VOWEL.test(b);
  let gen = (p.art === "le" || p.art === "un") ? "m"
          : (p.art === "la" || p.art === "une") ? "f"
          : (p.art === "les" || p.art === "des") ? "pl"
          : (g || "m").startsWith("f") ? "f" : "m";
  if(g && g.endsWith("p")) gen = "pl";
  if(gen === "pl") return ["les " + b, "des " + b];
  if(gen === "m")  return [(v ? "l'" : "le ") + b, "un " + b];
  return [(v ? "l'" : "la ") + b, "une " + b];
}

/* Build the accepted set once per item.
   item: { f, a:[alternates], type:"n"|"v"|"adj"|"x"|"pc", g, articleOptional }
   - type "n": every form also accepted with the other article (definite/indefinite, same gender).
   - articleOptional: the bare noun is accepted too (nominalisation drills). Vocab drills leave it off: articles required.
   - type "pc": passé composé answers ("est rentrée"); unlocks the agreement / auxiliary verdicts. */
function prepare(item){
  const forms = [item.f].concat(item.a || []).map(norm);
  const acc = [];
  forms.forEach(s => { acc.push(s); if(item.type === "n") articleForms(s, item.g).forEach(x => acc.push(x)); });
  const bodies = item.type === "n" ? [...new Set(forms.map(s => (splitArt(s) || {body: s}).body))] : [];
  if(item.articleOptional) bodies.forEach(b => acc.push(b));
  const refl = item.type === "v" && /^(s'|se )/.test(norm(item.f)) ? norm(item.f).replace(/^(s'|se )/, "") : null;
  return Object.assign({}, item, {acc: [...new Set(acc)], bodies, refl});
}

function lev(a, b){
  const m = a.length, n = b.length; if(!m) return n; if(!n) return m;
  let prev = Array.from({length: n + 1}, (_, j) => j), cur = new Array(n + 1);
  for(let i = 1; i <= m; i++){
    cur[0] = i;
    for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

const ppBase = w => w.replace(/(es|e|s)$/, "");

/* Verdict ladder, first match wins:
   ok · accent · article · gender · pronoun · agreement · auxiliary · close · wrong
   Everything except ok is a miss (accent counts as ok only when Strict accents is off). */
function grade(input, it){
  const n = norm(input), fd = fold(input);
  if(it.acc.includes(n)) return {v: "ok", target: n};

  const accHit = it.acc.find(a => fold(a) === fd);
  if(accHit) return {v: "accent", target: accHit};

  const withArt = b => it.acc.find(a => a.endsWith(" " + b) || a === "l'" + b) || it.acc[0];
  if(it.type === "n"){
    const bi = it.bodies.findIndex(b => fold(b) === fd);
    if(bi > -1) return {v: "article", target: withArt(it.bodies[bi])};
    const p = splitArt(n);
    if(p){
      const gi = it.bodies.findIndex(b => fold(b) === fold(p.body));
      if(gi > -1) return {v: "gender", target: withArt(it.bodies[gi])};
    }
  }

  if(it.refl && fold(it.refl) === fd) return {v: "pronoun", target: norm(it.f)};

  if(it.type === "pc"){
    const iw = n.split(" ");
    for(const a of it.acc){
      const aw = a.split(" ");
      if(iw.length !== aw.length) continue;
      const last = iw.length - 1;
      if(ppBase(iw[last]) !== ppBase(aw[last])) continue;
      const restSame = iw.slice(0, last).join(" ") === aw.slice(0, last).join(" ");
      return {v: restSame ? "agreement" : "auxiliary", target: a};
    }
  }

  let best = it.acc[0], d = Infinity;
  it.acc.forEach(a => { const k = lev(n, a); if(k < d){ d = k; best = a; } });
  if(lev(fd, fold(best)) <= 2 && fold(best).length >= 5) return {v: "close", target: best};
  return {v: "wrong", target: best};
}

/* Character diff (LCS). Returns [youChars, correctChars], each [{c, bad}]. */
function diff(a, b){
  const m = a.length, n = b.length, L = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for(let i = m - 1; i >= 0; i--) for(let j = n - 1; j >= 0; j--)
    L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ua = [], tb = []; let i = 0, j = 0;
  while(i < m && j < n){
    if(a[i] === b[j]){ ua.push({c: a[i], bad: false}); tb.push({c: b[j], bad: false}); i++; j++; }
    else if(L[i + 1][j] >= L[i][j + 1]){ ua.push({c: a[i], bad: true}); i++; }
    else { tb.push({c: b[j], bad: true}); j++; }
  }
  while(i < m) ua.push({c: a[i++], bad: true});
  while(j < n) tb.push({c: b[j++], bad: true});
  return [ua, tb];
}

/* You row: marked(you, "x") → red strike-through. Correct row: marked(correct, "m") → red underline.
   A bad space renders as "·" so it can be seen. */
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
function marked(arr, cls){
  return arr.map(o => o.bad ? `<span class="${cls}">${esc(o.c === " " ? "·" : o.c)}</span>` : esc(o.c)).join("");
}

/* Verdict copy and tone used by both reference drills. */
const VERDICTS = {
  ok:        {title: "Correct",                          tone: "ok"},
  accent:    {title: "Check the accents",                tone: "near"},
  article:   {title: "Article missing",                  tone: "near"},
  gender:    {title: "Wrong article: check the gender",  tone: "near"},
  pronoun:   {title: "Reflexive pronoun missing",        tone: "near"},
  agreement: {title: "Check the agreement",              tone: "near"},
  auxiliary: {title: "Wrong auxiliary",                  tone: "bad"},
  close:     {title: "Close: check the spelling",        tone: "near"},
  wrong:     {title: "Not quite",                        tone: "bad"},
  skip:      {title: "Here's the answer",                tone: "bad"}
};

if(typeof module !== "undefined") module.exports = {norm, fold, articleForms, prepare, grade, diff, marked, VERDICTS};
