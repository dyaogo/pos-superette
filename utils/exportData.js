// Exporter en CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Obtenir les en-têtes
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Échapper les virgules et guillemets
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  // Télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exporter en Excel

import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Données') => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  try {
    // Créer une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Créer un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Générer le fichier
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
};

// Exporter en PDF (via impression)
export const exportToPDF = (elementId, filename) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  const element = document.getElementById(elementId);
  
  if (!element) {
    alert('Élément non trouvé');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        h1 {
          color: #1f2937;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        .header-info {
          margin-bottom: 20px;
          padding: 15px;
          background: #eff6ff;
          border-radius: 8px;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Préparer les données de ventes pour export
export const prepareSalesData = (sales) => {
  return sales.map(sale => ({
    'N° Reçu': sale.receiptNumber || sale.id.substring(0, 8),
    'Date': new Date(sale.createdAt).toLocaleString('fr-FR'),
    'Total (FCFA)': sale.total,
    'Mode paiement': sale.paymentMethod === 'cash' ? 'Espèces' : 
                     sale.paymentMethod === 'mobile' ? 'Mobile Money' : 
                     sale.paymentMethod === 'credit' ? 'Crédit' : 'Autre',
    'Client': sale.customerName || 'Client comptant',
    'Caissier': sale.cashier || 'Admin',
    'Articles': sale.items?.length || 0
  }));
};

// Préparer les données de produits pour export
export const prepareProductsData = (products) => {
  return products.map(product => ({
    'Nom': product.name,
    'Catégorie': product.category,
    'Code-barres': product.barcode || 'N/A',
    'Prix achat (FCFA)': product.costPrice,
    'Prix vente (FCFA)': product.sellingPrice,
    'Marge (FCFA)': product.sellingPrice - product.costPrice,
    'Marge (%)': ((product.sellingPrice - product.costPrice) / product.sellingPrice * 100).toFixed(1),
    'Stock': product.stock,
    'Valeur stock (FCFA)': product.sellingPrice * product.stock
  }));
};

// Préparer les données de crédits pour export
export const prepareCreditsData = (credits, customers) => {
  return credits.map(credit => {
    const customer = customers.find(c => c.id === credit.customerId);
    return {
      'Client': customer?.name || 'Inconnu',
      'Téléphone': customer?.phone || 'N/A',
      'Montant (FCFA)': credit.amount,
      'Restant (FCFA)': credit.remainingAmount,
      'Description': credit.description || 'N/A',
      'Date création': new Date(credit.createdAt).toLocaleDateString('fr-FR'),
      'Échéance': new Date(credit.dueDate).toLocaleDateString('fr-FR'),
      'Statut': credit.status === 'paid' ? 'Payé' : 
                credit.status === 'partial' ? 'Partiel' : 'En attente'
    };
  });
};