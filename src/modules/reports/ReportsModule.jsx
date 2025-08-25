import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, Package, Users, 
  DollarSign, BarChart3, PieChart, Filter, RefreshCw, Eye,
  Printer, Share2, Mail, FileSpreadsheet, Target, AlertCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateRealPDF, generateRealExcel } from '../../utils/ExportUtils';

const ReportsModule = () => {
  const { globalProducts, customers, salesHistory, appSettings, credits } = useApp();
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportType, setExportType] = useState('');
  
  const isDark = appSettings.darkMode;

  // Calcul des données pour les rapports (même code que précédemment)
  const reportData = useMemo(() => {
    const now = new Date();
    let startDate, endDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customDateStart ? new Date(customDateStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customDateEnd ? new Date(customDateEnd) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredSales = salesHistory.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const salesData = {
      totalRevenue: filteredSales.reduce((sum, s) => sum + s.total, 0),
      totalTransactions: filteredSales.length,
      averageBasket: filteredSales.length > 0 ? filteredSales.reduce((sum, s) => sum + s.total, 0) / filteredSales.length : 0,
      cashSales: filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      cardSales: filteredSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
      creditSales: filteredSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0)
    };

    const productSales = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            category: globalProducts.find(p => p.id === item.id)?.category || 'Non définie',
            price: item.price,
            totalSold: 0,
            totalRevenue: 0,
            profit: 0
          };
        }
        productSales[item.id].totalSold += item.quantity;
        productSales[item.id].totalRevenue += item.quantity * item.price;
        const product = globalProducts.find(p => p.id === item.id);
        if (product) {
          productSales[item.id].profit += item.quantity * (item.price - product.costPrice);
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const stockData = {
      totalProducts: globalProducts.length,
      totalStockValue: globalProducts.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
      totalSaleValue: globalProducts.reduce((sum, p) => sum + (p.stock * p.price), 0),
      lowStockProducts: globalProducts.filter(p => p.stock > 0 && p.stock <= p.minStock),
      outOfStockProducts: globalProducts.filter(p => p.stock === 0),
      overStockProducts: globalProducts.filter(p => p.stock > p.maxStock),
      categoryBreakdown: {}
    };

    globalProducts.forEach(product => {
      if (!stockData.categoryBreakdown[product.category]) {
        stockData.categoryBreakdown[product.category] = {
          count: 0,
          totalValue: 0,
          totalStock: 0
        };
      }
      stockData.categoryBreakdown[product.category].count += 1;
      stockData.categoryBreakdown[product.category].totalValue += product.stock * product.costPrice;
      stockData.categoryBreakdown[product.category].totalStock += product.stock;
    });

    const activeCustomers = new Set(filteredSales.map(s => s.customerId));
    const customerData = {
      totalCustomers: customers.filter(c => c.id !== 1).length,
      activeCustomers: activeCustomers.size,
      newCustomers: customers.filter(c => {
        const createdDate = new Date(c.createdAt || new Date());
        return createdDate >= startDate && createdDate <= endDate;
      }).length,
      topCustomers: customers
        .filter(c => c.id !== 1)
        .map(customer => ({
          ...customer,
          periodSpent: filteredSales
            .filter(s => s.customerId === customer.id)
            .reduce((sum, s) => sum + s.total, 0),
          periodTransactions: filteredSales.filter(s => s.customerId === customer.id).length
        }))
        .sort((a, b) => b.periodSpent - a.periodSpent)
        .slice(0, 10)
    };

    const creditData = {
      totalCredits: credits?.length || 0,
      pendingAmount: credits?.filter(c => c.status === 'pending' || c.status === 'partial')
        .reduce((sum, c) => sum + c.remainingAmount, 0) || 0,
      paidAmount: credits?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.originalAmount, 0) || 0,
      overdueCredits: credits?.filter(c => {
        const dueDate = new Date(c.dueDate);
        return (c.status === 'pending' || c.status === 'partial') && dueDate < new Date();
      }) || [],
      recentCredits: credits?.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      }) || []
    };

    return {
      period: { startDate, endDate },
      sales: salesData,
      products: { productSales, topProducts },
      stock: stockData,
      customers: customerData,
      credits: creditData
    };
  }, [salesHistory, globalProducts, customers, credits, dateRange, customDateStart, customDateEnd]);

  // Génération du VRAI PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    setExportType('PDF');
    
    try {
      await generateRealPDF(reportData, selectedReport, appSettings);
      
      // Notification de succès
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #10b981; color: white; padding: 15px 20px;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif; font-weight: 600;
      `;
      notification.textContent = '✅ PDF généré avec succès !';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      
      // Notification d'erreur
      const errorNotification = document.createElement('div');
      errorNotification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #ef4444; color: white; padding: 15px 20px;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif; font-weight: 600;
      `;
      errorNotification.textContent = '❌ Erreur: Installez jsPDF pour les exports PDF';
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 5000);
    } finally {
      setIsGenerating(false);
      setExportType('');
    }
  };

