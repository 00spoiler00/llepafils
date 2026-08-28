// Regles pròpies del llepafils: IA-ismes i calcs que LanguageTool no detecta.
// Validades contra el corpus (corpus/fragments.json): cada regla existeix perquè
// LT la deixa escapar. Precisió abans que exhaustivitat: una regla dubtosa no entra.
//
// Nota: no fem servir \b perquè en JavaScript només entén ASCII i falla amb
// accents ("És", "evolució"). B/E són límits de paraula Unicode.

const B = '(?<![\\p{L}\\p{N}_])'; // inici de paraula
const E = '(?![\\p{L}\\p{N}_])'; // final de paraula

function r(pattern) {
  return new RegExp(pattern, 'giu');
}

export const IA_RULES = [
  {
    id: 'LLEPAFILS_FER_SENTIT',
    categoria: 'calc-ia',
    regex: r(`${B}(?:fa|fan|feia|feien|farà|faran|faria|farien|fes|faci|facin|fer|fet)\\s+sentit${E}`),
    missatge: 'Calc de l\'anglès "to make sense". En català les coses no "fan sentit": en tenen.',
    suggeriments: ['té sentit', 'té lògica'],
  },
  {
    id: 'LLEPAFILS_GUIO_LLARG',
    categoria: 'estil-ia',
    regex: r('[—–]'),
    missatge: 'Incís amb guió llarg, marca típica de text generat per IA. En català l\'incís natural va entre parèntesis, entre comes o en una frase a part. (Si és un guió de diàleg, ignora aquest avís.)',
    suggeriments: [],
  },
  {
    id: 'LLEPAFILS_EN_LINIA_AMB',
    categoria: 'calc-ia',
    regex: r(`${B}en\\s+línia\\s+amb${E}`),
    missatge: 'Calc de l\'anglès "in line with".',
    suggeriments: ["d'acord amb", 'en consonància amb', 'seguint'],
  },
  {
    id: 'LLEPAFILS_DONAT_QUE',
    categoria: 'calc',
    regex: r(`${B}donat\\s+que${E}`),
    missatge: 'Calc del castellà "dado que".',
    suggeriments: ['atès que', 'com que', 'ja que'],
  },
  {
    id: 'LLEPAFILS_AL_RESPECTE',
    categoria: 'castellanisme',
    regex: r(`${B}al\\s+respecte${E}`),
    missatge: 'Castellanisme ("al respecto").',
    suggeriments: ['sobre això', 'en aquest sentit', 'respecte a això'],
  },
  {
    id: 'LLEPAFILS_A_DIA_D_AVUI',
    categoria: 'castellanisme',
    regex: r(`${B}a\\s+dia\\s+d['’]avui${E}`),
    missatge: 'Castellanisme ("a día de hoy").',
    suggeriments: ['avui dia', 'ara com ara', "a hores d'ara"],
  },
  {
    id: 'LLEPAFILS_APLICAR_FEINA',
    categoria: 'calc',
    regex: r(`${B}aplic(?:ar|o|ues|a|uem|ueu|uen|at|aré)\\s+(?:a|per)\\s+(?:l['’]|la\\s+|una\\s+|aquesta\\s+)?(?:oferta|feina|plaça|posició|vacant|beca|convocatòria)${E}`),
    missatge: 'Calc de l\'anglès "to apply for". En català no s\'aplica a una feina.',
    suggeriments: ['presentar-se a', 'sol·licitar', 'optar a'],
  },
  {
    id: 'LLEPAFILS_SUPORTAR_TECH',
    categoria: 'calc',
    regex: r(`${B}suport(?:a|en|ar|at|ada|ats|ades)${E}`),
    missatge: 'Si vol dir que admet o és compatible (anglès "to support"), en català és «admet», «és compatible amb» o «funciona amb». «Suportar» és aguantar un pes o tolerar algú. (Si aquí vol dir aguantar o tolerar, ignora aquest avís.)',
    suggeriments: ['admet', 'és compatible amb', 'funciona amb'],
  },
  {
    id: 'LLEPAFILS_LLIBRERIA_TECH',
    categoria: 'calc',
    regex: r(`${B}llibrer(?:ia|ies)${E}`),
    missatge: 'En programari, "library" és «biblioteca». Una llibreria és una botiga de llibres. (Si parles de la botiga, ignora aquest avís.)',
    suggeriments: ['biblioteca'],
  },
  {
    id: 'LLEPAFILS_EMOCIONAT_ANUNCIAR',
    categoria: 'calc-ia',
    regex: r(`${B}emociona(?:t|ts|da|des)\\s+(?:de\\s+|d['’]\\s*|per\\s+)(?:anunciar|presentar|compartir|comunicar)${E}`),
    missatge: 'Calc de l\'anglès "excited to announce", fórmula típica de text d\'IA.',
    suggeriments: ['Ens fa molta il·lusió anunciar', 'Estem molt contents de presentar'],
  },
  {
    id: 'LLEPAFILS_JUGAR_PAPER',
    categoria: 'calc',
    regex: r(`${B}jug(?:a|uen|ar|at|ava|aven|arà|aran|aria|arien)\\s+un\\s+paper${E}`),
    missatge: 'Calc de l\'anglès "to play a role". En català els papers es tenen o s\'exerceixen, no es juguen.',
    suggeriments: ['té un paper', 'exerceix un paper', 'fa un paper'],
  },
  {
    id: 'LLEPAFILS_MULETILLA_DESTACAR',
    categoria: 'muletilla-ia',
    regex: r(`${B}(?:és|es)\\s+important\\s+(?:destacar|assenyalar|remarcar|esmentar|mencionar|recordar|tenir\\s+en\\s+compte)\\s+que${E}|${B}cal\\s+(?:destacar|assenyalar|remarcar|esmentar)\\s+que${E}`),
    missatge: 'Crossa típica de text d\'IA. Gairebé sempre es pot suprimir i dir la cosa directament.',
    suggeriments: [],
  },
  {
    id: 'LLEPAFILS_CLIXE_MON_DIGITAL',
    categoria: 'clixe-ia',
    regex: r(`${B}en\\s+(?:un\\s+món|l['’]era|l['’]època|el\\s+món)\\s+(?:cada\\s+vegada\\s+més\\s+|cada\\s+cop\\s+més\\s+)?(?:digital|globalitzat|connectat|canviant|competitiu|actual)${E}`),
    missatge: 'Clixé d\'obertura típic de text d\'IA. Comença pel que vols dir.',
    suggeriments: [],
  },
  {
    id: 'LLEPAFILS_CONSTANT_EVOLUCIO',
    categoria: 'clixe-ia',
    regex: r(`${B}en\\s+constant\\s+(?:evolució|canvi|creixement|transformació)${E}`),
    missatge: 'Clixé típic de text d\'IA.',
    suggeriments: [],
  },
];

