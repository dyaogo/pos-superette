import { Printer, Download, Share2 } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';

export default function ReceiptPrinter({ sale, onClose }) {
  const { currentStore } = useApp();

  // Créer un objet settings depuis currentStore
  const settings = {
    companyName: currentStore?.name || 'SUPERETTE',
    currency: currentStore?.currency || 'FCFA',
    taxRate: currentStore?.taxRate || 18,
    receiptFooter: 'Merci de votre visite !'
  };

  const printReceipt = () => {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(generateReceiptHTML(sale, settings));
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
      // Fallback : copier dans le presse-papier
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
          <div dangerouslySetInnerHTML={{ __html: generateReceiptPreview(sale, appSettings) }} />
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
            Imprimer
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

// Générer le HTML du reçu pour impression
function generateReceiptHTML(sale, settings) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reçu ${sale.receiptNumber || sale.id}</title>
      <style>
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 10mm; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          margin: 0 auto;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size: 16px; margin-bottom: 10px;">
        ${settings.companyName || 'SUPERETTE'}
      </div>
      
      <div class="center" style="margin-bottom: 10px;">
        Reçu N° ${sale.receiptNumber || sale.id.substring(0, 8)}
      </div>
      
      <div class="line"></div>
      
      <div style="margin: 10px 0;">
        Date: ${new Date(sale.createdAt).toLocaleString('fr-FR')}<br>
        Caissier: ${sale.cashier || 'Admin'}
      </div>
      
      <div class="line"></div>
      
      <table>
        ${sale.items?.map(item => `
          <tr>
            <td>${item.productName || item.product?.name}</td>
            <td class="right">${item.quantity} x ${item.unitPrice}</td>
          </tr>
          <tr>
            <td></td>
            <td class="right bold">${(item.quantity * item.unitPrice).toLocaleString()} ${settings.currency}</td>
          </tr>
        `).join('')}
      </table>
      
      <div class="line"></div>
      
      <table>
        <tr>
          <td>Sous-total:</td>
          <td class="right">${(sale.subtotal || sale.total / 1.18).toFixed(0)} ${settings.currency}</td>
        </tr>
        <tr>
          <td>TVA (${settings.taxRate}%):</td>
          <td class="right">${(sale.tax || sale.total - sale.total / 1.18).toFixed(0)} ${settings.currency}</td>
        </tr>
        <tr class="bold" style="font-size: 14px;">
          <td>TOTAL:</td>
          <td class="right">${sale.total.toLocaleString()} ${settings.currency}</td>
        </tr>
      </table>
      
      <div class="line"></div>
      
      <div>
        Paiement: ${sale.paymentMethod === 'cash' ? 'Espèces' : 
                    sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}
      </div>
      
      <div class="line"></div>
      
      <div class="center" style="margin-top: 10px;">
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
      <span>${sale.total.toLocaleString()} ${settings.currency}</span>
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

TOTAL: ${sale.total.toLocaleString()} ${settings.currency}

Paiement: ${sale.paymentMethod === 'cash' ? 'Espèces' : 
            sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}

━━━━━━━━━━━━━━━━━━━━
${settings.receiptFooter || 'Merci de votre visite !'}
  `.trim();
}