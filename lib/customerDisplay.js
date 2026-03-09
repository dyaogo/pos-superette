/**
 * lib/customerDisplay.js
 * Afficheur de prix client — 7 segments LED (HX-K60)
 *
 * FORMAT_MODE permet de tester différents protocoles sans modifier le code.
 * Valeurs possibles (à changer dans localStorage "display_format_mode") :
 *   0 = chiffres seuls               "1500"
 *   1 = zéros à gauche               "00001500"
 *   2 = chiffres + CR                "1500\r"
 *   3 = zéros + CR                   "00001500\r"
 *   4 = STX + chiffres + ETX         \x02 "1500" \x03
 *   5 = STX + zéros + ETX            \x02 "00001500" \x03
 */

let _displayPort = null;

const DISPLAY_DIGITS = 8;
const DISPLAY_BAUD   = 9600;
const STORAGE_KEY    = 'customer_display_port';
const FORMAT_KEY     = 'display_format_mode';

function getFormatMode() {
  try { return parseInt(localStorage.getItem(FORMAT_KEY) || '0', 10); } catch { return 0; }
}

// ─── Persistance du port ──────────────────────────────────────────────────────

function getSavedPortInfo() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function savePortInfo(port) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(port.getInfo ? port.getInfo() : {}));
  } catch {}
}
function clearSavedPort() {
  localStorage.removeItem(STORAGE_KEY);
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
    const ports = await navigator.serial.getPorts();
    for (const port of ports) {
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

// ─── Envoi bas niveau ─────────────────────────────────────────────────────────

async function sendRaw(bytes) {
  const port = await ensureDisplayPort();
  if (!port) return;
  const writer = port.writable.getWriter();
  try { await writer.write(new Uint8Array(bytes)); }
  finally { writer.releaseLock(); }
}

// ─── Formatage du montant selon le mode actif ─────────────────────────────────

function buildBytes(amount) {
  const n    = Math.round(Math.max(0, Number(amount) || 0));
  const raw  = n.toString();                                         // "1500"
  const pad0 = raw.padStart(DISPLAY_DIGITS, '0');                   // "00001500"
  const mode = getFormatMode();

  const strToBytes = s => Array.from(s).map(c => c.charCodeAt(0));

  switch (mode) {
    case 0: return strToBytes(raw);                                  // "1500"
    case 1: return strToBytes(pad0);                                 // "00001500"
    case 2: return [...strToBytes(raw),  0x0D];                     // "1500\r"
    case 3: return [...strToBytes(pad0), 0x0D];                     // "00001500\r"
    case 4: return [0x02, ...strToBytes(raw),  0x03];               // STX "1500" ETX
    case 5: return [0x02, ...strToBytes(pad0), 0x03];               // STX "00001500" ETX
    default: return strToBytes(raw);
  }
}

async function sendAmount(amount) {
  await sendRaw(buildBytes(amount));
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

/** Envoyer un montant de test avec un mode spécifique (0-5) */
export async function testDisplayFormat(amount, mode) {
  try { localStorage.setItem(FORMAT_KEY, String(mode)); } catch {}
  await sendAmount(amount);
}

// ─── API publique ─────────────────────────────────────────────────────────────

export async function displayIdle()                          { await sendAmount(0); }
export async function displayItem(name, price, currency)    { await sendAmount(price); }
export async function displayTotal(count, total, currency)  { await sendAmount(total); }
export async function displayThankYou(total, currency)      { await sendAmount(total); }
export async function displayChange(change, currency)       { await sendAmount(change); }
