// Nucli del llepafils: combina LanguageTool (normativa) amb les regles pròpies
// (IA-ismes) i aplica la llista d'exclusions per evitar falsos positius sobre
// noms propis i termes tècnics.

import { aplicaReglesIA, WHITELIST_PER_DEFECTE } from './ia-rules.js';

// 127.0.0.1 i no localhost: el fetch de Node prova primer ::1 i LT només escolta IPv4.
const LT_URL = process.env.LT_URL || 'http://127.0.0.1:8010';
export const MAX_TEXT = 20000;

// Regles de LanguageTool que marquen paraules desconegudes (ortografia).
const REGLES_ORTOGRAFIA = new Set(['MORFOLOGIK_RULE_CA_ES']);

function esNomPropiProbable(text, offset, fragment) {
  // Paraula amb majúscula inicial que no comença frase: probablement un nom propi.
  if (!/^[A-ZÀ-Ú]/.test(fragment)) return false;
  if (offset === 0) return false;
  const abans = text.slice(0, offset).replace(/\s+$/, '');
  return !/[.!?…:«"']$/.test(abans) && abans.length > 0;
}

async function consultaLT(text) {
  const res = await fetch(`${LT_URL}/v2/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ language: 'ca-ES', text }),
  });
  if (!res.ok) {
    throw new Error(`LanguageTool ha respost ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.matches.map((m) => ({
    offset: m.offset,
    longitud: m.length,
    fragment: text.slice(m.offset, m.offset + m.length),
    missatge: m.message,
    suggeriments: m.replacements.slice(0, 5).map((r) => r.value),
    regla: m.rule.id,
    categoria: m.rule.category?.name || m.rule.category?.id || 'general',
    font: 'languagetool',
  }));
}

/**
 * Revisa un text en català.
 * @param {string} text
 * @param {string[]} [ignora] Paraules o identificadors de regla a ignorar.
 * @returns {Promise<{veredicte: string, errors: object[], estadistiques: object}>}
 */
export async function revisa(text, ignora = []) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Cal un camp "text" amb contingut.');
  }
  if (text.length > MAX_TEXT) {
    throw new Error(`El text supera el límit de ${MAX_TEXT} caràcters. Revisa'l per parts.`);
  }

  const ignoraSet = new Set(ignora.map((s) => String(s).toLowerCase()));

  const [ltErrors, iaErrors] = await Promise.all([
    consultaLT(text),
    Promise.resolve(aplicaReglesIA(text)),
  ]);

  const errors = [...ltErrors, ...iaErrors]
    .filter((e) => {
      const frag = e.fragment.toLowerCase();
      if (ignoraSet.has(frag) || ignoraSet.has(e.regla.toLowerCase())) return false;
      if (REGLES_ORTOGRAFIA.has(e.regla) && esNomPropiProbable(text, e.offset, e.fragment)) {
        return false;
      }
      // Termes tècnics de la whitelist, marcats per la regla que sigui.
      if (WHITELIST_PER_DEFECTE.has(frag)) return false;
      return true;
    })
    .sort((a, b) => a.offset - b.offset);

  return {
    veredicte: errors.length === 0 ? 'net' : 'errors',
    errors,
    estadistiques: {
      caracters: text.length,
      total: errors.length,
      normativa: errors.filter((e) => e.font === 'languagetool').length,
      iaismes: errors.filter((e) => e.font === 'llepafils').length,
    },
  };
}