// Termes tècnics habituals que LanguageTool marca com a desconeguts però que
// són acceptables en context de desenvolupament. El paràmetre `ignora` de
// l'API hi afegeix termes per petició.
export const WHITELIST_PER_DEFECTE = new Set([
  'commit', 'commits', 'pull', 'push', 'request', 'requests', 'merge', 'rebase',
  'frontend', 'backend', 'fullstack', 'framework', 'frameworks', 'deploy',
  'branch', 'branches', 'repo', 'repos', 'token', 'tokens', 'login', 'logout',
  'online', 'offline', 'software', 'hardware', 'plugin', 'plugins', 'endpoint',
  'endpoints', 'middleware', 'runtime', 'feedback', 'sprint', 'sprints',
  'backlog', 'bug', 'bugs', 'hotfix', 'rollback', 'timeout', 'cache', 'proxy',
  'streaming', 'chat', 'bot', 'bots', 'dashboard', 'wiki', 'markdown', 'json',
  'yaml', 'html', 'css', 'url', 'urls', 'api', 'apis', 'sdk', 'cli', 'ide',
]);

export function aplicaReglesIA(text) {
  const errors = [];
  for (const regla of IA_RULES) {
    regla.regex.lastIndex = 0;
    let m;
    while ((m = regla.regex.exec(text)) !== null) {
      errors.push({
        offset: m.index,
        longitud: m[0].length,
        fragment: m[0],
        missatge: regla.missatge,
        suggeriments: regla.suggeriments,
        regla: regla.id,
        categoria: regla.categoria,
        font: 'llepafils',
      });
      if (m.index === regla.regex.lastIndex) regla.regex.lastIndex++;
    }
  }
  return errors;
}
