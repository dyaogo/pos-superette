import React, { useState } from 'react';
import { ClipboardList, Save, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { addInventoryRecord } from '../../services/inventory.service';

const PhysicalInventory = () => {
  const { globalProducts, setGlobalProducts, appSettings } = useApp();
  const [inventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  
  const isDark = appSettings.darkMode;
  
  // Initialiser les comptages
  const startInventory = () => {
    const initialCounts = {};
    globalProducts.forEach(product => {
      initialCounts[product.id] = product.stock;
    });
    setCounts(initialCounts);
  };
  
  // Calculer les différences
  const calculateDifferences = () => {
    return globalProducts.map(product => {
      const counted = parseInt(counts[product.id] || 0);
      const difference = counted - product.stock;
      const percentDiff = product.stock > 0 ? (difference / product.stock * 100).toFixed(1) : 0;
      
      return {
        ...product,
        counted,
        difference,
        percentDiff,
        note: notes[product.id] || ''
      };
    }).filter(p => p.difference !== 0);
  };
  
  // Appliquer l'inventaire
  const applyInventory = () => {
    const differences = calculateDifferences();
    
    if (differences.length === 0) {
      alert('Aucune différence détectée');
      return;
    }
    
    if (window.confirm(`Voulez-vous appliquer ${differences.length} ajustement(s) ?`)) {
      const updatedProducts = globalProducts.map(product => {
        const counted = parseInt(counts[product.id] || product.stock);
        return { ...product, stock: counted };
      });
      
      setGlobalProducts(updatedProducts);
      
      // Sauvegarder l'historique de l'inventaire
      const inventoryRecord = {
        date: inventoryDate,
        differences,
        appliedAt: new Date().toISOString()
      };

      addInventoryRecord(inventoryRecord);
      
      alert('Inventaire appliqué avec succès!');
      setShowSummary(true);
    }
  };
  
  if (!Object.keys(counts).length) {
    startInventory();
  }
  
  const differences = calculateDifferences();
  const totalDifferenceValue = differences.reduce((sum, d) => sum + (d.difference * d.costPrice), 0);
  
  return (
    <div style={{
      padding: '20px',
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      marginTop: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: isDark ? '#f7fafc' : '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ClipboardList size={24} />
            Inventaire Physique
          </h2>
          <p style={{ color: isDark ? '#a0aec0' : '#718096', fontSize: '14px' }}>
            Date: {new Date(inventoryDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        <button
          onClick={applyInventory}
          style={{
            padding: '10px 20px',
            background: differences.length > 0 ? '#10b981' : '#94a3b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: differences.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          disabled={differences.length === 0}
        >
          <Save size={18} />
          Appliquer l'inventaire
        </button>
      </div>
      
      {/* Résumé des différences */}
      {differences.length > 0 && (
        <div style={{
          background: totalDifferenceValue < 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${totalDifferenceValue < 0 ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {totalDifferenceValue < 0 ? 
                <AlertTriangle size={20} color="#ef4444" /> : 
                <Check size={20} color="#10b981" />
              }
              <span style={{ fontWeight: '600', color: totalDifferenceValue < 0 ? '#991b1b' : '#166534' }}>
                {differences.length} différence(s) détectée(s)
              </span>
            </div>
            <span style={{ fontWeight: 'bold', color: totalDifferenceValue < 0 ? '#ef4444' : '#10b981' }}>
              Impact: {totalDifferenceValue.toLocaleString()} {appSettings.currency}
            </span>
          </div>
        </div>
      )}
      
      {/* Tableau de comptage */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}` }}>
              <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                Produit
              </th>
              <th style={{ padding: '10px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' }}>
                Stock Système
              </th>
              <th style={{ padding: '10px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' }}>
                Comptage Physique
              </th>
              <th style={{ padding: '10px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' }}>
                Différence
              </th>
              <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {globalProducts.map(product => {
              const counted = parseInt(counts[product.id] || 0);
              const difference = counted - product.stock;
              
              return (
                <tr key={product.id} style={{ 
                  borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}`,
                  background: difference !== 0 ? (difference > 0 ? '#f0fdf4' : '#fef2f2') : 'transparent'
                }}>
                  <td style={{ padding: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    <div style={{ fontWeight: '600' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096' }}>
                      {product.sku}
                    </div>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    {product.stock}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={counts[product.id] || ''}
                      onChange={(e) => setCounts({...counts, [product.id]: e.target.value})}
                      style={{
                        width: '80px',
                        padding: '5px',
                        textAlign: 'center',
                        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        borderRadius: '4px',
                        background: isDark ? '#374151' : 'white',
                        color: isDark ? '#f7fafc' : '#2d3748'
                      }}
                    />
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    color: difference > 0 ? '#10b981' : difference < 0 ? '#ef4444' : isDark ? '#a0aec0' : '#718096'
                  }}>
                    {difference > 0 ? '+' : ''}{difference}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <input
                      type="text"
                      placeholder="Note..."
                      value={notes[product.id] || ''}
                      onChange={(e) => setNotes({...notes, [product.id]: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '5px',
                        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        borderRadius: '4px',
                        background: isDark ? '#374151' : 'white',
                        color: isDark ? '#f7fafc' : '#2d3748'
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Résumé après application */}
      {showSummary && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: isDark ? '#374151' : '#f7fafc',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: isDark ? '#f7fafc' : '#2d3748', marginBottom: '10px' }}>
            Résumé de l'inventaire
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div>
              <span style={{ color: isDark ? '#a0aec0' : '#718096' }}>Produits ajustés: </span>
              <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                {differences.length}
              </span>
            </div>
            <div>
              <span style={{ color: isDark ? '#a0aec0' : '#718096' }}>Impact financier: </span>
              <span style={{ fontWeight: '600', color: totalDifferenceValue < 0 ? '#ef4444' : '#10b981' }}>
                {totalDifferenceValue.toLocaleString()} {appSettings.currency}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalInventory;
