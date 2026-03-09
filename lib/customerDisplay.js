/**
 * lib/customerDisplay.js
 * Afficheur client VFD — communication via Web Serial API (COM3 / COM4)
 *
 * L'afficheur intégré au Haixun HX-K60 est un écran VFD 2 lignes × 20 caractères.
 * Il se connecte via un port COM série (généralement COM3 ou COM4).
 * Protocole : texte brut + commandes ESC simples (standard VFD).
 */

// ─── Port persistant entre les ventes ────────────────────────────────────────
let _displayPort = null;

const DISPLAY_COLS   = 20;   // Largeur standard VFD
const DISPLAY_BAUD   = 9600; // Vitesse standard VFD

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

  // Tenter de retrouver le port sauvegardé (USB-Série identifiable)
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
    clearSavedPort(); // Port sauvegardé introuvable → reset
  }

  // Ports natifs (COM1/COM2/COM3/COM4 sans USB-VID) → popup obligatoire
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

// ─── Encodage CP850 simplifié (français) ─────────────────────────────────────

const CP850 = {
  'é':0x82,'è':0x8A,'ê':0x88,'ë':0x89,'à':0x85,'â':0x83,
  'ù':0x97,'û':0x96,'ô':0x93,'î':0x8C,'ï':0x8B,'ç':0x87,'Ç':0x80,
  'É':0x90,'È':0x8A,'Ê':0x88,'À':0x85,'Ô':0x93,'Î':0x8C,
};
function encode(str) {
  const out = [];
  for (const ch of String(str)) {
    if (CP850[ch] !== undefined) out.push(CP850[ch]);
    else if (ch.charCodeAt(0) < 128) out.push(ch.charCodeAt(0));
    else out.push(63); // '?' pour caractères non mappés
  }
  return out;
}

// ─── Utilitaires texte ────────────────────────────────────────────────────────

function pad(text, width) {
  const s = String(text || '');
  return s.length >= width ? s.substring(0, width) : s.padEnd(width);
}
function center(text, width) {
  const s = String(text || '');
  if (s.length >= width) return s.substring(0, width);
  const left  = Math.floor((width - s.length) / 2);
  const right = width - s.length - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

// ─── Commandes VFD standard ───────────────────────────────────────────────────
// FF  (0x0C) : effacer l'écran et revenir en haut à gauche
// CR  (0x0D) : retour chariot
// LF  (0x0A) : saut de ligne

async function showLines(line1, line2) {
  const bytes = [
    0x0C,                           // Effacer l'écran
    ...encode(pad(line1, DISPLAY_COLS)),
    0x0D, 0x0A,                     // CR+LF
    ...encode(pad(line2 || '', DISPLAY_COLS)),
  ];
  await writeDisplay(bytes);
}

// ─── API publique ──────────────────────────────────────────────────────────────

/**
 * Sélectionner / changer le port de l'afficheur (popup Chrome)
 * Retourne le nom du port choisi ou null si annulé.
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
    return info.usbVendorId ? `USB-Série (VID:${info.usbVendorId?.toString(16)})` : 'Port série';
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

/** Vérifie si Web Serial est disponible */
export function isDisplayAvailable() {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

// ── Messages prédéfinis ────────────────────────────────────────────────────────

/** Message d'accueil (panier vide / veille) */
export async function displayIdle(storeName = 'SUPERETTE') {
  await showLines(center(storeName, DISPLAY_COLS), center('Bienvenue !', DISPLAY_COLS));
}

/** Affiche le dernier article scanné/ajouté */
export async function displayItem(productName, price, currency = 'FCFA') {
  const priceStr = `${Number(price).toLocaleString()} ${currency}`;
  const priceLine = priceStr.length <= DISPLAY_COLS
    ? priceStr.padStart(DISPLAY_COLS) // aligner à droite
    : priceStr.substring(0, DISPLAY_COLS);
  await showLines(pad(productName, DISPLAY_COLS), priceLine);
}

/** Affiche le total courant du panier */
export async function displayTotal(itemCount, total, currency = 'FCFA') {
  const label    = `${itemCount} article${itemCount > 1 ? 's' : ''}`;
  const totalStr = `${Number(total).toLocaleString()} ${currency}`;
  await showLines(pad(label, DISPLAY_COLS), totalStr.padStart(DISPLAY_COLS));
}

/** Affiche le message de remerciement après paiement */
export async function displayThankYou(total, currency = 'FCFA') {
  const totalStr = `${Number(total).toLocaleString()} ${currency}`;
  await showLines(center('Merci !', DISPLAY_COLS), center(totalStr, DISPLAY_COLS));
}

/** Affiche la monnaie à rendre */
export async function displayChange(change, currency = 'FCFA') {
  const changeStr = `${Number(change).toLocaleString()} ${currency}`;
  await showLines(center('Monnaie :', DISPLAY_COLS), center(changeStr, DISPLAY_COLS));
}
