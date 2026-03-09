import { Printer, Download, Share2, Zap, X, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import { useRef, useEffect, useCallback, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// PORT SÉRIE PARTAGÉ — imprimante thermique + tiroir-caisse
// L'imprimante sur Haixun HX-K60 apparaît comme un port COM (USB-Série CH340/FTDI)
// Le tiroir est branché sur le RJ11 de l'imprimante → même port, commande ESC/POS
// ═══════════════════════════════════════════════════════════════════════════════
let _printerPort = null;

// Récupère la config sauvegardée (localStorage côté client uniquement)
function getSavedConfig() {
  if (typeof window === 'undefined') return { baudRate: 9600, paperWidth: 58, printMode: 'serial' };
  return {
    baudRate:   parseInt(localStorage.getItem('printer_baud_rate')  || '9600', 10),
    paperWidth: parseInt(localStorage.getItem('printer_paper_width') || '58',   10),
    printMode:  localStorage.getItem('printer_print_mode') || 'serial',
  };
}

// Nom lisible du port à partir de ses infos USB
function portDisplayName(info) {
  if (!info) return null;
  const vendors = { 0x1a86: 'CH340', 0x0403: 'FTDI', 0x067b: 'Prolific', 0x10c4: 'CP210x', 0x0483: 'STM32' };
  const chip = vendors[info.usbVendorId] || `VID:${info.usbVendorId?.toString(16)}`;
  return info.usbVendorId ? `Port USB-Série (${chip})` : 'Port série';
}

// ── Encodage Code Page 850 (Latin-1 / français) ──────────────────────────────
// ESC t 0x02 → active CP850 sur l'imprimante, puis on envoie les octets CP850
const CP850 = {
  'Ç':0x80,'ü':0x81,'é':0x82,'â':0x83,'ä':0x84,'à':0x85,'å':0x86,'ç':0x87,
  'ê':0x88,'ë':0x89,'è':0x8A,'ï':0x8B,'î':0x8C,'Ä':0x8E,'É':0x90,
  'ô':0x93,'ö':0x94,'ò':0x95,'û':0x96,'ù':0x97,'Ö':0x99,'Ü':0x9A,
  'á':0xA0,'í':0xA1,'ó':0xA2,'ú':0xA3,'ñ':0xA4,'Ñ':0xA5,
};

function encodeCP850(str) {
  const bytes = [];
  for (const ch of String(str)) {
    if (CP850[ch] !== undefined) bytes.push(CP850[ch]);
    else if (ch.charCodeAt(0) < 128) bytes.push(ch.charCodeAt(0));
    else bytes.push(63); // '?' pour caractères inconnus
  }
  return bytes;
}

// ── Connexion / gestion du port série ────────────────────────────────────────
// IMPORTANT : on ne réutilise un port accordé que s'il a été EXPLICITEMENT
// choisi par l'utilisateur dans cette app (clé printer_port_info en localStorage).
// Sans ça, Chrome peut silencieusement réutiliser un vieux port (scanner, etc.)
// et write() réussit sans qu'aucun octet n'arrive à l'imprimante.

function getSavedPortInfo() {
  try { return JSON.parse(localStorage.getItem('printer_port_info') || 'null'); } catch { return null; }
}
function savePortInfo(port) {
  try {
    const info = port.getInfo ? port.getInfo() : {};
    localStorage.setItem('printer_port_info', JSON.stringify(info));
    return info;
  } catch { return null; }
}
function clearSavedPort() {
  localStorage.removeItem('printer_port_info');
}

// Paramètres série standard pour imprimantes thermiques (8N1)
const SERIAL_PARAMS = (baudRate) => ({
  baudRate,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
});

async function ensurePortOpen(baudRate) {
  // Port déjà ouvert dans cette session et fonctionnel ?
  if (_printerPort) {
    try {
      if (_printerPort.writable) return _printerPort;
    } catch { /* port fermé entre-temps */ }
    _printerPort = null;
  }

  // Essayer de retrouver le port EXPLICITEMENT sauvegardé
  const savedInfo = getSavedPortInfo();
  if (savedInfo && savedInfo.usbVendorId != null) {
    // Port USB-Série identifiable par vendorId/productId
    const granted = await navigator.serial.getPorts();
    for (const port of granted) {
      const info = port.getInfo ? port.getInfo() : {};
      if (info.usbVendorId === savedInfo.usbVendorId &&
          info.usbProductId === savedInfo.usbProductId) {
        try {
          await port.open(SERIAL_PARAMS(baudRate));
        } catch (err) {
          if (!err.message?.toLowerCase().includes('already open') &&
              !err.message?.toLowerCase().includes('already been opened')) {
            throw err;
          }
        }
        _printerPort = port;
        return port;
      }
    }
    clearSavedPort();
  }
  // Ports COM natifs (COM1/COM2) ou premier choix → popup obligatoire
  // (les ports natifs n'ont pas de usbVendorId, impossible de les distinguer
  // entre eux par getInfo() — l'utilisateur doit sélectionner à chaque session)
  const port = await navigator.serial.requestPort();
  await port.open(SERIAL_PARAMS(baudRate));
  savePortInfo(port);
  _printerPort = port;
  return port;
}

// Sélection forcée (bouton "Changer de port") — toujours popup
async function selectPortExplicitly(baudRate) {
  const port = await navigator.serial.requestPort();
  if (_printerPort && _printerPort !== port) {
    try { await _printerPort.close(); } catch {}
  }
  await port.open(SERIAL_PARAMS(baudRate));
  savePortInfo(port);
  _printerPort = port;
  return port;
}

async function writeToPort(bytes, baudRate) {
  const port = await ensurePortOpen(baudRate);
  const writer = port.writable.getWriter();
  try {
    await writer.write(new Uint8Array(bytes));
  } finally {
    writer.releaseLock();
  }
}

// ── Constantes ESC/POS ────────────────────────────────────────────────────────
const ESC = 0x1B, GS = 0x1D, LF = 0x0A;

const CMD = {
  init:         [ESC, 0x40],           // Réinitialiser l'imprimante
  cp850:        [ESC, 0x74, 0x02],     // Code Page 850 (français)
  boldOn:       [ESC, 0x45, 0x01],
  boldOff:      [ESC, 0x45, 0x00],
  alignLeft:    [ESC, 0x61, 0x00],
  alignCenter:  [ESC, 0x61, 0x01],
  dblSize:      [GS,  0x21, 0x11],     // Double largeur + hauteur
  dblHeight:    [GS,  0x21, 0x01],     // Double hauteur seule
  normalSize:   [GS,  0x21, 0x00],
  feed:         [LF, LF, LF],
  cut:          [GS,  0x56, 0x41, 0x00], // Coupe papier complète
  drawerPin2:   [ESC, 0x70, 0x00, 0x19, 0xFA], // Tiroir pin 2 (standard)
  drawerPin5:   [ESC, 0x70, 0x01, 0x19, 0xFA], // Tiroir pin 5 (alternatif)
};

// ── Génération du ticket ESC/POS ─────────────────────────────────────────────
// cols : 32 pour 58 mm, 42 pour 80 mm
function buildESCPOS(sale, settings, cols = 32, openDrawer = true) {
  const bytes = [];
  const push  = (...b) => bytes.push(...b);
  const flat  = (arr) => push(...arr);
  const text  = (str) => push(...encodeCP850(str));
  const line  = (str = '') => { text(str); push(LF); };

  const divider = () => line('-'.repeat(cols));

  const twoCol = (left, right) => {
    const l = String(left), r = String(right);
    const space = cols - l.length - r.length;
    if (space >= 0) line(l + ' '.repeat(space) + r);
    else            line(l.substring(0, cols - r.length - 1) + ' ' + r);
  };

  // ── En-tête ───────────────────────────────────────────────────────────────
  flat(CMD.init);
  flat(CMD.cp850);
  flat(CMD.alignCenter);
  flat(CMD.boldOn);
  flat(CMD.dblSize);
  line(settings.companyName || 'SUPERETTE');
  flat(CMD.normalSize);
  flat(CMD.boldOff);
  line(`Recu N°: ${sale.receiptNumber || sale.id.substring(0, 8)}`);
  line(new Date(sale.createdAt).toLocaleString('fr-FR'));
  flat(CMD.alignLeft);
  divider();

  // ── Articles ──────────────────────────────────────────────────────────────
  (sale.items || []).forEach(item => {
    const name    = item.productName || item.product?.name || '';
    const qtyStr  = `  ${item.quantity} x ${Number(item.unitPrice).toLocaleString()}`;
    const totStr  = `${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}`;
    flat(CMD.boldOn);
    line(name.substring(0, cols));
    flat(CMD.boldOff);
    twoCol(qtyStr, totStr);
  });
  divider();

  // ── Totaux ────────────────────────────────────────────────────────────────
  const taxRate      = settings.taxRate ?? 0;
  const taxMult      = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal     = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax          = Math.round((sale.total - subtotal) * 100) / 100;

  if (taxRate > 0) {
    twoCol('Sous-total:', `${subtotal.toFixed(0)} ${settings.currency}`);
    twoCol(`TVA ${taxRate}%:`, `${tax.toFixed(0)} ${settings.currency}`);
  }

  flat(CMD.boldOn);
  flat(CMD.dblHeight);
  twoCol('TOTAL:', `${Number(sale.total).toLocaleString()} ${settings.currency}`);
  flat(CMD.normalSize);
  flat(CMD.boldOff);
  push(LF);

  // ── Paiement ──────────────────────────────────────────────────────────────
  const payLabel = { cash: 'Especes', card: 'Carte', mobile: 'Mobile Money' }[sale.paymentMethod]
    || (sale.paymentMethod || 'Especes');
  twoCol('Paiement:', payLabel);

  if (sale.paymentMethod === 'cash' && sale.cashReceived) {
    twoCol('Recu:', `${Number(sale.cashReceived).toLocaleString()} ${settings.currency}`);
    const change = sale.cashReceived - sale.total;
    if (change > 0) twoCol('Monnaie:', `${Number(change).toLocaleString()} ${settings.currency}`);
  }

  // ── Caissier ──────────────────────────────────────────────────────────────
  if (sale.cashier) twoCol('Caissier:', sale.cashier);
  divider();

  // ── Pied de page ──────────────────────────────────────────────────────────
  flat(CMD.alignCenter);
  line(settings.receiptFooter || 'Merci de votre visite !');
  flat(CMD.alignLeft);

  // ── Avance + coupe + tiroir-caisse ────────────────────────────────────────
  flat(CMD.feed);
  flat(CMD.cut);
  if (openDrawer) flat(CMD.drawerPin2); // tiroir branché sur RJ11 de l'imprimante

  return bytes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReceiptPrinter({ sale, onClose, autoPrint = false }) {
  const { currentStore } = useApp();
  const iframeRef = useRef(null);
  const cfg = getSavedConfig();

  const [baudRate,    setBaudRate]    = useState(cfg.baudRate);
  const [paperWidth,  setPaperWidth]  = useState(cfg.paperWidth);
  const [printMode,   setPrintMode]   = useState(cfg.printMode); // 'serial' | 'dialog'
  const [portStatus,  setPortStatus]  = useState('idle');        // 'idle' | 'ok' | 'error'
  const [showSettings, setShowSettings] = useState(false);
  const [statusMsg,   setStatusMsg]   = useState('');
  // Nom du port actuellement configuré (affiché dans l'UI)
  const [portName, setPortName] = useState(() => {
    if (typeof window === 'undefined') return null;
    const info = getSavedPortInfo();
    return info ? portDisplayName(info) : null;
  });

  const settings = {
    companyName:   currentStore?.name       || 'SUPERETTE',
    currency:      currentStore?.currency   || 'FCFA',
    taxRate:       currentStore?.taxRate    ?? 0,
    receiptFooter: currentStore?.receiptFooter || 'Merci de votre visite !',
  };

  const cols = paperWidth >= 80 ? 42 : 32;

  // Sauvegarder la config dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('printer_baud_rate',   baudRate);
    localStorage.setItem('printer_paper_width', paperWidth);
    localStorage.setItem('printer_print_mode',  printMode);
  }, [baudRate, paperWidth, printMode]);

  // ── Sélection explicite du port (toujours popup) ─────────────────────────
  const handleSelectPort = async () => {
    if (!('serial' in navigator)) {
      setPortStatus('error');
      setStatusMsg('Web Serial non disponible — utilisez Chrome ou Edge');
      return;
    }
    try {
      setPortStatus('idle');
      setStatusMsg('Sélection du port…');
      const port = await selectPortExplicitly(baudRate);
      const info = port.getInfo ? port.getInfo() : {};
      const name = portDisplayName(info);
      setPortName(name);
      setPortStatus('ok');
      setStatusMsg(`Port sélectionné : ${name}`);
    } catch (err) {
      if (err.name === 'NotFoundError') { setPortStatus('idle'); setStatusMsg('Sélection annulée'); }
      else { setPortStatus('error'); setStatusMsg(`Erreur: ${err.message}`); _printerPort = null; }
    }
  };

  // ── Impression ESC/POS via port série (mode recommandé pour Haixun HX-K60) ─
  const printViaSerial = useCallback(async (alsoOpenDrawer = true) => {
    if (!('serial' in navigator)) {
      setPortStatus('error');
      setStatusMsg('Web Serial non disponible — utilisez Chrome ou Edge');
      return false;
    }
    try {
      setPortStatus('idle');
      setStatusMsg('Connexion à l\'imprimante…');
      const bytes = buildESCPOS(sale, settings, cols, alsoOpenDrawer);
      await writeToPort(bytes, baudRate);
      // Rafraîchir le nom du port après connexion réussie
      if (_printerPort) {
        const info = _printerPort.getInfo ? _printerPort.getInfo() : {};
        setPortName(portDisplayName(info));
      }
      setPortStatus('ok');
      setStatusMsg('Ticket imprimé ✓');
      return true;
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setPortStatus('idle');
        setStatusMsg('Sélection annulée');
      } else {
        setPortStatus('error');
        setStatusMsg(`Erreur: ${err.message}`);
        console.error('Erreur ESC/POS:', err);
        _printerPort = null;
      }
      return false;
    }
  }, [sale, settings, cols, baudRate]);

  // ── Impression via dialogue du navigateur (fallback) ──────────────────────
  const printViaDialog = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(generateReceiptHTML(sale, settings, paperWidth));
    doc.close();
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setStatusMsg('Dialogue d\'impression ouvert');
      } catch (err) {
        console.error('Erreur impression:', err);
      }
    };
  }, [sale, settings, paperWidth]);

  // ── Bouton "Imprimer" : choisit la méthode selon printMode ───────────────
  const handlePrint = () => {
    if (printMode === 'serial') printViaSerial(false); // coupe sans tiroir
    else printViaDialog();
  };

  // ── Auto-impression après une vente ──────────────────────────────────────
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(async () => {
      if (printMode === 'serial') {
        // Tenter en silencieux (port déjà accordé)
        const ok = await printViaSerial(false);
        if (!ok) printViaDialog(); // fallback si port non configuré
      } else {
        printViaDialog();
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint]);

  // ── Tiroir-caisse seul (commande directe via imprimante) ──────────────────
  const openCashDrawer = async () => {
    if (!('serial' in navigator)) {
      alert(
        'Web Serial API non disponible.\n' +
        'Utilisez Chrome ou Edge sur ce PC.\n' +
        'Le tiroir est branché sur le port RJ11 de l\'imprimante thermique.\n' +
        'Le même port COM doit être sélectionné pour l\'imprimante et le tiroir.'
      );
      return;
    }
    try {
      setPortStatus('idle');
      setStatusMsg('Ouverture du tiroir…');
      // Envoyer drawerPin2 puis drawerPin5 (essai des deux broches)
      await writeToPort([...CMD.drawerPin2], baudRate);
      // Petit délai puis essayer aussi pin 5 (certains tiroirs Haixun)
      await new Promise(r => setTimeout(r, 200));
      await writeToPort([...CMD.drawerPin5], baudRate);
      setPortStatus('ok');
      setStatusMsg('Commande tiroir envoyée ✓');
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setPortStatus('error');
        setStatusMsg(`Erreur tiroir: ${err.message}`);
        console.error('Erreur tiroir-caisse:', err);
        _printerPort = null;
      } else {
        setPortStatus('idle');
        setStatusMsg('Sélection annulée');
      }
    }
  };

  // ── Tester la connexion (imprime une ligne de test) ───────────────────────
  const testConnection = async () => {
    if (!('serial' in navigator)) return;
    try {
      setPortStatus('idle');
      setStatusMsg('Test en cours…');
      const testBytes = [
        ...CMD.init, ...CMD.cp850,
        ...CMD.alignCenter,
        0x07,  // BEL (bip si supporté)
        ...encodeCP850('=== TEST IMPRIMANTE ==='), LF,
        ...encodeCP850(`Baud: ${baudRate}  Papier: ${paperWidth}mm`), LF,
        ...encodeCP850('Connexion etablie !'), LF,
        LF, LF,
      ];
      await writeToPort(testBytes, baudRate);
      if (_printerPort) {
        const info = _printerPort.getInfo ? _printerPort.getInfo() : {};
        const name = portDisplayName(info);
        setPortName(name);
        setPortStatus('ok');
        setStatusMsg(`Connecté : ${name} (${baudRate} baud) — vérifiez que le texte s'est imprimé`);
      }
    } catch (err) {
      if (err.name === 'NotFoundError') { setPortStatus('idle'); setStatusMsg('Sélection annulée'); }
      else { setPortStatus('error'); setStatusMsg(`Échec: ${err.message}`); _printerPort = null; }
    }
  };

  // ── Test texte brut (sans ESC/POS) ───────────────────────────────────────
  // Si rien ne s'imprime avec le test normal, ce test envoie du texte ASCII pur.
  // Si CELA s'imprime → connexion OK, problème de commandes ESC/POS seulement.
  // Si RIEN → mauvais port ou mauvais baud rate.
  const rawTest = async () => {
    if (!('serial' in navigator)) return;
    try {
      setPortStatus('idle');
      setStatusMsg('Envoi texte brut…');
      const raw = [
        0x0A,
        ...encodeCP850('--- TEST BRUT ---'), 0x0A,
        ...encodeCP850(`Port actuel  baud: ${baudRate}`), 0x0A,
        ...encodeCP850('Si ce texte s imprime,'), 0x0A,
        ...encodeCP850('la connexion serie fonctionne.'), 0x0A,
        0x0A, 0x0A, 0x0A,
      ];
      await writeToPort(raw, baudRate);
      setPortStatus('ok');
      setStatusMsg('Texte brut envoyé — quelque chose s\'est-il imprimé ?');
    } catch (err) {
      if (err.name === 'NotFoundError') { setPortStatus('idle'); setStatusMsg('Sélection annulée'); }
      else { setPortStatus('error'); setStatusMsg(`Échec: ${err.message}`); _printerPort = null; }
    }
  };

  // ── Scan automatique du baud rate ──────────────────────────────────────────
  // Essaie 9600 → 19200 → 38400 → 115200 en envoyant du texte brut à chaque fois.
  // L'utilisateur confirme le baud rate qui produit un texte lisible.
  const [scanning, setScanning] = useState(false);
  const scanBaudRate = async () => {
    if (!('serial' in navigator)) return;
    const rates = [9600, 19200, 38400, 115200];
    setScanning(true);
    for (const rate of rates) {
      setStatusMsg(`Test baud rate : ${rate}…`);
      try {
        // Fermer et réouvrir le port avec le nouveau baud rate
        if (_printerPort) { try { await _printerPort.close(); } catch {} _printerPort = null; }
        const port = await ensurePortOpen(rate);
        const testLine = [
          0x0A,
          ...encodeCP850(`BAUD RATE: ${rate}`), 0x0A,
          ...encodeCP850('Lisible? Confirmer ci-dessous'), 0x0A,
          0x0A, 0x0A,
        ];
        const writer = port.writable.getWriter();
        await writer.write(new Uint8Array(testLine));
        writer.releaseLock();
        // Délai pour laisser l'impression se faire
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        if (err.name === 'NotFoundError') break;
        // Erreur → essayer le prochain
      }
    }
    setScanning(false);
    setStatusMsg('Scan terminé — regardez ce qui s\'est imprimé et sélectionnez le bon baud rate ci-dessus');
  };

  // ── Déconnexion du port ───────────────────────────────────────────────────
  const disconnectPort = async () => {
    if (_printerPort) {
      try { await _printerPort.close(); } catch {}
      _printerPort = null;
    }
    clearSavedPort();
    setPortName(null);
    setPortStatus('idle');
    setStatusMsg('Port déconnecté — sélectionner à nouveau avant d\'imprimer');
  };

  // ── Téléchargement HTML du reçu ───────────────────────────────────────────
  const downloadReceipt = () => {
    const html  = generateReceiptHTML(sale, settings, paperWidth);
    const blob  = new Blob([html], { type: 'text/html' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `recu_${sale.receiptNumber || sale.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Partage SMS / WhatsApp ────────────────────────────────────────────────
  const shareReceipt = async () => {
    const text = generateReceiptText(sale, settings);
    if (navigator.share) {
      try { await navigator.share({ title: `Reçu ${sale.receiptNumber || sale.id}`, text }); }
      catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Reçu copié dans le presse-papier');
    }
  };

  // ── Indicateur de statut ──────────────────────────────────────────────────
  const statusColor = { ok: '#10b981', error: '#ef4444', idle: '#6b7280' }[portStatus];

  // ── Styles boutons ────────────────────────────────────────────────────────
  const btn = (bg, outline = false) => ({
    padding: '13px 16px',
    background: outline ? 'transparent' : bg,
    color: outline ? bg : 'white',
    border: outline ? `2px solid ${bg}` : 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '15px',
    fontWeight: '600',
    width: '100%',
    minHeight: '50px',
  });

  const selectStyle = {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-border, #d1d5db)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '13px',
    flex: 1,
  };

  return (
    <>
      {/* iframe caché pour impression via dialogue navigateur (fallback) */}
      <iframe
        ref={iframeRef}
        title="receipt-print"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', border: 'none' }}
      />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
      }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          padding: '24px',
          width: '400px',
          maxWidth: '95vw',
          maxHeight: '94vh',
          overflow: 'auto',
        }}>
          {/* ── En-tête ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Options d'impression</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSettings(s => !s)}
                title="Configurer l'imprimante"
                style={{ background: showSettings ? '#3b82f6' : 'transparent', color: showSettings ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}
              >
                <Settings size={20} />
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)', display: 'flex' }}>
                <X size={22} />
              </button>
            </div>
          </div>

          {/* ── Panneau de configuration ─────────────────────────────────── */}
          {showSettings && (
            <div style={{
              background: 'var(--color-surface-hover, #f3f4f6)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '14px',
              fontSize: '13px',
            }}>
              <div style={{ fontWeight: '700', marginBottom: '10px', color: '#3b82f6' }}>
                ⚙️ Configuration imprimante (Haixun HX-K60)
              </div>

              {/* Port actuel */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                padding: '8px 10px', borderRadius: '8px',
                background: portName ? '#d1fae5' : '#fef3c7',
                border: `1px solid ${portName ? '#6ee7b7' : '#fcd34d'}`,
              }}>
                <span style={{ fontSize: '16px' }}>{portName ? '🟢' : '🔴'}</span>
                <div style={{ flex: 1, fontSize: '12px' }}>
                  <div style={{ fontWeight: '700' }}>Port imprimante</div>
                  <div style={{ color: '#6b7280' }}>{portName || 'Non configuré — cliquer "Sélectionner le port"'}</div>
                </div>
              </div>
              <button onClick={handleSelectPort} style={{
                width: '100%', padding: '9px', borderRadius: '8px',
                background: '#3b82f6', color: 'white', border: 'none',
                cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginBottom: '12px',
              }}>
                {portName ? '🔄 Changer de port' : '🔌 Sélectionner le port imprimante'}
              </button>

              {/* Mode d'impression */}
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Mode d'impression</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setPrintMode('serial')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    background: printMode === 'serial' ? '#3b82f6' : 'transparent',
                    color: printMode === 'serial' ? 'white' : 'var(--color-text)',
                    border: '2px solid #3b82f6',
                  }}
                >
                  ESC/POS Serial ★
                </button>
                <button
                  onClick={() => setPrintMode('dialog')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    background: printMode === 'dialog' ? '#6b7280' : 'transparent',
                    color: printMode === 'dialog' ? 'white' : 'var(--color-text)',
                    border: '2px solid #6b7280',
                  }}
                >
                  Dialogue Windows
                </button>
              </div>

              {/* Vitesse baud */}
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Vitesse (baud rate)
              </label>
              <select value={baudRate} onChange={e => setBaudRate(Number(e.target.value))} style={{ ...selectStyle, marginBottom: '10px', width: '100%' }}>
                {[9600, 19200, 38400, 57600, 115200].map(r => (
                  <option key={r} value={r}>{r} baud{r === 9600 ? ' (défaut)' : ''}</option>
                ))}
              </select>

              {/* Largeur papier */}
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Largeur du papier
              </label>
              <select value={paperWidth} onChange={e => setPaperWidth(Number(e.target.value))} style={{ ...selectStyle, marginBottom: '12px', width: '100%' }}>
                <option value={58}>58 mm (standard caisse)</option>
                <option value={80}>80 mm (grand format)</option>
              </select>

              {/* Boutons diagnostic */}
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Diagnostic</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <button onClick={testConnection} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', background: '#8b5cf6',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                }}>
                  Test ESC/POS
                </button>
                <button onClick={rawTest} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', background: '#0891b2',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                }}>
                  Test texte brut
                </button>
              </div>
              <button
                onClick={scanBaudRate}
                disabled={scanning}
                style={{
                  width: '100%', padding: '8px', borderRadius: '8px', marginBottom: '6px',
                  background: scanning ? '#6b7280' : '#f59e0b',
                  color: 'white', border: 'none', cursor: scanning ? 'wait' : 'pointer',
                  fontWeight: '600', fontSize: '12px',
                }}
              >
                {scanning ? '⏳ Scan en cours…' : '🔍 Scanner le baud rate (9600→19200→38400→115200)'}
              </button>
              <button onClick={disconnectPort} style={{
                width: '100%', padding: '7px', borderRadius: '8px', background: 'transparent',
                color: '#ef4444', border: '2px solid #ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
              }}>
                Déconnecter / Réinitialiser
              </button>

              {/* Aide contextuelle */}
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#6b7280', lineHeight: '1.6', background: '#fffbeb', padding: '8px', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                <strong>Guide dépannage COM1/COM2 :</strong><br />
                1. Sélectionner le port → choisir <strong>COM1</strong><br />
                2. Cliquer <strong>"Test texte brut"</strong> → si rien ne s'imprime → essayer <strong>COM2</strong><br />
                3. Si un texte illisible s'imprime → cliquer <strong>"Scanner le baud rate"</strong><br />
                4. Si RIEN ne s'imprime sur aucun port → l'imprimante est probablement <strong>USB Printer</strong> (non-série) → utiliser le <strong>Mode Dialogue Windows</strong> à la place
              </div>
            </div>
          )}

          {/* ── Statut de connexion ──────────────────────────────────────── */}
          {statusMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px',
              background: portStatus === 'ok' ? '#d1fae5' : portStatus === 'error' ? '#fee2e2' : '#f3f4f6',
              color: statusColor,
              marginBottom: '12px',
              fontSize: '13px', fontWeight: '600',
            }}>
              {portStatus === 'ok'    && <CheckCircle size={16} />}
              {portStatus === 'error' && <AlertCircle size={16} />}
              {statusMsg}
            </div>
          )}

          {/* ── Prévisualisation du reçu ─────────────────────────────────── */}
          <div style={{
            background: 'var(--color-surface-hover, #f9fafb)',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontFamily: 'monospace',
            fontSize: '11px',
            maxHeight: '220px',
            overflow: 'auto',
          }}>
            <div dangerouslySetInnerHTML={{ __html: generateReceiptPreview(sale, settings) }} />
          </div>

          {/* ── Boutons d'action ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Bouton d'impression (principal) */}
            <button onClick={handlePrint} style={btn('#3b82f6')}>
              <Printer size={20} />
              {printMode === 'serial' ? 'Imprimer via ESC/POS (port série)' : 'Imprimer (dialogue Windows)'}
            </button>

            {/* Tiroir-caisse — via le port de l'imprimante */}
            <button onClick={openCashDrawer} style={btn('#f59e0b')}>
              <Zap size={20} /> Ouvrir le tiroir-caisse
            </button>

            {/* Imprimer + ouvrir tiroir en même commande */}
            {printMode === 'serial' && (
              <button onClick={() => printViaSerial(true)} style={btn('#059669')}>
                <Printer size={18} /><Zap size={18} /> Imprimer + Ouvrir tiroir
              </button>
            )}

            <button onClick={downloadReceipt} style={btn('#10b981')}>
              <Download size={20} /> Télécharger le reçu (.html)
            </button>

            <button onClick={shareReceipt} style={btn('#8b5cf6')}>
              <Share2 size={20} /> Partager (SMS / WhatsApp)
            </button>

            <button onClick={onClose} style={btn('#6b7280', true)}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Génération HTML pour impression via dialogue navigateur (fallback)
// ═══════════════════════════════════════════════════════════════════════════════
function generateReceiptHTML(sale, settings, paperWidth = 58) {
  const mmWidth = `${paperWidth}mm`;
  const taxRate = settings.taxRate ?? 0;
  const taxMult = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax = Math.round((sale.total - subtotal) * 100) / 100;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu ${sale.receiptNumber || sale.id}</title>
  <style>
    @media print {
      @page { margin: 0; size: ${mmWidth} auto; }
      body { margin: 0; padding: 3mm 4mm; }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      width: ${mmWidth};
      margin: 0 auto;
      padding: 3mm 4mm;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .right  { text-align: right; }
    .small  { font-size: 9px; }
    .line   { border-top: 1px dashed #000; margin: 6px 0; }
    table   { width: 100%; border-collapse: collapse; }
    td      { padding: 1px 0; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:13px; margin-bottom:6px;">
    ${settings.companyName || 'SUPERETTE'}
  </div>
  <div class="center small">Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}</div>
  <div class="line"></div>
  <div class="small" style="margin:4px 0;">
    ${new Date(sale.createdAt).toLocaleString('fr-FR')}<br>
    Caissier: ${sale.cashier || 'Admin'}
  </div>
  <div class="line"></div>
  <table>
    ${(sale.items || []).map(item => `
    <tr><td colspan="2" class="bold">${item.productName || item.product?.name || ''}</td></tr>
    <tr>
      <td class="small">${item.quantity} × ${Number(item.unitPrice).toLocaleString()}</td>
      <td class="right bold">${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}</td>
    </tr>`).join('')}
  </table>
  <div class="line"></div>
  <table>
    ${taxRate > 0 ? `
    <tr class="small"><td>Sous-total:</td><td class="right">${subtotal.toFixed(0)} ${settings.currency}</td></tr>
    <tr class="small"><td>TVA (${taxRate}%):</td><td class="right">${tax.toFixed(0)} ${settings.currency}</td></tr>
    ` : ''}
    <tr class="bold" style="font-size:12px;">
      <td>TOTAL:</td>
      <td class="right">${Number(sale.total).toLocaleString()} ${settings.currency}</td>
    </tr>
  </table>
  <div class="line"></div>
  <div class="small">Paiement: ${
    sale.paymentMethod === 'cash'   ? 'Espèces' :
    sale.paymentMethod === 'card'   ? 'Carte'   :
    sale.paymentMethod === 'mobile' ? 'Mobile Money' :
    (sale.paymentMethod || 'Espèces')
  }</div>
  <div class="line"></div>
  <div class="center small" style="margin-top:8px;">${settings.receiptFooter || 'Merci de votre visite !'}</div>
</body>
</html>`;
}

// ── Prévisualisation dans le modal ────────────────────────────────────────────
function generateReceiptPreview(sale, settings) {
  const taxRate  = settings.taxRate ?? 0;
  const taxMult  = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax      = Math.round((sale.total - subtotal) * 100) / 100;

  return `
<div style="text-align:center;font-weight:bold;margin-bottom:6px;">${settings.companyName || 'SUPERETTE'}</div>
<div style="text-align:center;margin-bottom:6px;">Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}</div>
<div style="border-top:1px dashed #999;margin:6px 0;"></div>
<div>${new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
<div style="border-top:1px dashed #999;margin:6px 0;"></div>
${(sale.items || []).map(item => `
<div style="display:flex;justify-content:space-between;margin-bottom:2px;">
  <span>${item.productName || item.product?.name || ''}</span>
  <span>${item.quantity} × ${Number(item.unitPrice).toLocaleString()}</span>
</div>`).join('')}
<div style="border-top:1px dashed #999;margin:6px 0;"></div>
${taxRate > 0 ? `
<div style="display:flex;justify-content:space-between;font-size:11px;">
  <span>Sous-total</span><span>${subtotal.toFixed(0)} ${settings.currency}</span>
</div>
<div style="display:flex;justify-content:space-between;font-size:11px;">
  <span>TVA ${taxRate}%</span><span>${tax.toFixed(0)} ${settings.currency}</span>
</div>` : ''}
<div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:4px;">
  <span>TOTAL</span><span>${Number(sale.total).toLocaleString()} ${settings.currency}</span>
</div>
<div style="border-top:1px dashed #999;margin:6px 0;"></div>
<div style="text-align:center;">${settings.receiptFooter || 'Merci de votre visite !'}</div>`;
}

// ── Texte pour partage SMS / WhatsApp ────────────────────────────────────────
function generateReceiptText(sale, settings) {
  const taxRate  = settings.taxRate ?? 0;
  const taxMult  = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax      = Math.round((sale.total - subtotal) * 100) / 100;

  return [
    '════════════════════',
    settings.companyName || 'SUPERETTE',
    '════════════════════',
    '',
    `Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}`,
    `Date: ${new Date(sale.createdAt).toLocaleString('fr-FR')}`,
    '',
    '════════════════════',
    ...(sale.items || []).map(item =>
      `${item.productName || item.product?.name}\n` +
      `${item.quantity} x ${Number(item.unitPrice).toLocaleString()} = ` +
      `${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}`
    ),
    '════════════════════',
    ...(taxRate > 0 ? [
      `Sous-total : ${subtotal.toFixed(0)} ${settings.currency}`,
      `TVA ${taxRate}%  : ${tax.toFixed(0)} ${settings.currency}`,
    ] : []),
    `TOTAL    : ${Number(sale.total).toLocaleString()} ${settings.currency}`,
    '',
    `Paiement : ${
      sale.paymentMethod === 'cash'   ? 'Espèces' :
      sale.paymentMethod === 'card'   ? 'Carte'   :
      sale.paymentMethod === 'mobile' ? 'Mobile Money' :
      (sale.paymentMethod || 'Espèces')
    }`,
    '',
    '════════════════════',
    settings.receiptFooter || 'Merci de votre visite !',
  ].join('\n');
}
