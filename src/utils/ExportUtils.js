// ExportUtils.js - Utilitaires d'export PDF et Excel réels

// Pour PDF - Utilisation de jsPDF
const generateRealPDF = async (reportData, reportType, appSettings) => {
  // Dynamically import jsPDF
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;
  
  // Configuration des polices
  doc.setFont('helvetica');
  
  // En-tête du rapport
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Bleu
  doc.text(`Rapport ${getReportTitle(reportType)}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(appSettings.storeName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const dateStr = `Période: du ${reportData.period.startDate.toLocaleDateString('fr-FR')} au ${reportData.period.endDate.toLocaleDateString('fr-FR')}`;
  doc.text(dateStr, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  const generatedStr = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
  doc.text(generatedStr, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Ligne de séparation
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;
  
  // Contenu selon le type de rapport
  switch(reportType) {
    case 'sales':
      yPosition = addSalesContent(doc, reportData, yPosition, pageWidth, appSettings);
      break;
    case 'stock':
      yPosition = addStockContent(doc, reportData, yPosition, pageWidth, appSettings);
      break;
    case 'customers':
      yPosition = addCustomersContent(doc, reportData, yPosition, pageWidth, appSettings);
      break;
    case 'credits':
      yPosition = addCreditsContent(doc, reportData, yPosition, pageWidth, appSettings);
      break;
  }
  
  // Pied de page
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Rapport généré automatiquement par ${appSettings.storeName} - Système POS`, pageWidth / 2, footerY, { align: 'center' });
  
  // Sauvegarde
  const fileName = `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Fonction pour ajouter le contenu des ventes
const addSalesContent = (doc, reportData, yPosition, pageWidth, appSettings) => {
  const { sales, products } = reportData;
  
  // Métriques principales
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Résumé des Ventes', 20, yPosition);
  yPosition += 15;
  
  // Tableau des métriques
  const metrics = [
    ['Chiffre d\'Affaires Total', `${sales.totalRevenue.toLocaleString()} ${appSettings.currency}`],
    ['Nombre de Transactions', sales.totalTransactions.toString()],
    ['Panier Moyen', `${Math.round(sales.averageBasket).toLocaleString()} ${appSettings.currency}`],
    ['Ventes Espèces', `${sales.cashSales.toLocaleString()} ${appSettings.currency}`],
    ['Ventes Carte', `${sales.cardSales.toLocaleString()} ${appSettings.currency}`],
    ['Ventes Crédit', `${sales.creditSales.toLocaleString()} ${appSettings.currency}`]
  ];
  
  doc.setFontSize(10);
  metrics.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ':', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, 120, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Top Produits
  if (products.topProducts.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Top 5 Produits', 20, yPosition);
    yPosition += 15;
    
    // En-têtes du tableau
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Produit', 20, yPosition);
    doc.text('Vendus', 100, yPosition);
    doc.text('CA', 130, yPosition);
    doc.text('Profit', 160, yPosition);
    yPosition += 10;
    
    // Données
    doc.setTextColor(0, 0, 0);
    products.topProducts.slice(0, 5).forEach((product, index) => {
      const productName = product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name;
      doc.text(`${index + 1}. ${productName}`, 20, yPosition);
      doc.text(product.totalSold.toString(), 100, yPosition);
      doc.text(`${product.totalRevenue.toLocaleString()}`, 130, yPosition);
      doc.text(`${product.profit.toLocaleString()}`, 160, yPosition);
      yPosition += 8;
    });
  }
  
  return yPosition;
};

// Fonction pour ajouter le contenu des stocks
const addStockContent = (doc, reportData, yPosition, pageWidth, appSettings) => {
  const { stock } = reportData;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('État des Stocks', 20, yPosition);
  yPosition += 15;
  
  const metrics = [
    ['Total Produits', stock.totalProducts.toString()],
    ['Valeur Stock (Achat)', `${stock.totalStockValue.toLocaleString()} ${appSettings.currency}`],
    ['Valeur Stock (Vente)', `${stock.totalSaleValue.toLocaleString()} ${appSettings.currency}`],
    ['Produits en Rupture', stock.outOfStockProducts.length.toString()],
    ['Produits en Stock Faible', stock.lowStockProducts.length.toString()],
    ['Produits en Surstock', stock.overStockProducts.length.toString()]
  ];
  
  doc.setFontSize(10);
  metrics.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ':', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, 120, yPosition);
    yPosition += 8;
  });
  
  return yPosition;
};

// Fonction pour ajouter le contenu des clients
const addCustomersContent = (doc, reportData, yPosition, pageWidth, appSettings) => {
  const { customers } = reportData;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Rapport des Clients', 20, yPosition);
  yPosition += 15;
  
  const metrics = [
    ['Total Clients', customers.totalCustomers.toString()],
    ['Clients Actifs', customers.activeCustomers.toString()],
    ['Nouveaux Clients', customers.newCustomers.toString()]
  ];
  
  doc.setFontSize(10);
  metrics.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ':', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, 120, yPosition);
    yPosition += 8;
  });
  
  return yPosition;
};

// Fonction pour ajouter le contenu des crédits
const addCreditsContent = (doc, reportData, yPosition, pageWidth, appSettings) => {
  const { credits } = reportData;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Rapport des Crédits', 20, yPosition);
  yPosition += 15;
  
  const metrics = [
    ['Total Crédits', credits.totalCredits.toString()],
    ['Montant En Cours', `${credits.pendingAmount.toLocaleString()} ${appSettings.currency}`],
    ['Montant Remboursé', `${credits.paidAmount.toLocaleString()} ${appSettings.currency}`],
    ['Crédits en Retard', credits.overdueCredits.length.toString()]
  ];
  
  doc.setFontSize(10);
  metrics.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ':', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, 120, yPosition);
    yPosition += 8;
  });
  
  return yPosition;
};

// Pour Excel - Utilisation de SheetJS
const generateRealExcel = async (reportData, reportType, appSettings, salesHistory, customers) => {
  // Dynamically import SheetJS
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();
  
  switch(reportType) {
    case 'sales':
      addSalesSheet(workbook, XLSX, reportData, salesHistory, customers, appSettings);
      break;
    case 'stock':
      addStockSheet(workbook, XLSX, reportData, appSettings);
      break;
    case 'customers':
      addCustomersSheet(workbook, XLSX, reportData, appSettings);
      break;
    case 'credits':
      addCreditsSheet(workbook, XLSX, reportData, customers, appSettings);
      break;
  }
  
  // Sauvegarde
  const fileName = `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Feuille des ventes pour Excel
const addSalesSheet = (workbook, XLSX, reportData, salesHistory, customers, appSettings) => {
  const { period } = reportData;
  
  // Filtrer les ventes de la période
  const filteredSales = salesHistory.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= period.startDate && saleDate <= period.endDate;
  });
  
  // Préparer les données
  const salesData = filteredSales.map(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const itemsList = sale.items.map(item => `${item.name} (${item.quantity})`).join('; ');
    
    return {
      'Date': new Date(sale.date).toLocaleDateString('fr-FR'),
      'Numéro Reçu': sale.receiptNumber,
      'Client': customer?.name || 'Client Comptant',
      'Montant': sale.total,
      'Mode Paiement': sale.paymentMethod === 'cash' ? 'Espèces' : 
                       sale.paymentMethod === 'card' ? 'Carte' : 'Crédit',
      'Articles': itemsList,
      'Monnaie': sale.change || 0
    };
  });
  
  // Créer la feuille
  const worksheet = XLSX.utils.json_to_sheet(salesData);
  
  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // Numéro Reçu
    { wch: 20 }, // Client
    { wch: 12 }, // Montant
    { wch: 12 }, // Mode Paiement
    { wch: 40 }, // Articles
    { wch: 10 }  // Monnaie
  ];
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventes');
  
  // Ajouter une feuille de résumé
  const summaryData = [
    { 'Métrique': 'Chiffre d\'Affaires Total', 'Valeur': `${reportData.sales.totalRevenue.toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Nombre de Transactions', 'Valeur': reportData.sales.totalTransactions },
    { 'Métrique': 'Panier Moyen', 'Valeur': `${Math.round(reportData.sales.averageBasket).toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Ventes Espèces', 'Valeur': `${reportData.sales.cashSales.toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Ventes Carte', 'Valeur': `${reportData.sales.cardSales.toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Ventes Crédit', 'Valeur': `${reportData.sales.creditSales.toLocaleString()} ${appSettings.currency}` }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
};

// Feuille des stocks pour Excel
const addStockSheet = (workbook, XLSX, reportData, appSettings) => {
  const { stock } = reportData;
  
  // Données par catégorie
  const categoryData = Object.entries(stock.categoryBreakdown).map(([category, data]) => ({
    'Catégorie': category,
    'Nombre de Produits': data.count,
    'Stock Total': data.totalStock,
    'Valeur': `${data.totalValue.toLocaleString()} ${appSettings.currency}`
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(categoryData);
  worksheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stocks par Catégorie');
  
  // Résumé
  const summaryData = [
    { 'Métrique': 'Total Produits', 'Valeur': stock.totalProducts },
    { 'Métrique': 'Valeur Stock (Achat)', 'Valeur': `${stock.totalStockValue.toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Valeur Stock (Vente)', 'Valeur': `${stock.totalSaleValue.toLocaleString()} ${appSettings.currency}` },
    { 'Métrique': 'Produits en Rupture', 'Valeur': stock.outOfStockProducts.length },
    { 'Métrique': 'Produits en Stock Faible', 'Valeur': stock.lowStockProducts.length }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé Stocks');

  const allProductsData = (stock.products || []).map(p => ({
    'Nom': p.name,
    'Stock': p.stock,
    'Prix': `${p.price?.toLocaleString()} ${appSettings.currency}`,
    'Valeur': `${((p.stock || 0) * (p.price || 0)).toLocaleString()} ${appSettings.currency}`,
    'Catégorie': p.category || ''
  }));
  const allSheet = XLSX.utils.json_to_sheet(allProductsData);
  allSheet['!cols'] = [
    { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(workbook, allSheet, 'Tous les produits');

  const lowData = (stock.lowStockProducts || []).map(p => ({
    'Produit': p.name,
    'Stock': p.stock,
    'Seuil Min': p.minStock,
    'Prix Achat': `${p.costPrice?.toLocaleString()} ${appSettings.currency}`
  }));
  const lowSheet = XLSX.utils.json_to_sheet(lowData);
  XLSX.utils.book_append_sheet(workbook, lowSheet, 'Stock Faible');
};

// Feuille des clients pour Excel
const addCustomersSheet = (workbook, XLSX, reportData, appSettings) => {
  const { customers } = reportData;
  
  const customersData = customers.topCustomers.map((customer, index) => ({
    'Rang': index + 1,
    'Nom': customer.name,
    'Téléphone': customer.phone || '',
    'Email': customer.email || '',
    'Achats Période': `${customer.periodSpent.toLocaleString()} ${appSettings.currency}`,
    'Transactions Période': customer.periodTransactions,
    'Total Historique': `${customer.totalPurchases.toLocaleString()} ${appSettings.currency}`,
    'Points Fidélité': customer.points
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(customersData);
  worksheet['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, 
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Clients');
};

// Feuille des crédits pour Excel
const addCreditsSheet = (workbook, XLSX, reportData, customers, appSettings) => {
  const { credits } = reportData;
  
  const creditsData = credits.recentCredits.map(credit => {
    const customer = customers.find(c => c.id === credit.customerId);
    const isOverdue = new Date(credit.dueDate) < new Date() && credit.status !== 'paid';
    
    return {
      'Client': customer?.name || 'Client inconnu',
      'Montant Original': `${credit.originalAmount.toLocaleString()} ${appSettings.currency}`,
      'Montant Restant': `${credit.remainingAmount.toLocaleString()} ${appSettings.currency}`,
      'Date Création': new Date(credit.createdAt).toLocaleDateString('fr-FR'),
      'Date Échéance': new Date(credit.dueDate).toLocaleDateString('fr-FR'),
      'Statut': credit.status === 'paid' ? 'Payé' :
                credit.status === 'partial' ? 'Partiel' :
                isOverdue ? 'En Retard' : 'En Cours',
      'Description': credit.description || ''
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(creditsData);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Crédits');
};

// Fonction utilitaire pour les titres
const getReportTitle = (reportType) => {
  const titles = {
    'sales': 'des Ventes',
    'stock': 'des Stocks', 
    'customers': 'des Clients',
    'credits': 'des Crédits'
  };
  return titles[reportType] || 'Général';
};

// Fonction pour générer un PDF du rapport comptable
const generateAccountingReportPDF = async (reportData, periodLabel, periodType, categories = []) => {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Configuration des polices
  doc.setFont('helvetica');

  // En-tête du rapport
  doc.setFontSize(22);
  doc.setTextColor(102, 126, 234); // Couleur principale #667eea
  doc.text('RAPPORT COMPTABLE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Période
  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81);
  doc.text(periodLabel, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Date de génération
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const generatedStr = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
  doc.text(generatedStr, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Ligne de séparation
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.8);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  // ========== COMPTE DE RÉSULTAT ==========
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.text('📊 COMPTE DE RÉSULTAT', 20, yPosition);
  yPosition += 12;

  // Rectangle de fond pour le compte de résultat
  doc.setFillColor(102, 126, 234, 10);
  doc.roundedRect(15, yPosition - 5, pageWidth - 30, 82, 3, 3, 'F');

  // Chiffre d'affaires
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Chiffre d\'affaires', 20, yPosition);
  doc.setTextColor(16, 185, 129); // Vert
  doc.text(`+ ${reportData.revenue.toLocaleString()} FCFA`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 8;

  // Coût des marchandises vendues
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Coût des marchandises vendues', 25, yPosition);
  doc.setTextColor(239, 68, 68); // Rouge
  doc.text(`- ${reportData.cogs.toLocaleString()} FCFA`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne
  doc.setDrawColor(229, 231, 235);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Marge brute
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(102, 126, 234, 20);
  doc.roundedRect(18, yPosition - 6, pageWidth - 36, 10, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('= MARGE BRUTE', 20, yPosition);
  const grossProfitColor = reportData.grossProfit >= 0 ? [16, 185, 129] : [239, 68, 68];
  doc.setTextColor(...grossProfitColor);
  doc.text(`${reportData.grossProfit.toLocaleString()} FCFA (${reportData.grossMargin.toFixed(1)}%)`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 12;

  // Ligne
  doc.setDrawColor(229, 231, 235);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 8;

  // Dépenses d'exploitation
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Dépenses d\'exploitation', 25, yPosition);
  doc.setTextColor(239, 68, 68);
  doc.text(`- ${reportData.expenses.toLocaleString()} FCFA`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 8;

  // Ligne épaisse
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.8);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 12;

  // Bénéfice net
  const netProfitBg = reportData.netProfit >= 0 ? [240, 253, 244] : [254, 242, 242];
  const netProfitColor = reportData.netProfit >= 0 ? [16, 185, 129] : [239, 68, 68];
  doc.setFillColor(...netProfitBg);
  doc.roundedRect(18, yPosition - 8, pageWidth - 36, 14, 3, 3, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('= BÉNÉFICE NET', 20, yPosition);
  doc.setTextColor(...netProfitColor);
  doc.text(`${reportData.netProfit.toLocaleString()} FCFA (${reportData.netMargin.toFixed(1)}%)`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 20;

  // ========== INDICATEURS CLÉS ==========
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.text('📈 INDICATEURS CLÉS', 20, yPosition);
  yPosition += 12;

  const metrics = [
    { label: 'Nombre de ventes', value: reportData.salesCount.toString(), icon: '🛒' },
    { label: 'Articles vendus', value: reportData.itemsSold.toString(), icon: '📦' },
    { label: 'Panier moyen', value: `${reportData.averageBasket.toLocaleString()} FCFA`, icon: '💰' }
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const metricsPerRow = 3;
  const metricWidth = (pageWidth - 40) / metricsPerRow;
  let xPosition = 20;

  metrics.forEach((metric, index) => {
    // Rectangle avec bordure
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(xPosition, yPosition - 3, metricWidth - 5, 16, 2, 2, 'FD');

    // Icône et label
    doc.setTextColor(107, 114, 128);
    doc.text(metric.icon + ' ' + metric.label, xPosition + 3, yPosition + 3);

    // Valeur
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xPosition + 3, yPosition + 10);
    doc.setFont('helvetica', 'normal');

    xPosition += metricWidth;

    if ((index + 1) % metricsPerRow === 0) {
      xPosition = 20;
      yPosition += 20;
    }
  });

  if (metrics.length % metricsPerRow !== 0) {
    yPosition += 20;
  }

  yPosition += 5;

  // ========== DÉPENSES PAR CATÉGORIE ==========
  if (reportData.expensesByCategory && reportData.expensesByCategory.length > 0) {
    // Vérifier si on a assez d'espace, sinon nouvelle page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('💼 DÉPENSES PAR CATÉGORIE', 20, yPosition);
    yPosition += 12;

    doc.setFontSize(10);

    reportData.expensesByCategory.forEach((cat, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      const percentage = reportData.expenses > 0 ? (cat.total / reportData.expenses * 100) : 0;

      // Trouver le nom de la catégorie
      const category = categories.find(c => c.id === cat.categoryId);
      const categoryName = category?.name || 'Catégorie inconnue';

      // Nom de la catégorie et montant
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(`${index + 1}. ${categoryName}`, 20, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`${cat.total.toLocaleString()} FCFA (${percentage.toFixed(1)}%)`, pageWidth - 20, yPosition, { align: 'right' });

      yPosition += 5;

      // Barre de progression
      const barWidth = pageWidth - 40;
      const filledWidth = (percentage / 100) * barWidth;

      // Fond de la barre
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(20, yPosition, barWidth, 4, 2, 2, 'F');

      // Barre remplie
      doc.setFillColor(102, 126, 234);
      doc.roundedRect(20, yPosition, filledWidth, 4, 2, 2, 'F');

      yPosition += 10;
    });
  }

  // ========== PIED DE PAGE ==========
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Rapport généré automatiquement par POS Superette - Système de Gestion', pageWidth / 2, footerY, { align: 'center' });

  // Sauvegarde
  const fileName = `rapport_comptable_${periodType}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export { generateRealPDF, generateRealExcel, generateAccountingReportPDF };
