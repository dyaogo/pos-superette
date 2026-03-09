/**
 * lib/customerDisplay.js
 * Afficheur client VFD — communication via Web Serial API (COM2 sur HX-K60)
 *
 * L'afficheur réagit aux commandes VFD standard :
 *   0x0C           = effacer l'écran
 *   texte ASCII    = afficher (20 colonnes par ligne)
 *   0x0D 0x0A      = passer à la ligne suivante
 *
 * IMPORTANT : ASCII pur uniquement (octets 32-127).
 * L'afficheur a sa propre table de caractères — les octets > 127 (CP850)
 * s'affichent en caractères illisibles. Les accents sont remplacés.
 */

// ─── Port persistant entre les ventes ────────────────────────────────────────
let _displayPort = null;

const DISPLAY_COLS = 20;
const DISPLAY_BAUD = 9600;
const STORAGE_KEY  = 'customer_display_port';

function getSavedPortInfo() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function savePortInfo(port) {
  try {
    const info = port.getInfo ? port.getInfo() : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {}
}
function clearSavedPort() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Remplacement accents → ASCII ────────────────────────────────────────────

function toAscii(str) {
  return String(str || '')
    .replace(/[éèêë]/g, 'e').replace(/[ÉÈÊË]/g, 'E')
    .replace(/[àâä]/g, 'a').replace(/[ÀÂÄ]/g, 'A')
    .replace(/[ùûü]/g, 'u').replace(/[ÙÛÜ]/g, 'U')
    .replace(/[ôö]/g,  'o').replace(/[ÔÖ]/g,  'O')
    .replace(/[îï]/g,  'i').replace(/[ÎÏ]/g,  'I')
    .replace(/[çÇ]/g,  'c')
    .replace(/[^\ -~]/g, ' '); // tout autre non-ASCII → espace
}

function toBytes(str) {
  const ascii = toAscii(str);
  const out = [];
  for (const ch of ascii) {
    const code = ch.charCodeAt(0);
    out.push(code >= 32 && code < 128 ? code : 32);
  }
  return out;
}

// ─── Connexion au port ────────────────────────────────────────────────────────

async function ensureDisplayPort() {
  if (typeof window === 'undefined' || !('serial' in navigator)) return null;

  if (_displayPort) {
    try { if (_displayPort.writable) return _displayPort; } catch {}
    _displayPort = null;
  }

  const savedInfo = getSavedPortInfo();
  if (savedInfo && savedInfo.usbVendorId != null) {
    const granted = await navigator.serial.getPorts();
    for (const port of granted) {
      const info = port.getInfo ? port.getInfo() : {};
      if (info.usbVendorId === savedInfo.usbVendorId &&
          info.usbProductId === savedInfo.usbProductId) {
        try {
          await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
        } catch (err) {
          if (!err.message?.toLowerCase().includes('already open')) throw err;
        }
        _displayPort = port;
        return port;
      }
    }
    clearSavedPort();
  }

  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
  savePortInfo(port);
  _displayPort = port;
  return port;
}

// ─── Écriture bas niveau ──────────────────────────────────────────────────────

async function writeDisplay(bytes) {
  const port = await ensureDisplayPort();
  if (!port) return;
  const writer = port.writable.getWriter();
  try {
    await writer.write(new Uint8Array(bytes));
  } finally {
    writer.releaseLock();
  }
}

// ─── Affichage 2 lignes (protocole VFD standard) ─────────────────────────────

function padLine(text, width) {
  const s = toAscii(String(text || ''));
  return s.length >= width ? s.substring(0, width) : s.padEnd(width, ' ');
}
function centerLine(text, width) {
  const s = toAscii(String(text || ''));
  if (s.length >= width) return s.substring(0, width);
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(left) + s + ' '.repeat(width - s.length - left);
}

async function showLines(line1, line2 = '') {
  const bytes = [
    0x0C,                                         // Effacer écran
    ...toBytes(padLine(line1, DISPLAY_COLS)),      // Ligne 1 (20 car.)
    0x0D, 0x0A,                                   // CR + LF
    ...toBytes(padLine(line2, DISPLAY_COLS)),      // Ligne 2 (20 car.)
  ];
  await writeDisplay(bytes);
}

// ─── Sélection / gestion du port ─────────────────────────────────────────────

export async function selectDisplayPort() {
  if (typeof window === 'undefined' || !('serial' in navigator)) return null;
  try {
    if (_displayPort) { try { await _displayPort.close(); } catch {} _displayPort = null; }
    clearSavedPort();
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
    savePortInfo(port);
    _displayPort = port;
    return 'Port serie';
  } catch (err) {
    if (err.name === 'NotFoundError') return null;
    throw err;
  }
}

export function disconnectDisplay() {
  if (_displayPort) { try { _displayPort.close(); } catch {} _displayPort = null; }
  clearSavedPort();
}

export function isDisplayAvailable() {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

// ─── Messages (affichage prix uniquement — ASCII pur) ─────────────────────────

/** Veille */
export async function displayIdle(storeName = 'SUPERETTE') {
  await showLines(
    centerLine(storeName, DISPLAY_COLS),
    centerLine('Bienvenue', DISPLAY_COLS)
  );
}

/** Prix du dernier article scanné */
export async function displayItem(productName, price, currency = 'FCFA') {
  const priceStr = `${Number(price).toLocaleString('fr-FR')} ${currency}`;
  await showLines(
    padLine(productName, DISPLAY_COLS),
    priceStr.length <= DISPLAY_COLS
      ? priceStr.padStart(DISPLAY_COLS)
      : priceStr.substring(0, DISPLAY_COLS)
  );
}

/** Total du panier */
export async function displayTotal(itemCount, total, currency = 'FCFA') {
  const totalStr = `${Number(total).toLocaleString('fr-FR')} ${currency}`;
  await showLines(
    `${itemCount} article${itemCount > 1 ? 's' : ''}`.padEnd(DISPLAY_COLS),
    totalStr.length <= DISPLAY_COLS
      ? totalStr.padStart(DISPLAY_COLS)
      : totalStr.substring(0, DISPLAY_COLS)
  );
}

/** Montant payé — après encaissement */
export async function displayThankYou(total, currency = 'FCFA') {
  const totalStr = `${Number(total).toLocaleString('fr-FR')} ${currency}`;
  await showLines(
    centerLine('Merci !', DISPLAY_COLS),
    centerLine(totalStr, DISPLAY_COLS)
  );
}

/** Monnaie à rendre */
export async function displayChange(change, currency = 'FCFA') {
  const changeStr = `${Number(change).toLocaleString('fr-FR')} ${currency}`;
  await showLines(
    'Monnaie :'.padEnd(DISPLAY_COLS),
    centerLine(changeStr, DISPLAY_COLS)
  );
}
