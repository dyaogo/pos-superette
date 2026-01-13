import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, Calendar, DollarSign, Package, Users,
  FileText, ArrowUp, ArrowDown, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCFA, formatCFACompact } from '../../utils/currency';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedReportsModule() {
  const [period, setPeriod] = useState('month'); // today, week, month, year

  // Utiliser les données d'AppContext au lieu de charger depuis l'API
  const {
    salesHistory: allSalesData = [],
    productCatalog: allProductsData = [],
    customers: allCustomersData = [],
    currentStore,
    loading: contextLoading
  } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger uniquement les dépenses (pas disponibles dans AppContext)
  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      try {
        const expensesRes = await fetch('/api/accounting/expenses');
        const expensesData = await expensesRes.json();

        const expensesArray = Array.isArray(expensesData?.expenses) ? expensesData.expenses
                             : Array.isArray(expensesData) ? expensesData
                             : [];
        setExpenses(expensesArray);
      } catch (error) {
        console.error('Error loading expenses:', error);
        toast.error('Erreur lors du chargement des dépenses');
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  // Utiliser les données d'AppContext
  const salesData = allSalesData;
  const products = allProductsData;
  const customers = allCustomersData;

  // Filtrer les données selon la période
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0);
    }

    const sales = salesData.filter(s => new Date(s.createdAt || s.date) >= startDate);
    const exp = expenses.filter(e => new Date(e.createdAt) >= startDate);

    return { sales, expenses: exp };
  }, [period, salesData, expenses]);

  // Calculer les métriques principales
  const metrics = useMemo(() => {
    const totalRevenue = filteredData.sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // ✅ Calculer la marge brute réelle basée sur les coûts des produits
    let totalCost = 0;
    filteredData.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product?.costPrice || 0;
        const quantity = item.quantity || 0;
        totalCost += costPrice * quantity;
      });
    });

    const grossMargin = totalRevenue - totalCost;
    const grossMarginRate = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // ✅ Bénéfice Net = Marge Brute - Dépenses
    const profit = grossMargin - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      grossMargin,
      grossMarginRate,
      totalCost
    };
  }, [filteredData, products]);

  // Préparer données pour graphique des ventes par jour
  const salesByDay = useMemo(() => {
    const grouped = {};

    filteredData.sales.forEach(sale => {
      const date = new Date(sale.createdAt || sale.date);
      const key = date.toISOString().split('T')[0];

      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, transactions: 0 };
      }

      grouped[key].revenue += sale.total || 0;
      grouped[key].transactions += 1;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData.sales]);

  // Top 5 produits
  const topProducts = useMemo(() => {
    const productSales = {};

    filteredData.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const id = item.productId;
        if (!productSales[id]) {
          productSales[id] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[id].quantity += item.quantity;
        productSales[id].revenue += item.total || (item.unitPrice * item.quantity);
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData.sales]);

  // Top 5 clients
  const topCustomers = useMemo(() => {
    const customerStats = {};

    filteredData.sales.forEach(sale => {
      if (sale.customerId) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (!customerStats[sale.customerId]) {
          customerStats[sale.customerId] = {
            name: customer?.name || 'Client inconnu',
            total: 0,
            transactions: 0,
          };
        }
        customerStats[sale.customerId].total += sale.total || 0;
        customerStats[sale.customerId].transactions += 1;
      }
    });

    return Object.values(customerStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData.sales, customers]);

  // Répartition des ventes par catégorie
  const salesByCategory = useMemo(() => {
    const categoryStats = {};

    filteredData.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Non catégorisé';

        if (!categoryStats[category]) {
          categoryStats[category] = { name: category, value: 0 };
        }
        categoryStats[category].value += item.total || (item.unitPrice * item.quantity);
      });
    });

    return Object.values(categoryStats);
  }, [filteredData.sales, products]);

  // Export Excel avec formatage moderne
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // === Feuille Résumé avec formatage ===
    const summaryData = [
      ['RAPPORT DE VENTES - ANALYSE COMPLETE'],
      [''],
      ['Période', period === 'today' ? "Aujourd'hui" : period === 'week' ? '7 derniers jours' : period === 'month' ? '30 derniers jours' : '12 derniers mois'],
      ['Magasin', currentStore?.name || 'Tous les magasins'],
      ['Date de génération', new Date().toLocaleString('fr-FR')],
      [''],
      ['COMPTE DE RESULTAT'],
      ['Indicateur', 'Montant', 'Détails'],
      ['Chiffre d\'affaires', Math.round(metrics.totalRevenue), 'FCFA'],
      ['Coût des marchandises', Math.round(metrics.totalCost), 'FCFA'],
      ['Marge Brute', Math.round(metrics.grossMargin), `${metrics.grossMarginRate.toFixed(1)}% du CA`],
      ['Dépenses d\'exploitation', Math.round(metrics.totalExpenses), 'FCFA'],
      ['Bénéfice Net', Math.round(metrics.profit), metrics.profit >= 0 ? 'Positif' : 'Négatif'],
      [''],
      ['INDICATEURS DE PERFORMANCE'],
      ['Métrique', 'Valeur'],
      ['Nombre de transactions', filteredData.sales.length],
      ['Panier moyen', Math.round(metrics.totalRevenue / (filteredData.sales.length || 1)) + ' FCFA'],
      ['Taux de marge', metrics.grossMarginRate.toFixed(1) + '%'],
      ['Rentabilité', metrics.totalRevenue > 0 ? ((metrics.profit / metrics.totalRevenue) * 100).toFixed(1) + '%' : '0%'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Styles pour Excel (largeur des colonnes)
    wsSummary['!cols'] = [
      { wch: 30 }, // Colonne A
      { wch: 20 }, // Colonne B
      { wch: 25 }  // Colonne C
    ];

    // Fusionner la cellule titre
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Titre principal
      { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } }, // COMPTE DE RESULTAT
      { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } } // INDICATEURS DE PERFORMANCE
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resume');

    // === Feuille Top Produits ===
    const productsData = [
      ['TOP 5 PRODUITS LES PLUS VENDUS'],
      [''],
      ['Rang', 'Nom du Produit', 'Quantité Vendue', 'Chiffre d\'affaires (FCFA)', 'Part du CA'],
      ...topProducts.map((p, idx) => [
        `#${idx + 1}`,
        p.name,
        p.quantity,
        Math.round(p.revenue),
        ((p.revenue / metrics.totalRevenue) * 100).toFixed(1) + '%'
      ]),
      [''],
      ['TOTAL', '', topProducts.reduce((sum, p) => sum + p.quantity, 0), Math.round(topProducts.reduce((sum, p) => sum + p.revenue, 0)), '']
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    wsProducts['!cols'] = [
      { wch: 8 },  // Rang
      { wch: 35 }, // Nom
      { wch: 15 }, // Quantité
      { wch: 20 }, // CA
      { wch: 12 }  // Part
    ];
    wsProducts['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produits');

    // === Feuille Top Clients ===
    if (topCustomers.length > 0) {
      const customersData = [
        ['TOP 5 CLIENTS'],
        [''],
        ['Rang', 'Nom du Client', 'Nombre d\'achats', 'Total dépensé (FCFA)', 'Panier moyen'],
        ...topCustomers.map((c, idx) => [
          `#${idx + 1}`,
          c.name,
          c.transactions,
          Math.round(c.total),
          Math.round(c.total / c.transactions) + ' FCFA'
        ])
      ];
      const wsCustomers = XLSX.utils.aoa_to_sheet(customersData);
      wsCustomers['!cols'] = [
        { wch: 8 },  // Rang
        { wch: 30 }, // Nom
        { wch: 18 }, // Nombre
        { wch: 20 }, // Total
        { wch: 15 }  // Panier moyen
      ];
      wsCustomers['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Top Clients');
    }

    // === Feuille Evolution des ventes ===
    const salesDailyData = [
      ['EVOLUTION DES VENTES'],
      [''],
      ['Date', 'Chiffre d\'affaires (FCFA)', 'Nombre de transactions', 'Panier moyen (FCFA)'],
      ...salesByDay.map(d => [
        d.date,
        Math.round(d.revenue),
        d.transactions,
        d.transactions > 0 ? Math.round(d.revenue / d.transactions) : 0
      ]),
      [''],
      ['TOTAL', Math.round(salesByDay.reduce((sum, d) => sum + d.revenue, 0)), salesByDay.reduce((sum, d) => sum + d.transactions, 0), '']
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesDailyData);
    wsSales['!cols'] = [
      { wch: 15 }, // Date
      { wch: 20 }, // CA
      { wch: 20 }, // Transactions
      { wch: 18 }  // Panier moyen
    ];
    wsSales['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, wsSales, 'Evolution');

    // === Feuille Ventes par catégorie ===
    const categoryData = [
      ['VENTES PAR CATEGORIE'],
      [''],
      ['Catégorie', 'Chiffre d\'affaires (FCFA)', 'Part du CA'],
      ...salesByCategory.map(c => [
        c.name,
        Math.round(c.value),
        ((c.value / metrics.totalRevenue) * 100).toFixed(1) + '%'
      ])
    ];
    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    wsCategory['!cols'] = [
      { wch: 25 }, // Catégorie
      { wch: 25 }, // CA
      { wch: 15 }  // Part
    ];
    wsCategory['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Categories');

    const fileName = `Rapport_${currentStore?.name || 'Tous'}_${period}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Rapport Excel exporté avec succès');
  };

  // Export PDF moderne et professionnel
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // === En-tête avec fond coloré ===
    doc.setFillColor(59, 130, 246); // Bleu
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('RAPPORT DE VENTES', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const periodLabel = period === 'today' ? "Aujourd'hui" :
                        period === 'week' ? '7 derniers jours' :
                        period === 'month' ? '30 derniers jours' : '12 derniers mois';
    doc.text(`Période: ${periodLabel}`, 105, 30, { align: 'center' });
    if (currentStore) {
      doc.text(`Magasin: ${currentStore.name}`, 105, 36, { align: 'center' });
    }
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 105, 41, { align: 'center' });

    yPos = 55;
    doc.setTextColor(0, 0, 0);

    // === Section Compte de Résultat ===
    doc.setFillColor(241, 245, 249); // Gris clair
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('COMPTE DE RESULTAT', 20, yPos);
    yPos += 12;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Montant (FCFA)', 'Détails']],
      body: [
        ['Chiffre d\'affaires', Math.round(metrics.totalRevenue).toLocaleString('fr-FR'), '100%'],
        ['Coût des marchandises', Math.round(metrics.totalCost).toLocaleString('fr-FR'), `${(100 - metrics.grossMarginRate).toFixed(1)}%`],
        ['Marge Brute', Math.round(metrics.grossMargin).toLocaleString('fr-FR'), `${metrics.grossMarginRate.toFixed(1)}%`],
        ['Dépenses d\'exploitation', Math.round(metrics.totalExpenses).toLocaleString('fr-FR'), metrics.totalRevenue > 0 ? `${((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1)}%` : '0%'],
        ['Bénéfice Net', Math.round(metrics.profit).toLocaleString('fr-FR'), metrics.totalRevenue > 0 ? `${((metrics.profit / metrics.totalRevenue) * 100).toFixed(1)}%` : '0%'],
      ],
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 40, halign: 'center' }
      },
      didParseCell: (data) => {
        // Colorer la ligne du bénéfice
        if (data.row.index === 4) {
          if (metrics.profit >= 0) {
            data.cell.styles.textColor = [16, 185, 129]; // Vert
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Rouge
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // === Section Indicateurs Clés ===
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('INDICATEURS CLES', 20, yPos);
    yPos += 12;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [['Métrique', 'Valeur']],
      body: [
        ['Nombre de transactions', filteredData.sales.length.toString()],
        ['Panier moyen', Math.round(metrics.totalRevenue / (filteredData.sales.length || 1)).toLocaleString('fr-FR') + ' FCFA'],
        ['Taux de marge brute', metrics.grossMarginRate.toFixed(1) + '%'],
        ['Rentabilité nette', metrics.totalRevenue > 0 ? ((metrics.profit / metrics.totalRevenue) * 100).toFixed(1) + '%' : '0%'],
      ],
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'right', textColor: [59, 130, 246], fontStyle: 'bold' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // === Top 5 Produits ===
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TOP 5 PRODUITS', 20, yPos);
    yPos += 12;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produit', 'Qté', 'CA (FCFA)', 'Part']],
      body: topProducts.map((p, idx) => [
        (idx + 1).toString(),
        p.name,
        p.quantity.toString(),
        Math.round(p.revenue).toLocaleString('fr-FR'),
        ((p.revenue / metrics.totalRevenue) * 100).toFixed(1) + '%'
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      },
      didParseCell: (data) => {
        // Surligner le produit #1
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [220, 252, 231]; // Vert très clair
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // === Top 5 Clients (si disponible) ===
    if (topCustomers.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos - 5, 182, 10, 'F');
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('TOP 5 CLIENTS', 20, yPos);
      yPos += 12;

      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Client', 'Achats', 'Total (FCFA)', 'Panier moyen']],
        body: topCustomers.map((c, idx) => [
          (idx + 1).toString(),
          c.name,
          c.transactions.toString(),
          Math.round(c.total).toLocaleString('fr-FR'),
          Math.round(c.total / c.transactions).toLocaleString('fr-FR')
        ]),
        headStyles: {
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [245, 158, 11] },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });
    }

    // === Pied de page ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Généré par POS Superette', 195, 290, { align: 'right' });
    }

    const fileName = `Rapport_${currentStore?.name || 'Tous'}_${period}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    toast.success('Rapport PDF exporté avec succès');
  };

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-lg text-secondary">Chargement des rapports...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: window.innerWidth < 768 ? 'var(--space-md)' : 'var(--space-lg)',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
        marginBottom: 'var(--space-lg)',
        gap: 'var(--space-md)',
      }}>
        <div>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '20px' : '28px',
            fontWeight: '700',
            marginBottom: 'var(--space-sm)'
          }}>
            📊 Rapports Avancés
          </h1>
          <p className="text-secondary" style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
            Analyses détaillées et visualisations
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 480 ? 'column' : 'row',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}>
          {/* Sélecteur période */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field"
            style={{
              width: window.innerWidth < 768 ? '100%' : 'auto',
              minWidth: window.innerWidth < 768 ? '0' : '150px',
            }}
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">12 derniers mois</option>
          </select>

          {/* Boutons Export */}
          <button
            onClick={exportToExcel}
            className="btn btn-success flex items-center gap-sm"
            style={{
              justifyContent: 'center',
              flex: window.innerWidth < 480 ? '1' : '0 1 auto',
            }}
          >
            <Download size={18} />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-primary flex items-center gap-sm"
            style={{
              justifyContent: 'center',
              flex: window.innerWidth < 480 ? '1' : '0 1 auto',
            }}
          >
            <FileText size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Info magasin sélectionné */}
      {currentStore && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          marginBottom: 'var(--space-lg)',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text-primary)'
            }}>
              Magasin: {currentStore.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)'
            }}>
              Données filtrées pour ce magasin uniquement
            </div>
          </div>
        </div>
      )}

      {/* Métriques KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 480
          ? '1fr'
          : window.innerWidth < 768
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        <div className="card">
          <div className="flex items-center gap-md mb-sm">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} color="var(--color-primary)" />
            </div>
            <div>
              <div className="text-sm text-muted">Chiffre d'affaires</div>
              <div className="text-2xl font-bold">{formatCFA(metrics.totalRevenue)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-sm">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={24} color="var(--color-danger)" />
            </div>
            <div>
              <div className="text-sm text-muted">Dépenses</div>
              <div className="text-2xl font-bold">{formatCFA(metrics.totalExpenses)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-sm">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="var(--color-success)" />
            </div>
            <div>
              <div className="text-sm text-muted">Bénéfice</div>
              <div className="text-2xl font-bold" style={{ color: metrics.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {formatCFA(metrics.profit)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-sm">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#8b5cf6" />
            </div>
            <div>
              <div className="text-sm text-muted">Marge Brute</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                {formatCFA(metrics.grossMargin)}
              </div>
              <div className="text-xs text-muted mt-1">{metrics.grossMarginRate.toFixed(1)}% du CA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)'
      }}>
        {/* Évolution des ventes */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-md">📈 Évolution des Ventes</h3>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
            <LineChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCFA(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Chiffre d'affaires" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ventes par catégorie */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-md">🎯 Ventes par Catégorie</h3>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
            <PieChart>
              <Pie
                data={salesByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={window.innerWidth < 768 ? 80 : 100}
                label={window.innerWidth < 768 ? false : ((entry) => `${entry.name}: ${((entry.value / metrics.totalRevenue) * 100).toFixed(1)}%`)}
              >
                {salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCFA(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Produits & Clients */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        {/* Top Produits */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-md flex items-center gap-sm">
            <Package size={20} />
            🏆 Top 5 Produits
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {topProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-md border rounded-md"
                style={{ background: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'var(--color-bg)' }}
              >
                <div className="flex items-center gap-md">
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted">{product.quantity} unités vendues</div>
                  </div>
                </div>
                <div className="font-bold">{formatCFA(product.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-md flex items-center gap-sm">
            <Users size={20} />
            🏆 Top 5 Clients
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-md border rounded-md"
                  style={{ background: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'var(--color-bg)' }}
                >
                  <div className="flex items-center gap-md">
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted">{customer.transactions} transactions</div>
                    </div>
                  </div>
                  <div className="font-bold">{formatCFA(customer.total)}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted py-lg">Aucun client avec compte</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
