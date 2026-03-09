/**
 * lib/customerDisplay.js
 * Afficheur de prix client — 7 segments LED (HX-K60)
 *
 * C'est un afficheur 7 segments numérique — il ne peut afficher QUE des
 * chiffres (0-9), pas de texte. On envoie uniquement le montant en ASCII.
 *
 * Format envoyé : chiffres du montant, alignés à droite sur 8 positions.
 * Ex. : "    1500" pour 1 500 FCFA
 *       "   15000" pour 15 000 FCFA
 *       "       0" pour 0
 */

let _displayPort = null;

const DISPLAY_DIGITS = 8;   // Nombre de positions sur l'afficheur
const DISPLAY_BAUD   = 9600;
const STORAGE_KEY    = 'customer_display_port';

// ─── Persistance du port (localStorage) ──────────────────────────────────────

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

  // COM2 sur HX-K60 → popup à la première utilisation
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

  // Formater : entier, aligné à droite sur DISPLAY_DIGITS positions
  const digits = Math.round(Math.max(0, Number(amount) || 0)).toString();
  const padded  = digits.length >= DISPLAY_DIGITS
    ? digits.substring(digits.length - DISPLAY_DIGITS) // tronquer si trop long
    : digits.padStart(DISPLAY_DIGITS, ' ');

  const bytes = Uint8Array.from(padded, c => c.charCodeAt(0));

  const writer = port.writable.getWriter();
  try {
    await writer.write(bytes);
  } finally {
    writer.releaseLock();
  }
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

// ─── API publique ─────────────────────────────────────────────────────────────

/** Veille : affiche 0 */
export async function displayIdle(storeName) {
  await sendAmount(0);
}

/** Prix du dernier article scanné */
export async function displayItem(productName, price, currency) {
  await sendAmount(price);
}

/** Total du panier */
export async function displayTotal(itemCount, total, currency) {
  await sendAmount(total);
}

/** Montant encaissé */
export async function displayThankYou(total, currency) {
  await sendAmount(total);
}

/** Monnaie à rendre */
export async function displayChange(change, currency) {
  await sendAmount(change);
}
