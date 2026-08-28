#!/usr/bin/env node
// Avalua la cobertura de LanguageTool (i opcionalment del llepafils sencer)
// sobre el corpus de fragments amb errors coneguts.
//
// Ús:
//   node corpus/run-eval.mjs                     # contra LT pur (LT_URL, per defecte localhost:8010)
//   LLEPAFILS_URL=... node corpus/run-eval.mjs   # contra l'API del llepafils (LT + regles pròpies)

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LT_URL = process.env.LT_URL || 'http://localhost:8010/v2/check';
const LLEPAFILS_URL = process.env.LLEPAFILS_URL || null;

const corpus = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fragments.json'), 'utf8')
);

async function checkLT(text) {
  const res = await fetch(LT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ language: 'ca-ES', text }),
  });
  if (!res.ok) throw new Error(`LT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.matches.map((m) => ({
    fragment: text.slice(m.offset, m.offset + m.length),
    offset: m.offset,
    length: m.length,
    regla: m.rule.id,
    missatge: m.message,
    suggeriments: m.replacements.slice(0, 3).map((r) => r.value),
  }));
}

async function checkLlepafils(text) {
  const res = await fetch(LLEPAFILS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`llepafils ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.errors.map((e) => ({
    fragment: e.fragment,
    offset: e.offset,
    length: e.longitud,
    regla: e.regla,
    missatge: e.missatge,
    suggeriments: e.suggeriments?.slice(0, 3) ?? [],
  }));
}

const check = LLEPAFILS_URL ? checkLlepafils : checkLT;
console.log(`Motor: ${LLEPAFILS_URL || LT_URL}\n`);

let detectats = 0;
let noDetectats = 0;
let falsosPositius = 0;
const gaps = [];

for (const f of corpus.fragments) {
  const matches = await check(f.text);
  if (f.error === null) {
    if (matches.length === 0) {
      console.log(`✓ NET     ${f.id}`);
    } else {
      falsosPositius += matches.length;
      console.log(`✗ FALS+   ${f.id}: ${matches.map((m) => `"${m.fragment}" [${m.regla}]`).join(', ')}`);
    }
    continue;
  }
  const errStart = f.text.indexOf(f.error);
  const errEnd = errStart + f.error.length;
  const hit = matches.find((m) => m.offset < errEnd && m.offset + m.length > errStart);
  if (hit) {
    detectats++;
    console.log(`✓ DETECTA ${f.id} [${hit.regla}] → ${hit.suggeriments.join(' | ') || '(sense suggeriment)'}`);
  } else {
    noDetectats++;
    gaps.push(f);
    const altres = matches.length ? ` (altres: ${matches.map((m) => m.regla).join(', ')})` : '';
    console.log(`✗ ESCAPA  ${f.id} "${f.error}" (${f.tipus})${altres}`);
  }
}

console.log(`\n=== Resum ===`);
console.log(`Detectats: ${detectats} / ${detectats + noDetectats}`);
console.log(`Falsos positius en fragments nets: ${falsosPositius}`);
if (gaps.length) {
  console.log(`\nEscapen (candidats a regla pròpia del llepafils):`);
  for (const g of gaps) console.log(`  - ${g.id} (${g.tipus}): "${g.error}"`);
}
