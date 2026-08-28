---
name: llepafils
description: Garanteix un català correcte en qualsevol lliurable escrit en català (correus, documents, README, missatges de commit, textos d'UI, comunicats, articles). Usa-la SEMPRE abans de lliurar text en català destinat a persistir o a sortir cap a algú. Valida amb l'eina MCP del llepafils i corregeix fins que el veredicte és net.
---

# El llepafils

Ets a punt de lliurar text en català. El llepafils és el validador que garanteix que aquest text no porta els errors típics del català generat per IA: barbarismes, calcs de l'anglès, apostrofació incorrecta, pronoms febles mal resolts, clixés i crosses.

## Quan aplica

Text en català destinat a **persistir o sortir**: correus, missatges, documents, README, missatges de commit, textos d'interfície, comunicats, articles, notes de versió. Les respostes de conversa efímeres NO cal validar-les.

## Flux de treball

1. Escriu el text com faries normalment.
2. Crida l'eina `revisa` del servidor MCP `llepafils` amb el text complet.
3. Per cada error retornat, corregeix **amb criteri i context** (tu entens la frase; LanguageTool no sempre). No apliquis suggeriments a cegues: tria el que encaixa amb el to i el sentit.
4. Torna a cridar `revisa` amb el text corregit.
5. Repeteix fins que el veredicte sigui `net`. Si després de 3 iteracions queden només falsos positius justificats, passa'ls al paràmetre `ignora` i dona el text per bo.

## Criteri per a falsos positius

Passa al paràmetre `ignora` (paraula exacta o ID de regla), sense corregir:

- **Noms propis**: persones, empreses, productes, topònims.
- **Termes tècnics consolidats** sense equivalent natural en el context: noms d'ordres (`commit`, `merge`), tecnologies, sigles.
- **Guions de diàleg**: la regla `LLEPAFILS_GUIO_LLARG` marca tots els guions llargs; en diàleg són correctes.
- **Citacions literals d'altri**: mai no es corregeix text citat.
- **`suportar` i `llibreria`** quan tenen el sentit genuí (aguantar/tolerar, botiga de llibres).

Tot el que no encaixi en aquesta llista és un error de debò: corregeix-lo.

## El que LanguageTool no veu (responsabilitat teva)

El validador no cobreix tot el criteri. Abans de lliurar, repassa tu mateix:

- **Pronoms febles `en` i `hi`**: «Tinc tres» → «En tinc tres»; «Anirem a Girona» ... «Hi anirem». La seva omissió és l'error més delator del català artificial.
- **Registre**: no barregis «vós», «tu» i «vostè»; mantén el tractament que demana el context.
- **Incisos**: en català l'incís natural va entre parèntesis o comes, no amb guions llargs.
- **Estructures angleses**: «no només X, sinó també Y» en cadena, gerundis de posterioritat, passives innecessàries. Si una frase sona a anglès traduït, refés-la.

## Contracte de l'eina

`revisa({ text, ignora? })` retorna:

```json
{
  "veredicte": "net | errors",
  "errors": [
    { "offset": 0, "longitud": 8, "fragment": "Tenim que", "missatge": "...", "suggeriments": ["Hem de"], "regla": "TENIR_QUE", "categoria": "...", "font": "languagetool | llepafils" }
  ],
  "estadistiques": { "caracters": 120, "total": 1, "normativa": 1, "iaismes": 0 }
}
```

Límit: 20.000 caràcters per crida. Per a textos més llargs, valida per seccions.
