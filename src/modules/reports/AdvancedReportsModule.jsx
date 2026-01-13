import { useState, useEffect, useMemo } from 'react';
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
  const [salesData, setSalesData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/sales?limit=1000'),
        fetch('/api/accounting/expenses'),
        fetch('/api/products'),
        fetch('/api/customers'),
      ]);

      const [salesData, expensesData, productsData, customersData] = await Promise.all([
        salesRes.json(),
        expensesRes.json(),
        productsRes.json(),
        customersRes.json(),
      ]);

      // Ensure all data is properly normalized as arrays
      const salesArray = Array.isArray(salesData?.data) ? salesData.data
                        : Array.isArray(salesData) ? salesData
                        : [];
      setSalesData(salesArray);

      const expensesArray = Array.isArray(expensesData?.expenses) ? expensesData.expenses
                           : Array.isArray(expensesData) ? expensesData
                           : [];
      setExpenses(expensesArray);

      const productsArray = Array.isArray(productsData?.data) ? productsData.data
                           : Array.isArray(productsData) ? productsData
                           : [];
      setProducts(productsArray);

      const customersArray = Array.isArray(customersData?.data) ? customersData.data
                            : Array.isArray(customersData) ? customersData
                            : [];
      setCustomers(customersArray);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

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

  // Export Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Feuille Résumé
    const summaryData = [
      ['Rapport de Ventes', ''],
      ['Période', period],
      ['Date génération', new Date().toLocaleString('fr-FR')],
      [''],
      ['Métriques Principales', ''],
      ['Chiffre d\'affaires', Math.round(metrics.totalRevenue).toLocaleString('fr-FR') + ' FCFA'],
      ['Coût des marchandises vendues', Math.round(metrics.totalCost).toLocaleString('fr-FR') + ' FCFA'],
      ['Marge Brute', Math.round(metrics.grossMargin).toLocaleString('fr-FR') + ' FCFA'],
      ['Taux de Marge Brute', metrics.grossMarginRate.toFixed(1) + '%'],
      ['Dépenses', Math.round(metrics.totalExpenses).toLocaleString('fr-FR') + ' FCFA'],
      ['Bénéfice Net', Math.round(metrics.profit).toLocaleString('fr-FR') + ' FCFA'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

    // Feuille Top Produits
    const productsData = [
      ['Nom', 'Quantité Vendue', 'Chiffre d\'affaires'],
      ...topProducts.map(p => [p.name, p.quantity, Math.round(p.revenue).toLocaleString('fr-FR')]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produits');

    // Feuille Ventes par jour
    const salesDailyData = [
      ['Date', 'Chiffre d\'affaires', 'Transactions'],
      ...salesByDay.map(d => [d.date, Math.round(d.revenue).toLocaleString('fr-FR'), d.transactions]),
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesDailyData);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Ventes Quotidiennes');

    XLSX.writeFile(wb, `rapport_${period}_${Date.now()}.xlsx`);
    toast.success('Rapport Excel exporté avec succès');
  };

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rapport de Ventes', 14, 20);

    doc.setFontSize(11);
    doc.text(`Période: ${period}`, 14, 30);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 36);

    // Métriques
    doc.setFontSize(14);
    doc.text('Métriques Principales', 14, 50);
    doc.setFontSize(10);
    doc.text(`Chiffre d'affaires: ${Math.round(metrics.totalRevenue).toLocaleString('fr-FR')} FCFA`, 14, 58);
    doc.text(`Coût marchandises vendues: ${Math.round(metrics.totalCost).toLocaleString('fr-FR')} FCFA`, 14, 64);
    doc.text(`Marge Brute: ${Math.round(metrics.grossMargin).toLocaleString('fr-FR')} FCFA (${metrics.grossMarginRate.toFixed(1)}%)`, 14, 70);
    doc.text(`Dépenses: ${Math.round(metrics.totalExpenses).toLocaleString('fr-FR')} FCFA`, 14, 76);
    doc.text(`Bénéfice Net: ${Math.round(metrics.profit).toLocaleString('fr-FR')} FCFA`, 14, 82);

    // Top Produits Table
    doc.setFontSize(14);
    doc.text('Top 5 Produits', 14, 96);

    autoTable(doc, {
      startY: 101,
      head: [['Produit', 'Quantité', 'CA (FCFA)']],
      body: topProducts.map(p => [p.name, p.quantity, Math.round(p.revenue).toLocaleString('fr-FR')]),
    });

    doc.save(`rapport_${period}_${Date.now()}.pdf`);
    toast.success('Rapport PDF exporté avec succès');
  };

  if (loading) {
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