// Génération du VRAI Excel
 const generateExcel = async () => {
   setIsGenerating(true);
   setExportType('Excel');
   
   try {
     await generateRealExcel(reportData, selectedReport, appSettings, salesHistory, customers);
     
     // Notification de succès
     const notification = document.createElement('div');
     notification.style.cssText = `
       position: fixed; top: 20px; right: 20px; z-index: 10000;
       background: #10b981; color: white; padding: 15px 20px;
       border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
       font-family: Arial, sans-serif; font-weight: 600;
     `;
     notification.textContent = '✅ Fichier Excel généré avec succès !';
     document.body.appendChild(notification);
     
     setTimeout(() => {
       document.body.removeChild(notification);
     }, 3000);
     
   } catch (error) {
     console.error('Erreur génération Excel:', error);
     
     // Notification d'erreur
     const errorNotification = document.createElement('div');
     errorNotification.style.cssText = `
       position: fixed; top: 20px; right: 20px; z-index: 10000;
       background: #ef4444; color: white; padding: 15px 20px;
       border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
       font-family: Arial, sans-serif; font-weight: 600;
     `;
     errorNotification.textContent = '❌ Erreur: Installez SheetJS pour les exports Excel';
     document.body.appendChild(errorNotification);
     
     setTimeout(() => {
       document.body.removeChild(errorNotification);
     }, 5000);
   } finally {
     setIsGenerating(false);
     setExportType('');
   }
 };

 const styles = {
   container: {
     padding: '20px',
     background: isDark ? '#1a202c' : '#f7fafc',
     minHeight: 'calc(100vh - 120px)'
   },
   header: {
     display: 'flex',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: '25px',
     flexWrap: 'wrap',
     gap: '15px'
   },
   controls: {
     background: isDark ? '#2d3748' : 'white',
     padding: '20px',
     borderRadius: '8px',
     marginBottom: '20px',
     boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
   },
   controlsGrid: {
     display: 'grid',
     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
     gap: '15px',
     alignItems: 'end'
   },
   select: {
     width: '100%',
     padding: '10px',
     border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
     borderRadius: '6px',
     background: isDark ? '#374151' : 'white',
     color: isDark ? '#f7fafc' : '#2d3748',
     fontSize: '14px'
   },
   input: {
     width: '100%',
     padding: '10px',
     border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
     borderRadius: '6px',
     background: isDark ? '#374151' : 'white',
     color: isDark ? '#f7fafc' : '#2d3748',
     fontSize: '14px'
   },
   button: {
     padding: '10px 20px',
     border: 'none',
     borderRadius: '6px',
     cursor: 'pointer',
     fontSize: '14px',
     fontWeight: '600',
     display: 'flex',
     alignItems: 'center',
     gap: '8px',
     transition: 'all 0.2s'
   },
   reportCard: {
     background: isDark ? '#2d3748' : 'white',
     padding: '20px',
     borderRadius: '8px',
     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
     marginBottom: '20px'
   },
   metricsGrid: {
     display: 'grid',
     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
     gap: '15px',
     marginBottom: '20px'
   },
   metricCard: {
     background: isDark ? '#374151' : '#f8fafc',
     padding: '15px',
     borderRadius: '6px',
     textAlign: 'center'
   }
 };

 const MetricCard = ({ label, value, icon: Icon, color = '#3b82f6' }) => (
   <div style={styles.metricCard}>
     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
       <Icon size={20} color={color} />
     </div>
     <div style={{ fontSize: '20px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748', marginBottom: '4px' }}>
       {value}
     </div>
     <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
       {label}
     </div>
   </div>
 );

 const renderSalesReport = () => {
   const { sales, products } = reportData;
   
   return (
     <div style={styles.reportCard}>
       <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: isDark ? '#f7fafc' : '#2d3748' }}>
         Rapport des Ventes
       </h3>
       
       <div style={styles.metricsGrid}>
         <MetricCard
           label="Chiffre d'Affaires"
           value={`${sales.totalRevenue.toLocaleString()} ${appSettings.currency}`}
           icon={DollarSign}
           color="#10b981"
         />
         <MetricCard
           label="Transactions"
           value={sales.totalTransactions}
           icon={BarChart3}
           color="#3b82f6"
         />
         <MetricCard
           label="Panier Moyen"
           value={`${Math.round(sales.averageBasket).toLocaleString()} ${appSettings.currency}`}
           icon={Target}
           color="#8b5cf6"
         />
       </div>

       <div style={{ marginBottom: '20px' }}>
         <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
           Répartition par Mode de Paiement
         </h4>
         <div style={styles.metricsGrid}>
           <MetricCard
             label="Espèces"
             value={`${sales.cashSales.toLocaleString()} ${appSettings.currency}`}
             icon={DollarSign}
             color="#10b981"
           />
           <MetricCard
             label="Carte"
             value={`${sales.cardSales.toLocaleString()} ${appSettings.currency}`}
             icon={BarChart3}
             color="#3b82f6"
           />
           <MetricCard
             label="Crédit"
             value={`${sales.creditSales.toLocaleString()} ${appSettings.currency}`}
             icon={FileText}
             color="#f59e0b"
           />
         </div>
       </div>

       <div>
         <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
           Top 5 Produits
         </h4>
         <div style={{ overflowX: 'auto' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}` }}>
                 <th style={{ padding: '8px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>Produit</th>
                 <th style={{ padding: '8px', textAlign: 'right', color: isDark ? '#a0aec0' : '#64748b' }}>Vendus</th>
                 <th style={{ padding: '8px', textAlign: 'right', color: isDark ? '#a0aec0' : '#64748b' }}>CA</th>
                 <th style={{ padding: '8px', textAlign: 'right', color: isDark ? '#a0aec0' : '#64748b' }}>Profit</th>
               </tr>
             </thead>
             <tbody>
               {products.topProducts.slice(0, 5).map((product, index) => (
                 <tr key={index} style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}` }}>
                   <td style={{ padding: '8px', color: isDark ? '#f7fafc' : '#2d3748' }}>{product.name}</td>
                   <td style={{ padding: '8px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>{product.totalSold}</td>
                   <td style={{ padding: '8px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>
                     {product.totalRevenue.toLocaleString()} {appSettings.currency}
                   </td>
                   <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                     {product.profit.toLocaleString()} {appSettings.currency}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
     </div>
   );
 };

 const renderStockReport = () => {
   const { stock } = reportData;
   
   return (
     <div style={styles.reportCard}>
       <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: isDark ? '#f7fafc' : '#2d3748' }}>
         Rapport des Stocks
       </h3>
       
       <div style={styles.metricsGrid}>
         <MetricCard
           label="Total Produits"
           value={stock.totalProducts}
           icon={Package}
           color="#8b5cf6"
         />
         <MetricCard
           label="Valeur Stock (Achat)"
           value={`${stock.totalStockValue.toLocaleString()} ${appSettings.currency}`}
           icon={DollarSign}
           color="#10b981"
         />
         <MetricCard
           label="Valeur Stock (Vente)"
           value={`${stock.totalSaleValue.toLocaleString()} ${appSettings.currency}`}
           icon={TrendingUp}
           color="#3b82f6"
         />
       </div>

       <div style={{ marginBottom: '20px' }}>
         <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
           Alertes Stock
         </h4>
         <div style={styles.metricsGrid}>
           <MetricCard
             label="Ruptures"
             value={stock.outOfStockProducts.length}
             icon={Package}
             color="#ef4444"
           />
           <MetricCard
             label="Stock Faible"
             value={stock.lowStockProducts.length}
             icon={Package}
             color="#f59e0b"
           />
           <MetricCard
             label="Surstock"
             value={stock.overStockProducts.length}
             icon={Package}
             color="#8b5cf6"
           />
         </div>
       </div>
     </div>
   );
 };

 const renderCustomersReport = () => {
   const { customers: customerData } = reportData;
   
   return (
     <div style={styles.reportCard}>
       <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: isDark ? '#f7fafc' : '#2d3748' }}>
         Rapport des Clients
       </h3>
       
       <div style={styles.metricsGrid}>
         <MetricCard
           label="Total Clients"
           value={customerData.totalCustomers}
           icon={Users}
           color="#3b82f6"
         />
         <MetricCard
           label="Clients Actifs"
           value={customerData.activeCustomers}
           icon={Users}
           color="#10b981"
         />
         <MetricCard
           label="Nouveaux Clients"
           value={customerData.newCustomers}
           icon={Users}
           color="#f59e0b"
         />
       </div>
     </div>
   );
 };

 const renderCreditsReport = () => {
   const { credits: creditData } = reportData;
   
   return (
     <div style={styles.reportCard}>
       <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: isDark ? '#f7fafc' : '#2d3748' }}>
         Rapport des Crédits
       </h3>
       
       <div style={styles.metricsGrid}>
         <MetricCard
           label="Total Crédits"
           value={creditData.totalCredits}
           icon={FileText}
           color="#3b82f6"
         />
         <MetricCard
           label="Montant En Cours"
           value={`${creditData.pendingAmount.toLocaleString()} ${appSettings.currency}`}
           icon={FileText}
           color="#f59e0b"
         />
         <MetricCard
           label="Montant Remboursé"
           value={`${creditData.paidAmount.toLocaleString()} ${appSettings.currency}`}
           icon={FileText}
           color="#10b981"
         />
         <MetricCard
           label="Crédits en Retard"
           value={creditData.overdueCredits.length}
           icon={FileText}
           color="#ef4444"
         />
       </div>
     </div>
   );
 };

 return (
   <div style={styles.container}>
     {/* En-tête */}
     <div style={styles.header}>
       <div>
         <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748', marginBottom: '4px' }}>
           📋 Rapports Exportables
         </h1>
         <p style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
           Générez et exportez vos rapports de gestion
         </p>
       </div>
     </div>

     {/* Contrôles */}
     <div style={styles.controls}>
       <div style={styles.controlsGrid}>
         <div>
           <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
             Type de Rapport
           </label>
           <select
             value={selectedReport}
             onChange={(e) => setSelectedReport(e.target.value)}
             style={styles.select}
           >
             <option value="sales">Rapport des Ventes</option>
             <option value="stock">Rapport des Stocks</option>
             <option value="customers">Rapport des Clients</option>
             <option value="credits">Rapport des Crédits</option>
           </select>
         </div>

         <div>
           <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
             Période
           </label>
           <select
             value={dateRange}
             onChange={(e) => setDateRange(e.target.value)}
             style={styles.select}
           >
             <option value="today">Aujourd'hui</option>
             <option value="week">7 derniers jours</option>
             <option value="month">Ce mois</option>
             <option value="quarter">Ce trimestre</option>
             <option value="year">Cette année</option>
             <option value="custom">Période personnalisée</option>
           </select>
         </div>

         {dateRange === 'custom' && (
           <>
             <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                 Date de début
               </label>
               <input
                 type="date"
                 value={customDateStart}
                 onChange={(e) => setCustomDateStart(e.target.value)}
                 style={styles.input}
               />
             </div>

             <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                 Date de fin
               </label>
               <input
                 type="date"
                 value={customDateEnd}
                 onChange={(e) => setCustomDateEnd(e.target.value)}
                 style={styles.input}
               />
             </div>
           </>
         )}

         <div style={{ display: 'flex', gap: '10px' }}>
           <button
             onClick={generatePDF}
             disabled={isGenerating}
             style={{
               ...styles.button,
               background: isGenerating && exportType === 'PDF' ? '#94a3b8' : '#ef4444',
               color: 'white',
               opacity: isGenerating && exportType === 'PDF' ? 0.7 : 1
             }}
           >
             {isGenerating && exportType === 'PDF' ? 
               <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 
               <FileText size={16} />
             }
             PDF
           </button>

           <button
             onClick={generateExcel}
             disabled={isGenerating}
             style={{
               ...styles.button,
               background: isGenerating && exportType === 'Excel' ? '#94a3b8' : '#10b981',
               color: 'white',
               opacity: isGenerating && exportType === 'Excel' ? 0.7 : 1
             }}
           >
             {isGenerating && exportType === 'Excel' ? 
               <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 
               <FileSpreadsheet size={16} />
             }
             Excel
           </button>

           <button
             onClick={() => window.print()}
             style={{
               ...styles.button,
               background: '#3b82f6',
               color: 'white'
             }}
           >
             <Printer size={16} />
             Imprimer
           </button>
         </div>
       </div>

       {isGenerating && (
         <div style={{ 
           marginTop: '15px', 
           padding: '10px', 
           background: isDark ? '#374151' : '#f0f9ff',
           borderRadius: '6px',
           display: 'flex',
           alignItems: 'center',
           gap: '10px'
         }}>
           <RefreshCw size={16} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
           <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>
             Génération du rapport {exportType} en cours...
           </span>
         </div>
       )}
     </div>

     {/* Aperçu du rapport */}
     <div>
       {selectedReport === 'sales' && renderSalesReport()}
       {selectedReport === 'stock' && renderStockReport()}
       {selectedReport === 'customers' && renderCustomersReport()}
       {selectedReport === 'credits' && renderCreditsReport()}
     </div>

     {/* Informations sur les dépendances */}
     <div style={{
       background: isDark ? '#2d3748' : '#fff7ed',
       padding: '15px',
       borderRadius: '8px',
       marginTop: '20px',
       border: `1px solid ${isDark ? '#4a5568' : '#fed7aa'}`
     }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
         <AlertCircle size={16} color="#f59e0b" />
         <h4 style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#f7fafc' : '#92400e' }}>
           Installation des Dépendances pour Exports
         </h4>
       </div>
       <ul style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#92400e', margin: 0, paddingLeft: '20px' }}>
         <li><strong>Pour PDF :</strong> <code>npm install jspdf</code></li>
         <li><strong>Pour Excel :</strong> <code>npm install xlsx</code></li>
         <li>Une fois installées, les exports fonctionneront parfaitement !</li>
       </ul>
     </div>
   </div>
 );
};

export default ReportsModule;
