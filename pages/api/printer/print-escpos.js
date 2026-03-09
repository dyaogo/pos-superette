import { runPS1 } from './_wsl-run-ps1';
import { buildWritePrinterPS1 } from './open-drawer';

// ─── Endpoint : envoie un ticket ESC/POS complet via l'imprimante Windows ─────
// Le ticket (octets ESC/POS) est généré côté client par buildESCPOS() et
// transmis sous forme de tableau d'entiers. Le serveur le passe directement
// à l'imprimante Windows via l'API Win32 WritePrinter (type RAW) → pas de
// dialogue, formatage thermique natif, coupe-papier et tiroir inclus.
// Fonctionne depuis WSL (powershell.exe via /mnt/c/Windows/Temp/).
// ─────────────────────────────────────────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { printerName: rawName, bytes } = req.body || {};

  if (!Array.isArray(bytes) || bytes.length === 0) {
    return res.status(400).json({ error: 'bytes[] requis' });
  }
  if (!bytes.every(b => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return res.status(400).json({ error: 'bytes[] doit contenir uniquement des entiers 0-255' });
  }

  const printerName = (rawName || 'POS58').replace(/[^a-zA-Z0-9 _\-().]/g, '');
  const psContent   = buildWritePrinterPS1(printerName, bytes, 'Receipt');

  try {
    const result = runPS1(psContent, 'receipt_');
    return res.json({ ok: true, result: result.trim() });
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.error('[print-escpos]', msg);
    return res.status(500).json({ ok: false, error: msg });
  }
}
