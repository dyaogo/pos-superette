/**
 * lib/customerDisplay.js
 * Afficheur client VFD — communication via Web Serial API (COM2 sur HX-K60)
 *
 * Protocole : texte ASCII pur (pas d'encodage CP850).
 * L'afficheur intégré a sa propre table de caractères — on envoie uniquement
 * des octets < 128 pour éviter les caractères illisibles.
 *
 * Format : 2 lignes × 20 colonnes (VFD standard).
 */

// ─── Port persistant entre les ventes ────────────────────────────────────────
let _displayPort = null;

const DISPLAY_COLS = 20;   // Largeur standard VFD
const DISPLAY_BAUD = 9600; // Vitesse standard VFD

// Clé localStorage pour mémoriser le port choisi
const STORAGE_KEY = 'customer_display_port';

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

// ─── Remplacement des accents français → ASCII ───────────────────────────────
// L'afficheur a sa propre table → on n'envoie que des octets < 128

function toAscii(str) {
  return String(str)
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÀÂÄ]/g, 'A')
    .replace(/[ÙÛÜ]/g, 'U')
    .replace(/[ÔÖ]/g, 'O')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[^\ -~]/g, '?'); // tout autre caractère non-ASCII → '?'
}

function toBytes(str) {
  const ascii = toAscii(str);
  const out = [];
  for (const ch of ascii) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code < 128) out.push(code);
    else out.push(32); // espace pour les caractères de contrôle
  }
  return out;
}

// ─── Connexion au port de l'afficheur ────────────────────────────────────────

async function ensureDisplayPort() {
  if (typeof window === 'undefined' || !('serial' in navigator)) return null;

  // Port déjà ouvert et fonctionnel ?
  if (_displayPort) {
    try {
      if (_displayPort.writable) return _displayPort;
    } catch {}
    _displayPort = null;
  }

  // Tenter de retrouver le port sauvegardé (USB-Série identifiable par VID/PID)
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

  // Port natif (COM2 sur HX-K60) → popup obligatoire à la première utilisation
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

// ─── Affichage de 2 lignes ────────────────────────────────────────────────────
// Stratégie : 0x0C pour effacer, puis ligne1 (20 car.), CR+LF, ligne2 (20 car.)

function padLine(text, width) {
  const s = String(text || '');
  return s.length >= width ? s.substring(0, width) : s.padEnd(width, ' ');
}
function centerLine(text, width) {
  const s = String(text || '');
  if (s.length >= width) return s.substring(0, width);
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(left) + s + ' '.repeat(width - s.length - left);
}

async function showLines(line1, line2 = '') {
  const bytes = [
    0x0C,                                            // Effacer écran (Form Feed)
    ...toBytes(padLine(line1, DISPLAY_COLS)),         // Ligne 1 — 20 caractères
    0x0D, 0x0A,                                      // CR + LF
    ...toBytes(padLine(line2, DISPLAY_COLS)),         // Ligne 2 — 20 caractères
  ];
  await writeDisplay(bytes);
}

// ─── Sélection / gestion du port ─────────────────────────────────────────────

/**
 * Ouvre la popup Chrome pour choisir (ou rechoisir) le port de l'afficheur.
 * Retourne le nom du port ou null si annulé.
 */
export async function selectDisplayPort() {
  if (typeof window === 'undefined' || !('serial' in navigator)) return null;
  try {
    if (_displayPort) { try { await _displayPort.close(); } catch {} _displayPort = null; }
    clearSavedPort();
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: DISPLAY_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
    savePortInfo(port);
    _displayPort = port;
    const info = port.getInfo ? port.getInfo() : {};
    return info.usbVendorId ? `USB-Serie (VID:${info.usbVendorId?.toString(16)})` : 'Port serie';
  } catch (err) {
    if (err.name === 'NotFoundError') return null;
    throw err;
  }
}

/** Déconnecter l'afficheur */
export function disconnectDisplay() {
  if (_displayPort) { try { _displayPort.close(); } catch {} _displayPort = null; }
  clearSavedPort();
}

/** Vérifie si Web Serial est disponible dans ce navigateur */
export function isDisplayAvailable() {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

// ─── Messages prédéfinis ──────────────────────────────────────────────────────

/** Message d'accueil (panier vide / veille) */
export async function displayIdle(storeName = 'SUPERETTE') {
  await showLines(centerLine(toAscii(storeName), DISPLAY_COLS), centerLine('Bienvenue !', DISPLAY_COLS));
}

/**
 * Affiche le dernier article ajouté au panier.
 * Ligne 1 : nom du produit  |  Ligne 2 : prix aligné à droite
 */
export async function displayItem(productName, price, currency = 'FCFA') {
  const priceStr = `${Number(price).toLocaleString('fr-FR')} ${currency}`;
  const line2 = priceStr.length <= DISPLAY_COLS
    ? priceStr.padStart(DISPLAY_COLS)
    : priceStr.substring(0, DISPLAY_COLS);
  await showLines(padLine(toAscii(productName), DISPLAY_COLS), line2);
}

/**
 * Affiche le total en cours du panier.
 * Ligne 1 : nombre d'articles  |  Ligne 2 : TOTAL aligné à droite
 */
export async function displayTotal(itemCount, total, currency = 'FCFA') {
  const label    = `${itemCount} article${itemCount > 1 ? 's' : ''}`;
  const totalStr = `TOTAL: ${Number(total).toLocaleString('fr-FR')} ${currency}`;
  await showLines(
    padLine(label, DISPLAY_COLS),
    totalStr.length <= DISPLAY_COLS ? totalStr.padStart(DISPLAY_COLS) : totalStr.substring(0, DISPLAY_COLS)
  );
}

/**
 * Message de remerciement après paiement.
 * Ligne 1 : "Merci !"  |  Ligne 2 : montant payé
 */
export async function displayThankYou(total, currency = 'FCFA') {
  const totalStr = `${Number(total).toLocaleString('fr-FR')} ${currency}`;
  await showLines(centerLine('Merci !', DISPLAY_COLS), centerLine(totalStr, DISPLAY_COLS));
}

/**
 * Affiche la monnaie à rendre au client.
 * Ligne 1 : "Monnaie :"  |  Ligne 2 : montant
 */
export async function displayChange(change, currency = 'FCFA') {
  const changeStr = `${Number(change).toLocaleString('fr-FR')} ${currency}`;
  await showLines('Monnaie :'.padEnd(DISPLAY_COLS), centerLine(changeStr, DISPLAY_COLS));
}
