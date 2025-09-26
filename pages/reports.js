import { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Users, DollarSign, 
  Calendar, Download, Filter, BarChart3 
} from 'lucide-react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState({
    sales: { total: 0, count: 0, average: 0 },
    products: [],
    inventory: { totalValue: 0, lowStock: 0, outOfStock: 0 }
  });

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    // Charger les données selon le rapport sélectionné
    if (selectedReport === 'inventory') {
      const res = await fetch('/api/products');
      const products = await res.json();
      
      setReportData(prev => ({
        ...prev,
        products: products || [],
        inventory: {
          totalValue: products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0),
          lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
          outOfStock: products.filter(p => p.stock === 0).length
        }
      }));
    } else {
      // Données de démo pour les ventes
      setReportData(prev => ({
        ...prev,
        sales: {
          total: 450000,
          count: 48,
          average: 9375
        }
      }));
    }
  };

  const exportReport = () => {
    alert('Export en cours...');
  };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Rapports et Analyses</h1>
        <button
          onClick={exportReport}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Download size={18} />
          Exporter PDF
        </button>
      </div>

      {/* Sélecteur de rapport */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
      }}>
        <select
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '200px'
          }}
        >
          <option value="sales">Rapport des Ventes</option>
          <option value="inventory">Rapport d'Inventaire</option>
          <option value="products">Top Produits</option>
          <option value="financial">Rapport Financier</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Contenu selon le rapport sélectionné */}
      {selectedReport === 'sales' && (
        <>
          {/* KPIs Ventes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Ventes Totales</p>
                  <h2 style={{ margin: '10px 0' }}>{reportData.sales.total.toLocaleString()} FCFA</h2>
                  <p style={{ margin: 0, color: '#10b981', fontSize: '12px' }}>↑ +12% vs mois dernier</p>
                </div>
                <DollarSign size={40} color="#10b981" style={{ opacity: 0.3 }} />
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Nombre de Ventes</p>
                  <h2 style={{ margin: '10px 0' }}>{reportData.sales.count}</h2>
                  <p style={{ margin: 0, color: '#3b82f6', fontSize: '12px' }}>↑ +5 vs hier</p>
                </div>
                <BarChart3 size={40} color="#3b82f6" style={{ opacity: 0.3 }} />
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #8b5cf6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Ticket Moyen</p>
                  <h2 style={{ margin: '10px 0' }}>{reportData.sales.average.toLocaleString()} FCFA</h2>
                  <p style={{ margin: 0, color: '#8b5cf6', fontSize: '12px' }}>Stable</p>
                </div>
                <TrendingUp size={40} color="#8b5cf6" style={{ opacity: 0.3 }} />
              </div>
            </div>
          </div>

          {/* Graphique simple */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3>Évolution des Ventes (7 derniers jours)</h3>
            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '15px', marginTop: '20px' }}>
              {[65, 80, 45, 90, 75, 60, 85].map((value, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${value * 3}px`,
                      background: `linear-gradient(180deg, #3b82f6, #60a5fa)`,
                      borderRadius: '8px 8px 0 0',
                      position: 'relative'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {value}k
                    </span>
                  </div>
                  <span style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                    J-{7 - index}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedReport === 'inventory' && (
        <>
          {/* KPIs Inventaire */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #10b981'
            }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Valeur Totale Stock</p>
              <h2 style={{ margin: '10px 0' }}>{reportData.inventory.totalValue.toLocaleString()} FCFA</h2>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #f59e0b'
            }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Stock Faible</p>
              <h2 style={{ margin: '10px 0' }}>{reportData.inventory.lowStock} produits</h2>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderTop: '4px solid #ef4444'
            }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Rupture de Stock</p>
              <h2 style={{ margin: '10px 0' }}>{reportData.inventory.outOfStock} produits</h2>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3>Analyse par Catégorie</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Catégorie</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Nb Produits</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Valeur Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>État</th>
                </tr>
              </thead>
              <tbody>
                {['Boissons', 'Snacks', 'Hygiène', 'Épicerie'].map(category => {
                  const categoryProducts = reportData.products.filter(p => p.category === category);
                  const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
                  
                  return (
                    <tr key={category} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{category}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{categoryProducts.length}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{categoryValue.toLocaleString()} FCFA</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          background: '#10b98120',
                          color: '#10b981'
                        }}>
                          OK
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}