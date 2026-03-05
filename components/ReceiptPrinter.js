import { Printer, Download, Share2, Zap, X } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import { useRef, useEffect, useCallback } from 'react';

export default function ReceiptPrinter({ sale, onClose, autoPrint = false }) {
  const { currentStore } = useApp();
  const iframeRef = useRef(null);
  const serialPortRef = useRef(null);

  // ✅ FIX: ?? au lieu de || pour que 0% TVA soit valide
  const settings = {
    companyName: currentStore?.name || 'SUPERETTE',
    currency: currentStore?.currency || 'FCFA',
    taxRate: currentStore?.taxRate ?? 0,
    receiptFooter: 'Merci de votre visite !',
  };

  // ✨ Impression via iframe caché — compatible Windows + Android Chrome
  const printReceipt = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(generateReceiptHTML(sale, settings));
    doc.close();

    // Déclencher l'impression une fois le contenu chargé
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Erreur impression iframe:', err);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale]);

  // Auto-impression après une vente (si prop autoPrint=true)
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => printReceipt(), 600);
    return () => clearTimeout(timer);
  }, [autoPrint, printReceipt]);

  // ──────────────────────────────────────────────────────────────
  // Tiroir-caisse via Web Serial API (Chrome sur Windows / Linux / Mac)
  // ──────────────────────────────────────────────────────────────
  const openCashDrawer = async () => {
    if (!('serial' in navigator)) {
      alert(
        'Web Serial API non disponible.\n' +
        'Assurez-vous d\'utiliser Chrome ou Edge sur ce PC.\n' +
        'Allez dans chrome://flags et activez "Experimental Web Platform features" si nécessaire.'
      );
      return;
    }

    try {
      let port = serialPortRef.current;

      // Demander le port si pas encore connecté (ou port fermé)
      if (!port || !port.readable) {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        serialPortRef.current = port;
      }

      const writer = port.writable.getWriter();
      // ESC/POS : ouvrir tiroir-caisse — pulse sur pin 2 du connecteur RJ11
      // Commande: ESC p 0 25 250
      await writer.write(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
      writer.releaseLock();

    } catch (err) {
      if (err.name !== 'NotFoundError') {
        console.error('Erreur ouverture tiroir-caisse:', err);
        alert(`Erreur tiroir-caisse : ${err.message}`);
      }
      serialPortRef.current = null;
    }
  };

  // ──────────────────────────────────────────────────────────────

  const downloadReceipt = () => {
    const receiptHTML = generateReceiptHTML(sale, settings);
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu_${sale.receiptNumber || sale.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = async () => {
    const text = generateReceiptText(sale, settings);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reçu ${sale.receiptNumber || sale.id}`,
          text,
        });
      } catch {
        // Partage annulé par l'utilisateur
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Reçu copié dans le presse-papier');
    }
  };

  // Style commun des boutons (touch-friendly pour terminal POS)
  const btnStyle = (bg, outline = false) => ({
    padding: '14px 16px',
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
    minHeight: '52px',
  });

  return (
    <>
      {/* iframe caché — reçoit le HTML du reçu pour impression */}
      <iframe
        ref={iframeRef}
        title="receipt-print"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          border: 'none',
        }}
      />

      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          padding: '24px',
          width: '380px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          overflow: 'auto',
        }}>
          {/* En-tête */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Options d'impression</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Prévisualisation du reçu */}
          <div style={{
            background: 'var(--color-surface-hover)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '280px',
            overflow: 'auto',
          }}>
            <div dangerouslySetInnerHTML={{ __html: generateReceiptPreview(sale, settings) }} />
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={printReceipt} style={btnStyle('#3b82f6')}>
              <Printer size={20} /> Imprimer (58mm)
            </button>

            <button onClick={openCashDrawer} style={btnStyle('#f59e0b')}>
              <Zap size={20} /> Ouvrir le tiroir-caisse
            </button>

            <button onClick={downloadReceipt} style={btnStyle('#10b981')}>
              <Download size={20} /> Télécharger le reçu
            </button>

            <button onClick={shareReceipt} style={btnStyle('#8b5cf6')}>
              <Share2 size={20} /> Partager (SMS / WhatsApp)
            </button>

            <button onClick={onClose} style={btnStyle('#6b7280', true)}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Génération HTML du reçu pour impression 58mm ─────────────────────────────

function generateReceiptHTML(sale, settings) {
  // ✅ FIX: Calculer sous-total et TVA depuis le taux réel du magasin
  const taxRate = settings.taxRate ?? 0;
  const taxMultiplier = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0
    ? sale.total
    : Math.round((sale.total / taxMultiplier) * 100) / 100;
  const tax = Math.round((sale.total - subtotal) * 100) / 100;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu ${sale.receiptNumber || sale.id}</title>
  <style>
    @media print {
      @page { margin: 0; size: 58mm auto; }
      body { margin: 0; padding: 3mm 4mm; }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      width: 58mm;
      margin: 0 auto;
      padding: 3mm 4mm;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .line   { border-top: 1px dashed #000; margin: 6px 0; }
    table   { width: 100%; border-collapse: collapse; }
    td      { padding: 1px 0; }
    .right  { text-align: right; }
    .small  { font-size: 9px; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:13px; margin-bottom:6px;">
    ${settings.companyName || 'SUPERETTE'}
  </div>
  <div class="center small" style="margin-bottom:6px;">
    Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
  </div>
  <div class="line"></div>
  <div class="small" style="margin:6px 0;">
    ${new Date(sale.createdAt).toLocaleString('fr-FR')}<br>
    Caissier: ${sale.cashier || 'Admin'}
  </div>
  <div class="line"></div>
  <table>
    ${(sale.items || []).map(item => `
    <tr>
      <td colspan="2" style="font-weight:bold;">${item.productName || item.product?.name || ''}</td>
    </tr>
    <tr>
      <td class="small">${item.quantity} x ${Number(item.unitPrice).toLocaleString()}</td>
      <td class="right bold">${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}</td>
    </tr>`).join('')}
  </table>
  <div class="line"></div>
  <table>
    ${taxRate > 0 ? `
    <tr class="small">
      <td>Sous-total:</td>
      <td class="right">${subtotal.toFixed(0)} ${settings.currency}</td>
    </tr>
    <tr class="small">
      <td>TVA (${taxRate}%):</td>
      <td class="right">${tax.toFixed(0)} ${settings.currency}</td>
    </tr>` : ''}
    <tr class="bold" style="font-size:12px;">
      <td>TOTAL:</td>
      <td class="right">${Number(sale.total).toLocaleString()} ${settings.currency}</td>
    </tr>
  </table>
  <div class="line"></div>
  <div class="small">
    Paiement: ${
      sale.paymentMethod === 'cash'   ? 'Espèces' :
      sale.paymentMethod === 'card'   ? 'Carte'   :
      sale.paymentMethod === 'mobile' ? 'Mobile Money' :
      (sale.paymentMethod || 'Espèces')
    }
  </div>
  <div class="line"></div>
  <div class="center small" style="margin-top:8px;">
    ${settings.receiptFooter || 'Merci de votre visite !'}
  </div>
</body>
</html>`;
}

// ─── Prévisualisation dans le modal ───────────────────────────────────────────

function generateReceiptPreview(sale, settings) {
  const taxRate = settings.taxRate ?? 0;
  const taxMultiplier = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0
    ? sale.total
    : Math.round((sale.total / taxMultiplier) * 100) / 100;
  const tax = Math.round((sale.total - subtotal) * 100) / 100;

  return `
<div style="text-align:center;font-weight:bold;margin-bottom:8px;">
  ${settings.companyName || 'SUPERETTE'}
</div>
<div style="text-align:center;margin-bottom:8px;">
  Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
</div>
<div style="border-top:1px dashed #999;margin:8px 0;"></div>
<div style="margin-bottom:6px;">${new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
<div style="border-top:1px dashed #999;margin:8px 0;"></div>
${(sale.items || []).map(item => `
<div style="display:flex;justify-content:space-between;margin-bottom:2px;">
  <span>${item.productName || item.product?.name || ''}</span>
  <span>${item.quantity} × ${Number(item.unitPrice).toLocaleString()}</span>
</div>`).join('')}
<div style="border-top:1px dashed #999;margin:8px 0;"></div>
${taxRate > 0 ? `
<div style="display:flex;justify-content:space-between;font-size:11px;">
  <span>Sous-total</span><span>${subtotal.toFixed(0)} ${settings.currency}</span>
</div>
<div style="display:flex;justify-content:space-between;font-size:11px;">
  <span>TVA ${taxRate}%</span><span>${tax.toFixed(0)} ${settings.currency}</span>
</div>` : ''}
<div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:4px;">
  <span>TOTAL</span>
  <span>${Number(sale.total).toLocaleString()} ${settings.currency}</span>
</div>
<div style="border-top:1px dashed #999;margin:8px 0;"></div>
<div style="text-align:center;">${settings.receiptFooter || 'Merci de votre visite !'}</div>`;
}

// ─── Texte pour partage SMS / WhatsApp ────────────────────────────────────────

function generateReceiptText(sale, settings) {
  const taxRate = settings.taxRate ?? 0;
  const taxMultiplier = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const subtotal = taxRate === 0
    ? sale.total
    : Math.round((sale.total / taxMultiplier) * 100) / 100;
  const tax = Math.round((sale.total - subtotal) * 100) / 100;

  const lines = [
    '━━━━━━━━━━━━━━━━━━━━',
    settings.companyName || 'SUPERETTE',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    `Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}`,
    `Date: ${new Date(sale.createdAt).toLocaleString('fr-FR')}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    ...(sale.items || []).map(item =>
      `${item.productName || item.product?.name}\n` +
      `${item.quantity} x ${Number(item.unitPrice).toLocaleString()} = ` +
      `${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}`
    ),
    '━━━━━━━━━━━━━━━━━━━━',
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
    '━━━━━━━━━━━━━━━━━━━━',
    settings.receiptFooter || 'Merci de votre visite !',
  ];

  return lines.join('\n');
}
