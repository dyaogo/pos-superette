import { Printer, Download, Share2, Zap, X, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import { useRef, useEffect, useCallback, useState } from 'react';

// ── Config sauvegardée (localStorage) ────────────────────────────────────────

function getSavedConfig() {
  if (typeof window === 'undefined') return { paperWidth: 58, printMode: 'dialog' };
  return {
    paperWidth: parseInt(localStorage.getItem('printer_paper_width') || '58', 10),
    printMode:  localStorage.getItem('printer_print_mode') || 'dialog',
  };
}

// ── Encodage Code Page 850 (latin / français) ─────────────────────────────────
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
    else bytes.push(63);
  }
  return bytes;
}

// ── Constantes ESC/POS ────────────────────────────────────────────────────────
const ESC = 0x1B, GS = 0x1D, LF = 0x0A;
const CMD = {
  init:        [ESC, 0x40],
  cp850:       [ESC, 0x74, 0x02],
  boldOn:      [ESC, 0x45, 0x01],
  boldOff:     [ESC, 0x45, 0x00],
  alignLeft:   [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  dblSize:     [GS,  0x21, 0x11],
  dblHeight:   [GS,  0x21, 0x01],
  normalSize:  [GS,  0x21, 0x00],
  feed:        [LF, LF, LF],
  cut:         [GS,  0x56, 0x41, 0x00],
  drawerPin2:  [ESC, 0x70, 0x00, 0x19, 0xFA],
};

// ── Génération du ticket ESC/POS ──────────────────────────────────────────────
// cols : 32 pour 58 mm, 42 pour 80 mm
function buildESCPOS(sale, settings, cols = 32, openDrawer = true) {
  const bytes = [];
  const push  = (...b) => bytes.push(...b);
  const flat  = (arr)  => push(...arr);
  const text  = (str)  => push(...encodeCP850(str));
  const line  = (str = '') => { text(str); push(LF); };
  const divider = () => line('-'.repeat(cols));
  const twoCol  = (left, right) => {
    const l = String(left), r = String(right);
    const space = cols - l.length - r.length;
    if (space >= 0) line(l + ' '.repeat(space) + r);
    else            line(l.substring(0, cols - r.length - 1) + ' ' + r);
  };

  // En-tête
  flat(CMD.init); flat(CMD.cp850); flat(CMD.alignCenter); flat(CMD.boldOn); flat(CMD.dblSize);
  line(settings.companyName || 'SUPERETTE');
  flat(CMD.normalSize); flat(CMD.boldOff);
  line(`Recu N°: ${sale.receiptNumber || sale.id.substring(0, 8)}`);
  line(new Date(sale.createdAt).toLocaleString('fr-FR'));
  flat(CMD.alignLeft); divider();

  // Articles
  (sale.items || []).forEach(item => {
    const name   = item.productName || item.product?.name || '';
    const qtyStr = `  ${item.quantity} x ${Number(item.unitPrice).toLocaleString()}`;
    const totStr = `${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}`;
    flat(CMD.boldOn);  line(name.substring(0, cols));
    flat(CMD.boldOff); twoCol(qtyStr, totStr);
  });
  divider();

  // Totaux
  const taxRate  = settings.taxRate ?? 0;
  const taxMult  = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax      = Math.round((sale.total - subtotal) * 100) / 100;
  if (taxRate > 0) {
    twoCol('Sous-total:', `${subtotal.toFixed(0)} ${settings.currency}`);
    twoCol(`TVA ${taxRate}%:`, `${tax.toFixed(0)} ${settings.currency}`);
  }
  flat(CMD.boldOn); flat(CMD.dblHeight);
  twoCol('TOTAL:', `${Number(sale.total).toLocaleString()} ${settings.currency}`);
  flat(CMD.normalSize); flat(CMD.boldOff); push(LF);

  // Paiement
  const payLabel = { cash: 'Especes', card: 'Carte', mobile: 'Mobile Money' }[sale.paymentMethod]
    || (sale.paymentMethod || 'Especes');
  twoCol('Paiement:', payLabel);
  if (sale.paymentMethod === 'cash' && sale.cashReceived) {
    twoCol('Recu:', `${Number(sale.cashReceived).toLocaleString()} ${settings.currency}`);
    const change = sale.cashReceived - sale.total;
    if (change > 0) twoCol('Monnaie:', `${Number(change).toLocaleString()} ${settings.currency}`);
  }
  if (sale.cashier) twoCol('Caissier:', sale.cashier);
  divider();

  // Pied de page + coupe + tiroir
  flat(CMD.alignCenter);
  line(settings.receiptFooter || 'Merci de votre visite !');
  flat(CMD.alignLeft);
  flat(CMD.feed); flat(CMD.cut);
  if (openDrawer) flat(CMD.drawerPin2);

  return bytes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReceiptPrinter({ sale, onClose, autoPrint = false }) {
  const { currentStore } = useApp();
  const iframeRef = useRef(null);
  const cfg = getSavedConfig();

  const [paperWidth,   setPaperWidth]   = useState(cfg.paperWidth);
  const [printMode,    setPrintMode]    = useState(cfg.printMode); // 'windows' | 'dialog'
  const [portStatus,   setPortStatus]   = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');

  const settings = {
    companyName:   currentStore?.name           || 'SUPERETTE',
    currency:      currentStore?.currency       || 'FCFA',
    taxRate:       currentStore?.taxRate        ?? 0,
    receiptFooter: currentStore?.receiptFooter  || 'Merci de votre visite !',
  };
  const cols = paperWidth >= 80 ? 42 : 32;

  // Sauvegarder la config à chaque changement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('printer_paper_width', paperWidth);
    localStorage.setItem('printer_print_mode',  printMode);
  }, [paperWidth, printMode]);

  // ── Agent local Windows (printer-agent/start.bat) ────────────────────────
  const AGENT_URL = 'http://127.0.0.1:6543';

  // ── Impression via dialogue Windows ──────────────────────────────────────
  const printViaDialog = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(generateReceiptHTML(sale, settings, paperWidth));
    doc.close();
    iframe.onload = () => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      catch {}
    };
    setStatusMsg('Dialogue d\'impression ouvert');
  }, [sale, settings, paperWidth]);

  // ── Impression ESC/POS via agent local Windows ───────────────────────────
  const printViaWindowsESCPOS = useCallback(async (alsoOpenDrawer = true) => {
    try {
      setPortStatus('idle');
      setStatusMsg('Envoi à l\'imprimante…');
      const printerName = localStorage.getItem('printer_windows_name') || 'POS58';
      const bytes = buildESCPOS(sale, settings, cols, alsoOpenDrawer);
      const resp  = await fetch(`${AGENT_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName, bytes }),
      });
      const data = await resp.json();
      if (data.ok) {
        setPortStatus('ok');
        setStatusMsg('Ticket imprimé ✓' + (alsoOpenDrawer ? ' + tiroir ouvert ✓' : ''));
        return true;
      }
      setPortStatus('error');
      setStatusMsg(`Erreur: ${data.error || 'inconnue'}`);
      return false;
    } catch (err) {
      setPortStatus('error');
      setStatusMsg(`Agent introuvable — démarrez printer-agent/start.bat (${err.message})`);
      return false;
    }
  }, [sale, settings, cols]);

  // ── Bouton "Imprimer" ─────────────────────────────────────────────────────
  const handlePrint = () => {
    if (printMode === 'windows') printViaWindowsESCPOS(false);
    else printViaDialog();
  };

  // ── Auto-impression après une vente ──────────────────────────────────────
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(async () => {
      if (printMode === 'windows') {
        const ok = await printViaWindowsESCPOS(false);
        if (!ok) printViaDialog();
      } else {
        printViaDialog();
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint]);

  // ── Tiroir-caisse ─────────────────────────────────────────────────────────
  const openCashDrawer = useCallback(async () => {
    try {
      setPortStatus('idle');
      setStatusMsg('Ouverture du tiroir…');
      const printerName = localStorage.getItem('printer_windows_name') || 'POS58';
      const url = printMode === 'windows' ? `${AGENT_URL}/drawer` : '/api/printer/open-drawer';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName }),
      });
      const data = await resp.json();
      if (data.ok) {
        setPortStatus('ok');
        setStatusMsg('Tiroir ouvert ✓');
      } else {
        setPortStatus('error');
        setStatusMsg(`Erreur tiroir: ${data.error || 'inconnue'}`);
      }
    } catch (err) {
      setPortStatus('error');
      setStatusMsg(printMode === 'windows'
        ? 'Agent introuvable — démarrez printer-agent/start.bat'
        : `Erreur tiroir: ${err.message}`);
    }
  }, [printMode]);

  // ── Téléchargement HTML ───────────────────────────────────────────────────
  const downloadReceipt = () => {
    const html = generateReceiptHTML(sale, settings, paperWidth);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `recu_${sale.receiptNumber || sale.id}.html`;
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

  const statusColor = { ok: '#10b981', error: '#ef4444', idle: '#6b7280' }[portStatus];
  const btn = (bg, outline = false) => ({
    padding: '13px 16px',
    background: outline ? 'transparent' : bg,
    color: outline ? bg : 'white',
    border: outline ? `2px solid ${bg}` : 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontSize: '15px', fontWeight: '600', width: '100%', minHeight: '50px',
  });
  const selectStyle = {
    padding: '8px 10px', borderRadius: '8px',
    border: '1px solid var(--color-border, #d1d5db)',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    fontSize: '13px', flex: 1,
  };

  return (
    <>
      {/* iframe caché pour impression dialogue */}
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
          background: 'var(--color-bg)',
          borderRadius: '16px',
          padding: '24px',
          width: '340px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>🧾 Reçu de vente</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowSettings(v => !v)} style={{
                background: showSettings ? 'var(--color-primary)' : 'transparent',
                color: showSettings ? 'white' : 'var(--color-text-muted)',
                border: '1px solid var(--color-border)', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer',
              }}>
                <Settings size={16} />
              </button>
              <button onClick={onClose} style={{
                background: 'transparent', color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer',
              }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panneau de configuration */}
          {showSettings && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '14px',
              fontSize: '13px',
            }}>
              <div style={{ fontWeight: '700', marginBottom: '10px', color: '#3b82f6' }}>
                ⚙️ Configuration imprimante
              </div>

              {/* Mode d'impression */}
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Mode d'impression</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <button onClick={() => setPrintMode('windows')} style={{
                  padding: '9px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  background: printMode === 'windows' ? '#059669' : 'transparent',
                  color: printMode === 'windows' ? 'white' : 'var(--color-text)',
                  border: '2px solid #059669', textAlign: 'left',
                }}>
                  🖨️ ESC/POS via agent Windows ★ <span style={{ fontSize: '10px', opacity: 0.85 }}>(recommandé — LPT1, tiroir inclus)</span>
                </button>
                <button onClick={() => setPrintMode('dialog')} style={{
                  padding: '9px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  background: printMode === 'dialog' ? '#3b82f6' : 'transparent',
                  color: printMode === 'dialog' ? 'white' : 'var(--color-text)',
                  border: '2px solid #3b82f6', textAlign: 'left',
                }}>
                  🗔 Dialogue Windows <span style={{ fontSize: '10px', opacity: 0.85 }}>(Ctrl+P, tiroir séparé)</span>
                </button>
              </div>

              {/* Largeur papier */}
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Largeur du papier</label>
              <select value={paperWidth} onChange={e => setPaperWidth(Number(e.target.value))}
                style={{ ...selectStyle, marginBottom: '12px', width: '100%' }}>
                <option value={58}>58 mm (standard caisse)</option>
                <option value={80}>80 mm (grand format)</option>
              </select>

              {/* Nom imprimante */}
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Nom de l'imprimante Windows
              </label>
              <input
                type="text"
                defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('printer_windows_name') || 'POS58') : 'POS58'}
                onBlur={e => {
                  if (typeof window !== 'undefined')
                    localStorage.setItem('printer_windows_name', e.target.value.trim() || 'POS58');
                }}
                placeholder="T8DLabel Printer"
                style={{ ...selectStyle, marginBottom: '10px', width: '100%' }}
              />

              {printMode === 'windows' && (
                <div style={{ fontSize: '11px', color: '#065f46', lineHeight: '1.6', background: '#d1fae5', padding: '8px', borderRadius: '6px', border: '1px solid #6ee7b7' }}>
                  <strong>Mode ESC/POS actif</strong><br />
                  L'agent local (printer-agent/start.bat) envoie les données directement à l'imprimante Windows. Coupe-papier et tiroir-caisse inclus dans le même envoi.
                </div>
              )}
              {printMode === 'dialog' && (
                <div style={{ fontSize: '11px', color: '#1e40af', lineHeight: '1.6', background: '#eff6ff', padding: '8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <strong>Mode Dialogue actif</strong><br />
                  Le dialogue Windows (Ctrl+P) s'ouvre. Le tiroir s'ouvre via l'API serveur.
                </div>
              )}
            </div>
          )}

          {/* Statut */}
          {statusMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px',
              background: portStatus === 'ok' ? '#d1fae5' : portStatus === 'error' ? '#fee2e2' : '#f3f4f6',
              color: statusColor,
              marginBottom: '12px', fontSize: '13px', fontWeight: '600',
            }}>
              {portStatus === 'ok'    && <CheckCircle size={16} />}
              {portStatus === 'error' && <AlertCircle size={16} />}
              {statusMsg}
            </div>
          )}

          {/* Prévisualisation du reçu */}
          <div style={{
            background: 'var(--color-surface-hover, #f9fafb)',
            padding: '14px', borderRadius: '10px', marginBottom: '16px',
            fontFamily: 'monospace', fontSize: '11px',
            maxHeight: '220px', overflow: 'auto',
          }}>
            <div dangerouslySetInnerHTML={{ __html: generateReceiptPreview(sale, settings) }} />
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handlePrint} style={btn('#3b82f6')}>
              <Printer size={20} />
              {printMode === 'windows' ? 'Imprimer ESC/POS (Windows)' : 'Imprimer (dialogue Windows)'}
            </button>

            <button onClick={openCashDrawer} style={btn('#f59e0b')}>
              <Zap size={20} /> Ouvrir le tiroir-caisse
            </button>

            <button
              onClick={() => printMode === 'windows' ? printViaWindowsESCPOS(true) : (printViaDialog(), openCashDrawer())}
              style={btn('#059669')}
            >
              <Printer size={18} /><Zap size={18} /> Imprimer + Ouvrir tiroir
            </button>

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
// Génération HTML pour impression dialogue
// ═══════════════════════════════════════════════════════════════════════════════
function generateReceiptHTML(sale, settings, paperWidth = 58) {
  const mmWidth  = `${paperWidth}mm`;
  const taxRate  = settings.taxRate ?? 0;
  const taxMult  = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0 ? sale.total : Math.round((sale.total / taxMult) * 100) / 100;
  const tax      = Math.round((sale.total - subtotal) * 100) / 100;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu ${sale.receiptNumber || sale.id}</title>
  <style>
    @media print {
      @page { margin: 0; size: ${mmWidth} auto; }
      body  { margin: 0; padding: 3mm 4mm; }
    }
    body { font-family: 'Courier New', monospace; font-size: 10px; width: ${mmWidth}; margin: 0 auto; padding: 3mm 4mm; }
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
  <div class="center bold" style="font-size:13px;margin-bottom:6px;">${settings.companyName || 'SUPERETTE'}</div>
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
    <tr class="small"><td>TVA (${taxRate}%):</td><td class="right">${tax.toFixed(0)} ${settings.currency}</td></tr>` : ''}
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

// ── Texte pour partage SMS / WhatsApp ─────────────────────────────────────────
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
