# llepafils

**Validador de català per a text generat per IA.** Un *llepafils* és algú insuportablement primmirat: exactament el que necessites vigilant el català que escriuen els models.

Combina dues capes deterministes i una de criteri:

1. **[LanguageTool](https://languagetool.org)** (servit en local): ortografia, gramàtica, barbarismes, apostrofació, concordances. El conjunt de regles de català més complet que existeix.
2. **Regles pròpies anti-IA-ismes**: el que cap corrector marca i tot text d'IA porta. «Fa sentit», «en línia amb», incisos amb guió llarg, «és important destacar que», clixés d'era digital. Validades contra corpus.
3. **La skill del plugin**: fa que el model corregeixi amb context, vigili els pronoms febles (`en`/`hi`) i revalidi fins que el veredicte és `net`.

Servei públic a **https://llepafils.latrup.net** (gratuït, sense registre, 60 peticions/minut).

## Instal·lació

### Plugin de Claude Code (recomanat)

```
/plugin marketplace add 00spoiler00/llepafils
/plugin install llepafils@llepafils
```

Inclou l'MCP i la skill que valida automàticament els lliurables en català (correus, documents, README, missatges de commit, textos d'UI).

### Només l'MCP (qualsevol client MCP)

```bash
claude mcp add --transport http llepafils https://llepafils.latrup.net/mcp
```

### API REST

```bash
curl -s https://llepafils.latrup.net/api/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Això no fa sentit.", "ignora": ["NomPropi"]}'
```

Resposta:

```json
{
  "veredicte": "errors",
  "errors": [
    {
      "offset": 8, "longitud": 9, "fragment": "fa sentit",
      "missatge": "Calc de l'anglès \"to make sense\"...",
      "suggeriments": ["té sentit", "té lògica"],
      "regla": "LLEPAFILS_FER_SENTIT", "categoria": "calc-ia", "font": "llepafils"
    }
  ],
  "estadistiques": { "caracters": 19, "total": 1, "normativa": 0, "iaismes": 1 }
}
```

Límits: 20.000 caràcters per petició, 60 peticions per minut i IP.

## Estructura del repositori

```
server/          Servidor Node: MCP (streamable HTTP a /mcp), API REST (/api/check) i landing
plugins/         Plugin de Claude Code (skill + configuració MCP)
corpus/          Corpus d'avaluació i script de mesura de cobertura
```

## Corpus d'avaluació

Les regles no són opinions: cada regla pròpia existeix perquè el corpus demostra que LanguageTool la deixa escapar. Resultat actual sobre 35 fragments amb error conegut i 6 fragments nets:

| Motor | Detectats | Falsos positius |
|---|---|---|
| LanguageTool sol | 19/35 | 5 |
| llepafils (LT + regles pròpies + whitelist) | 34/35 | 0 |

L'únic que escapa (omissió de pronoms febles: «Tinc tres» → «En tinc tres») no és detectable amb regles i queda cobert per la capa de criteri de la skill.

Per reproduir-ho:

```bash
node corpus/run-eval.mjs                                            # contra LT pur
LLEPAFILS_URL=https://llepafils.latrup.net/api/check node corpus/run-eval.mjs   # contra el servei
```

## Desenvolupament local

Cal un LanguageTool servint a `localhost:8010`:

```bash
java -Xmx512m -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8010
```

I el servidor:

```bash
cd server && npm install && npm run dev   # http://localhost:3737
```

## Desplegament

El servei públic corre en una VM pròpia: LanguageTool i el servidor Node com a dos processos gestionats amb PM2, darrere un reverse proxy amb TLS. La configuració concreta del desplegament (rutes, ports interns) no forma part del repo.

## Llicència

MIT. LanguageTool és LGPL-2.1 i s'executa com a servei independent.
