/**
 * lib/customerDisplay.js
 * Afficheur de prix client — 7 segments LED (HX-K60, COM2)
 *
 * Protocole confirmé par test :
 *   - Baud rate : 2400
 *   - Format    : montant sur 8 chiffres, zéros à gauche + CR
 *   - Exemple   : "00001500\r" pour 1 500 FCFA
 */

let _displayPort = null;

const DISPLAY_BAUD  = 2400;
const DISPLAY_PADS  = 8;     // l'afficheur attend exactement 8 chiffres
const STORAGE_KEY   = 'customer_display_port';

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

  // Retrouver le port précédemment sélectionné
  const savedInfo = getSavedPortInfo();
  if (savedInfo) {
    const ports = await navigator.serial.getPorts();
    for (const port of ports) {
      const info = port.getInfo ? port.getInfo() : {};
      if (savedInfo.usbVendorId
            ? info.usbVendorId === savedInfo.usbVendorId && info.usbProductId === savedInfo.usbProductId
            : ports.length === 1) {
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

  // Première utilisation → popup Chrome pour choisir COM2
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
  savePortInfo(port);
  _displayPort = port;
  return port;
}

// ─── Envoi du montant ─────────────────────────────────────────────────────────

async function sendAmount(amount) {
  const port = await ensureDisplayPort();
  if (!port) return;

  const n      = Math.round(Math.max(0, Number(amount) || 0));
  const padded = n.toString().padStart(DISPLAY_PADS, '0').slice(-DISPLAY_PADS); // "00001500"
  const str    = padded + '\r';
  const bytes  = Uint8Array.from(str, c => c.charCodeAt(0));

  const writer = port.writable.getWriter();
  try { await writer.write(bytes); } finally { writer.releaseLock(); }
}

// ─── API de gestion du port ───────────────────────────────────────────────────

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

// ─── API publique ─────────────────────────────────────────────────────────────

/** Veille : affiche 0 */
export async function displayIdle()                         { await sendAmount(0); }

/** Prix du dernier article ajouté */
export async function displayItem(name, price, currency)    { await sendAmount(price); }

/** Total courant du panier */
export async function displayTotal(count, total, currency)  { await sendAmount(total); }

/** Montant encaissé après paiement */
export async function displayThankYou(total, currency)      { await sendAmount(total); }

/** Monnaie à rendre */
export async function displayChange(change, currency)       { await sendAmount(change); }
