/**
 * lib/customerDisplay.js
 * Afficheur de prix client — communication via Web Serial API (COM2 sur HX-K60)
 *
 * C'est un afficheur de prix simple (pas un écran texte) — il affiche
 * uniquement un montant numérique. On envoie juste le prix en ASCII + CR.
 *
 * Protocole : prix en chiffres + "\r\n"
 * Ex. : "1500\r\n" ou "0\r\n"
 */

// ─── Port persistant entre les ventes ────────────────────────────────────────
let _displayPort = null;

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

// ─── Connexion au port de l'afficheur ────────────────────────────────────────

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

  // Port natif (COM2) → popup à la première utilisation
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
  savePortInfo(port);
  _displayPort = port;
  return port;
}

// ─── Envoi bas niveau ─────────────────────────────────────────────────────────

async function sendPrice(amount) {
  const port = await ensureDisplayPort();
  if (!port) return;

  // Formater le montant : nombre entier sans séparateur de milliers
  const str = Math.round(Number(amount) || 0).toString() + '\r\n';
  const bytes = Uint8Array.from(str, c => c.charCodeAt(0));

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

// ─── API publique : affichage des montants ────────────────────────────────────

/** Veille : affiche 0 */
export async function displayIdle() {
  await sendPrice(0);
}

/** Dernier article ajouté : affiche son prix unitaire */
export async function displayItem(productName, price, currency) {
  await sendPrice(price);
}

/** Total en cours du panier */
export async function displayTotal(itemCount, total, currency) {
  await sendPrice(total);
}

/** Montant final après paiement */
export async function displayThankYou(total, currency) {
  await sendPrice(total);
}

/** Monnaie à rendre */
export async function displayChange(change, currency) {
  await sendPrice(change);
}
