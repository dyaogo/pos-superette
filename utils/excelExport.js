import * as XLSX from 'xlsx';

export function exportSalesToExcel(sales, customers, period = 'all') {
  const workbook = XLSX.utils.book_new();

  // Préparer les données de ventes
  const salesData = sales.map(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    return {
      'Date': new Date(sale.createdAt).toLocaleString('fr-FR'),
      'N° Reçu': sale.receiptNumber || sale.id.substring(0, 8),
      'Client': customer?.name || 'Client Comptant',
      'Montant Total': sale.total,
      'Paiement': sale.paymentMethod === 'cash' ? 'Espèces' : 
                  sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money',
      'Articles': sale.items?.length || 0,
      'Statut': sale.offline ? 'Hors ligne' : 'Synchronisé'
    };
  });

  // Créer la feuille
  const worksheet = XLSX.utils.json_to_sheet(salesData);

  // Définir la largeur des colonnes
  worksheet['!cols'] = [
    { wch: 20 }, // Date
    { wch: 15 }, // N° Reçu
    { wch: 20 }, // Client
    { wch: 15 }, // Montant
    { wch: 15 }, // Paiement
    { wch: 10 }, // Articles
    { wch: 12 }  // Statut
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventes');

  // Ajouter une feuille de détails si nécessaire
  const detailsData = [];
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      detailsData.push({
        'Date Vente': new Date(sale.createdAt).toLocaleDateString('fr-FR'),
        'N° Reçu': sale.receiptNumber || sale.id.substring(0, 8),
        'Produit': item.productName || item.product?.name,
        'Quantité': item.quantity,
        'Prix Unitaire': item.unitPrice,
        'Total': item.quantity * item.unitPrice
      });
    });
  });

  if (detailsData.length > 0) {
    const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
    detailsSheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Détails');
  }

  // Générer le fichier
  const fileName = `ventes_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportInventoryToExcel(products) {
  const workbook = XLSX.utils.book_new();

  const inventoryData = products.map(product => ({
    'Nom': product.name,
    'Catégorie': product.category,
    'Code-barres': product.barcode || '-',
    'Prix Achat': product.costPrice,
    'Prix Vente': product.sellingPrice,
    'Stock': product.stock,
    'Valeur Stock': product.stock * product.sellingPrice,
    'Marge': ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(1) + '%'
  }));

  const worksheet = XLSX.utils.json_to_sheet(inventoryData);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire');

  const fileName = `inventaire_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportCustomersToExcel(customers, sales) {
  const workbook = XLSX.utils.book_new();

  const customersData = customers.map(customer => {
    const customerSales = sales.filter(s => s.customerId === customer.id);
    const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0);

    return {
      'Nom': customer.name,
      'Téléphone': customer.phone || '-',
      'Email': customer.email || '-',
      'Nombre Achats': customerSales.length,
      'Total Dépensé': totalSpent,
      'Date Inscription': new Date(customer.createdAt).toLocaleDateString('fr-FR')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(customersData);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

  const fileName = `clients_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}