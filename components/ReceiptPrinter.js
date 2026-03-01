import { Printer, Download, Share2, Zap, Unlink } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import { useEffect, useRef } from 'react';

export default function ReceiptPrinter({ sale, onClose }) {
  const { currentStore } = useApp();
  const serialPortRef = useRef(null);

  // Créer un objet settings depuis currentStore
  const settings = {
    companyName: currentStore?.name || 'SUPERETTE',
    currency: currentStore?.currency || 'FCFA',
    taxRate: currentStore?.taxRate || 18,
    receiptFooter: 'Merci de votre visite !'
  };

  // ✨ Auto-imprimer dès l'ouverture du modal (hardware Haixun)
  useEffect(() => {
    const timer = setTimeout(() => {
      printReceipt();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const printReceipt = () => {
    const printWindow = window.open('', '', 'width=240,height=500');
    if (!printWindow) return;
    printWindow.document.write(generateReceiptHTML(sale, settings));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // ✨ Connexion à l'imprimante/caisse via Web Serial API (Chrome/Edge uniquement)
  const connectSerialPort = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API non disponible.\nUtilisez Chrome ou Edge sur cet ordinateur.');
      return null;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      return port;
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        console.error('Erreur connexion port série:', err);
      }
      return null;
    }
  };

  // ✨ Ouvrir la caisse via commande ESC/POS (pin 2 du connecteur RJ11)
  const openCashDrawer = async () => {
    let port = serialPortRef.current;

    // Si pas encore connecté, demander à l'utilisateur de choisir le port
    if (!port || !port.writable) {
      port = await connectSerialPort();
      if (!port) return;
    }

    try {
      const writer = port.writable.getWriter();
      // ESC/POS : ESC p 0 25 250 → pulse sur pin 2 du tiroir-caisse
      const command = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
      await writer.write(command);
      writer.releaseLock();
    } catch (err) {
      console.error('Erreur ouverture caisse:', err);
      // Réinitialiser le port en cas d'erreur
      serialPortRef.current = null;
    }
  };

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
          text: text
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Reçu copié dans le presse-papier');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '30px',
        width: '400px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Options d'impression</h2>

        {/* Prévisualisation du reçu */}
        <div style={{
          background: 'var(--color-surface-hover)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div dangerouslySetInnerHTML={{ __html: generateReceiptPreview(sale, settings) }} />
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={printReceipt}
            style={{
              padding: '12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <Printer size={20} />
            Imprimer (58mm)
          </button>

          {/* ✨ Bouton ouverture caisse */}
          <button
            onClick={openCashDrawer}
            style={{
              padding: '12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <Zap size={20} />
            Ouvrir la caisse
          </button>

          <button
            onClick={downloadReceipt}
            style={{
              padding: '12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <Download size={20} />
            Télécharger
          </button>

          <button
            onClick={shareReceipt}
            style={{
              padding: '12px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <Share2 size={20} />
            Partager (SMS/WhatsApp)
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ✨ Générer le HTML du reçu pour impression 58mm
function generateReceiptHTML(sale, settings) {
  return `
    <!DOCTYPE html>
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
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; }
        .right { text-align: right; }
        .small { font-size: 9px; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size: 13px; margin-bottom: 6px;">
        ${settings.companyName || 'SUPERETTE'}
      </div>

      <div class="center small" style="margin-bottom: 6px;">
        Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
      </div>

      <div class="line"></div>

      <div class="small" style="margin: 6px 0;">
        ${new Date(sale.createdAt).toLocaleString('fr-FR')}<br>
        Caissier: ${sale.cashier || 'Admin'}
      </div>

      <div class="line"></div>

      <table>
        ${sale.items?.map(item => `
          <tr>
            <td colspan="2" style="font-weight:bold;">${item.productName || item.product?.name}</td>
          </tr>
          <tr>
            <td class="small">${item.quantity} x ${Number(item.unitPrice).toLocaleString()}</td>
            <td class="right bold">${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}</td>
          </tr>
        `).join('')}
      </table>

      <div class="line"></div>

      <table>
        <tr class="small">
          <td>Sous-total:</td>
          <td class="right">${(sale.subtotal || sale.total / 1.18).toFixed(0)} ${settings.currency}</td>
        </tr>
        <tr class="small">
          <td>TVA (${settings.taxRate}%):</td>
          <td class="right">${(sale.tax || sale.total - sale.total / 1.18).toFixed(0)} ${settings.currency}</td>
        </tr>
        <tr class="bold" style="font-size: 12px;">
          <td>TOTAL:</td>
          <td class="right">${Number(sale.total).toLocaleString()} ${settings.currency}</td>
        </tr>
      </table>

      <div class="line"></div>

      <div class="small">
        Paiement: ${sale.paymentMethod === 'cash' ? 'Espèces' :
                    sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}
      </div>

      <div class="line"></div>

      <div class="center small" style="margin-top: 8px;">
        ${settings.receiptFooter || 'Merci de votre visite !'}
      </div>
    </body>
    </html>
  `;
}

// Générer la prévisualisation
function generateReceiptPreview(sale, settings) {
  return `
    <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
      ${settings.companyName || 'SUPERETTE'}
    </div>
    <div style="text-align: center; margin-bottom: 10px;">
      Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
    </div>
    <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    <div>${new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
    <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    ${sale.items?.map(item => `
      <div style="display: flex; justify-content: space-between;">
        <span>${item.productName || item.product?.name}</span>
        <span>${item.quantity} x ${item.unitPrice}</span>
      </div>
    `).join('')}
    <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    <div style="display: flex; justify-content: space-between; font-weight: bold;">
      <span>TOTAL:</span>
      <span>${Number(sale.total).toLocaleString()} ${settings.currency}</span>
    </div>
    <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    <div style="text-align: center;">${settings.receiptFooter}</div>
  `;
}

// Générer le texte du reçu pour partage
function generateReceiptText(sale, settings) {
  return `
━━━━━━━━━━━━━━━━━━━━
${settings.companyName || 'SUPERETTE'}
━━━━━━━━━━━━━━━━━━━━

Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
Date: ${new Date(sale.createdAt).toLocaleString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━
${sale.items?.map(item => `
${item.productName || item.product?.name}
${item.quantity} x ${item.unitPrice} = ${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}
`).join('')}
━━━━━━━━━━━━━━━━━━━━

TOTAL: ${Number(sale.total).toLocaleString()} ${settings.currency}

Paiement: ${sale.paymentMethod === 'cash' ? 'Espèces' :
            sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}

━━━━━━━━━━━━━━━━━━━━
${settings.receiptFooter || 'Merci de votre visite !'}
  `.trim();
}
