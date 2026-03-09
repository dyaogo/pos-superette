/**
 * Agent local d'impression POS — printer-agent/index.js
 *
 * Tourne sur le PC de caisse Windows.
 * Écoute sur http://127.0.0.1:6543 (localhost uniquement — non accessible
 * depuis le réseau extérieur).
 *
 * Le navigateur (sur le même PC) appelle directement cet agent pour imprimer
 * et ouvrir le tiroir, même si le serveur Next.js est distant (Linux/cloud).
 *
 * Routes :
 *   GET  /status          → { ok, platform, version }
 *   POST /print           → { printerName?, bytes[] }  → ticket ESC/POS
 *   POST /drawer          → { printerName? }           → ouverture tiroir
 *
 * Usage :
 *   node index.js
 *   node index.js --port 6543 --printer "POS58"
 */

'use strict';

const http       = require('http');
const { execSync }              = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const { join }   = require('path');
const { tmpdir } = require('os');

// ── Configuration ────────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const PORT        = parseInt(args[args.indexOf('--port')   + 1] || '6543', 10);
const DEF_PRINTER = args[args.indexOf('--printer') + 1]  || 'POS58';
const VERSION     = '1.0.0';

// ── Génération du script PowerShell WritePrinter ──────────────────────────────
function buildPS1(printerName, bytes, docName) {
  return `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Ansi)]
    public static extern bool OpenPrinterA(string name, out IntPtr handle, IntPtr pd);
    [DllImport("winspool.drv")]
    public static extern bool ClosePrinter(IntPtr handle);
    [DllImport("winspool.drv", CharSet=CharSet.Ansi)]
    public static extern int StartDocPrinterA(IntPtr handle, int level, ref DOCINFOA di);
    [DllImport("winspool.drv")]
    public static extern bool EndDocPrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool StartPagePrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool EndPagePrinter(IntPtr handle);
    [DllImport("winspool.drv")]
    public static extern bool WritePrinter(IntPtr handle, IntPtr pBytes, int count, out int written);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public struct DOCINFOA {
        public int cbSize;
        public string pDocName;
        public string pOutputFile;
        public string pDataType;
    }
}
'@
$h = [IntPtr]::Zero
$ok = [RawPrint]::OpenPrinterA("${printerName}", [ref]$h, [IntPtr]::Zero)
if (-not $ok) { Write-Error "Impossible d'ouvrir : ${printerName}"; exit 1 }
$doc = New-Object RawPrint+DOCINFOA
$doc.cbSize    = [System.Runtime.InteropServices.Marshal]::SizeOf($doc)
$doc.pDocName  = "${docName}"
$doc.pDataType = "RAW"
[RawPrint]::StartDocPrinterA($h, 1, [ref]$doc) | Out-Null
[RawPrint]::StartPagePrinter($h) | Out-Null
$bytes = [byte[]](${bytes.join(',')})
$ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
$w = 0
[RawPrint]::WritePrinter($h, $ptr, $bytes.Length, [ref]$w) | Out-Null
[System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
[RawPrint]::EndPagePrinter($h)  | Out-Null
[RawPrint]::EndDocPrinter($h)   | Out-Null
[RawPrint]::ClosePrinter($h)    | Out-Null
Write-Output "sent:$w"
`;
}

function runPS1(psContent, prefix) {
  const file = join(tmpdir(), `${prefix}_${Date.now()}.ps1`);
  writeFileSync(file, psContent, 'utf8');
  try {
    return execSync(
      `powershell.exe -NonInteractive -ExecutionPolicy Bypass -File "${file}"`,
      { timeout: 15000, encoding: 'utf8' }
    ).trim();
  } finally {
    try { unlinkSync(file); } catch { /* ignore */ }
  }
}

// ── Helpers HTTP ──────────────────────────────────────────────────────────────
function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin':  '*',   // localhost uniquement par bind
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ── Serveur ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') { json(res, 204, {}); return; }

  // GET /status
  if (req.method === 'GET' && req.url === '/status') {
    json(res, 200, { ok: true, platform: process.platform, version: VERSION, printer: DEF_PRINTER });
    return;
  }

  // POST /drawer
  if (req.method === 'POST' && req.url === '/drawer') {
    try {
      const body        = await readBody(req);
      const printerName = (body.printerName || DEF_PRINTER).replace(/[^a-zA-Z0-9 _\-().]/g, '');
      const drawerBytes = [27, 112, 0, 25, 250, 27, 112, 1, 25, 250]; // pin2 + pin5
      const result      = runPS1(buildPS1(printerName, drawerBytes, 'CashDrawer'), 'drawer');
      console.log(`[tiroir] ${printerName} → ${result}`);
      json(res, 200, { ok: true, result });
    } catch (err) {
      console.error('[tiroir]', err.message);
      json(res, 500, { ok: false, error: err.stderr?.toString() || err.message });
    }
    return;
  }

  // POST /print
  if (req.method === 'POST' && req.url === '/print') {
    try {
      const body        = await readBody(req);
      const printerName = (body.printerName || DEF_PRINTER).replace(/[^a-zA-Z0-9 _\-().]/g, '');
      const bytes       = body.bytes;
      if (!Array.isArray(bytes) || bytes.length === 0)
        return json(res, 400, { ok: false, error: 'bytes[] requis' });
      if (!bytes.every(b => Number.isInteger(b) && b >= 0 && b <= 255))
        return json(res, 400, { ok: false, error: 'bytes[] : valeurs 0-255 uniquement' });
      const result = runPS1(buildPS1(printerName, bytes, 'Receipt'), 'receipt');
      console.log(`[print]  ${printerName} → ${result}`);
      json(res, 200, { ok: true, result });
    } catch (err) {
      console.error('[print]', err.message);
      json(res, 500, { ok: false, error: err.stderr?.toString() || err.message });
    }
    return;
  }

  json(res, 404, { error: 'Route inconnue' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  Agent imprimante POS  v${VERSION}                   ║`);
  console.log(`║  http://127.0.0.1:${PORT}  (localhost uniquement)  ║`);
  console.log(`║  Imprimante par défaut : ${DEF_PRINTER.padEnd(24)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('En attente de commandes... (Ctrl+C pour arrêter)\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Le port ${PORT} est déjà utilisé.`);
    console.error('   Un autre agent tourne peut-être déjà. Vérifiez le Gestionnaire de tâches.');
  } else {
    console.error('Erreur serveur:', err.message);
  }
  process.exit(1);
});
