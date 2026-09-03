// El llepafils: servidor MCP (streamable HTTP) + API REST + landing.
// L'MCP i l'API comparteixen el mateix nucli (checker.js).

import { webcrypto } from 'node:crypto';
// Node 18 (el de la VM) no exposa crypto com a global i l'SDK d'MCP el necessita.
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import express from 'express';
import rateLimit from 'express-rate-limit';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { revisa, MAX_TEXT } from './checker.js';

const PORT = process.env.PORT || 3737;
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', 1); // darrere el reverse proxy
app.use(express.json({ limit: '64kb' }));

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Massa peticions. El llepafils també necessita respirar: torna-ho a provar d\'aquí a un minut.' },
});
app.use('/mcp', limiter);
app.use('/api', limiter);

// ---------- MCP ----------

const INSTRUCCIONS = `El llepafils és un validador de català pensat per a text generat per IA.
Combina LanguageTool (normativa: ortografia, gramàtica, barbarismes) amb regles pròpies
contra IA-ismes (calcs de l'anglès, clixés, crosses). Crida l'eina "revisa" amb el text,
corregeix els errors amb criteri i torna-la a cridar fins que el veredicte sigui "net".`;

function creaServidorMcp() {
  const server = new McpServer({ name: 'llepafils', version: '0.1.0' }, { instructions: INSTRUCCIONS });

  server.registerTool(
    'revisa',
    {
      title: 'Revisa un text en català',
      description:
        'Valida un text en català: normativa (LanguageTool) + IA-ismes (regles pròpies del llepafils). ' +
        'Retorna un veredicte ("net" o "errors") i la llista d\'errors amb posició, missatge i suggeriments. ' +
        'Corregeix i torna a cridar fins a obtenir "net". Fes servir "ignora" per a noms propis, ' +
        'termes tècnics justificats o identificadors de regla que no apliquin (p. ex. guions de diàleg).',
      // Només llegeix: així els clients (ChatGPT, Claude) no demanen confirmació a cada crida
      // i els plans que només permeten eines de lectura la deixen passar.
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        text: z.string().max(MAX_TEXT).describe('El text en català a revisar.'),
        ignora: z
          .array(z.string())
          .optional()
          .describe('Paraules exactes o IDs de regla a ignorar (noms propis, termes tècnics justificats).'),
      },
    },
    async ({ text, ignora }) => {
      try {
        const resultat = await revisa(text, ignora ?? []);
        return { content: [{ type: 'text', text: JSON.stringify(resultat, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error del llepafils: ${err.message}` }] };
      }
    }
  );

  return server;
}

app.post('/mcp', async (req, res) => {
  // Mode sense estat: un transport nou per petició.
  try {
    const server = creaServidorMcp();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('Error MCP:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Error intern del servidor' },
        id: null,
      });
    }
  }
});

app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Servidor sense estat: només s\'accepta POST.' },
    id: null,
  });
});
app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Servidor sense estat: només s\'accepta POST.' },
    id: null,
  });
});

// ---------- API REST ----------

app.post('/api/check', async (req, res) => {
  try {
    const { text, ignora } = req.body ?? {};
    const resultat = await revisa(text, Array.isArray(ignora) ? ignora : []);
    res.json(resultat);
  } catch (err) {
    const esClient = /camp "text"|límit de/.test(err.message);
    res.status(esClient ? 400 : 502).json({ error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const r = await revisa('Frase de prova.');
    res.json({ estat: 'viu', languagetool: 'connectat', veredicte: r.veredicte });
  } catch {
    res.status(503).json({ estat: 'coix', languagetool: 'no respon' });
  }
});

// ---------- Landing ----------

app.use(express.static(join(__dirname, '..', 'public')));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`El llepafils escolta a http://127.0.0.1:${PORT} (LT: ${process.env.LT_URL || 'http://localhost:8010'})`);
});
