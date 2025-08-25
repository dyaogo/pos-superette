import React, { useState, useRef, useEffect } from 'react';
import { Printer, Barcode, Download, Settings, Tag, Grid, FileText, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext'; // Utilise le bon contexte

const BarcodeSystem = () => {
  const { globalProducts, appSettings } = useApp(); // Utilise useApp au lieu de useApp
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [labelFormat, setLabelFormat] = useState('standard'); // standard, shelf, price
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [barcodeSettings, setBarcodeSettings] = useState({
    includePrice: true,
    includeName: true,
    includeStore: true,
    labelWidth: 50, // mm
    labelHeight: 30, // mm
    fontSize: 10
  });
  
  const printRef = useRef();
  const isDark = appSettings.darkMode;

  // Générer le code-barres en format texte (simulation)
  const generateBarcodeText = (code) => {
    // Dans une vraie application, utilisez une librairie comme JsBarcode
    return `||| ${code} |||`;
  };

  // Générer le code EAN-13 si absent
  const generateEAN13 = (productId) => {
    const baseCode = String(productId).padStart(12, '0');
    // Calcul simplifié du checksum EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(baseCode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return baseCode + checksum;
  };

  // Sélectionner/désélectionner un produit
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Sélectionner tous les produits
  const selectAllProducts = () => {
    if (selectedProducts.length === globalProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(globalProducts.map(p => p.id));
    }
  };

  // Imprimer les étiquettes
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Étiquettes - ${appSettings.storeName}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .label-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, ${barcodeSettings.labelWidth}mm);
              gap: 2mm;
              padding: 5mm;
            }
            .label {
              border: 1px solid #ddd;
              padding: 2mm;
              height: ${barcodeSettings.labelHeight}mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-size: ${barcodeSettings.fontSize}pt;
              page-break-inside: avoid;
            }
            .barcode {
              font-family: 'Libre Barcode 128', monospace;
              font-size: 24pt;
              text-align: center;
              margin: 2mm 0;
            }
            .product-name {
              font-weight: bold;
              text-align: center;
              font-size: ${barcodeSettings.fontSize}pt;
            }
            .price {
              text-align: center;
              font-weight: bold;
              font-size: ${barcodeSettings.fontSize + 2}pt;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Exporter les codes-barres en CSV
  const exportBarcodes = () => {
    const csv = [
      ['SKU', 'Nom', 'Code-barres', 'Prix', 'Stock', 'Catégorie'],
      ...globalProducts.map(p => [
        p.sku,
        p.name,
        p.barcode || generateEAN13(p.id),
        p.price,
        p.stock,
        p.category
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes-barres_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Composant pour l'aperçu d'une étiquette
  const LabelPreview = ({ product }) => {
    const barcode = product.barcode || generateEAN13(product.id);
    
    if (labelFormat === 'standard') {
      return (
        <div style={{
          border: '1px solid #ddd',
          padding: '8px',
          borderRadius: '4px',
          width: `${barcodeSettings.labelWidth * 3}px`,
          height: `${barcodeSettings.labelHeight * 3}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'white',
          color: 'black'
        }}>
          {barcodeSettings.includeStore && (
            <div style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'bold' }}>
              {appSettings.storeName}
            </div>
          )}
          {barcodeSettings.includeName && (
            <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
              {product.name}
            </div>
          )}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            textAlign: 'center',
            letterSpacing: '2px',
            background: 'white',
            padding: '4px',
            margin: '4px 0'
          }}>
            {generateBarcodeText(barcode)}
          </div>
          <div style={{ fontSize: '9px', textAlign: 'center' }}>{barcode}</div>
          {barcodeSettings.includePrice && (
            <div style={{ fontSize: '14px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>
              {product.price} {appSettings.currency}
            </div>
          )}
        </div>
      );
    } else if (labelFormat === 'shelf') {
      return (
        <div style={{
          border: '2px solid #3b82f6',
          padding: '12px',
          borderRadius: '4px',
          width: '200px',
          background: 'white',
          color: 'black'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            {product.name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            {product.category} | SKU: {product.sku}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', textAlign: 'center' }}>
            {product.price} {appSettings.currency}
          </div>
          <div style={{
            fontSize: '10px',
            textAlign: 'center',
            marginTop: '8px',
            padding: '4px',
            background: '#f1f5f9',
            borderRadius: '4px'
          }}>
            {barcode}
          </div>
        </div>
      );
    } else {
      return (
        <div style={{
          border: '1px solid #10b981',
          padding: '6px',
          borderRadius: '4px',
          width: '120px',
          background: 'white',
          color: 'black'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: '#ef4444' }}>
            {product.price} {appSettings.currency}
          </div>
          <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>
            {product.name}
          </div>
        </div>
      );
    }
  };

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
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: isDark ? '#f7fafc' : '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Barcode size={24} />
          Gestion des Codes-barres et Étiquettes
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportBarcodes}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={16} />
            Exporter CSV
          </button>
          
          <button
            onClick={() => setShowPrintPreview(true)}
            disabled={selectedProducts.length === 0}
            style={{
              padding: '8px 16px',
              background: selectedProducts.length > 0 ? '#3b82f6' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedProducts.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} />
            Imprimer ({selectedProducts.length})
          </button>
        </div>
      </div>

      {/* Paramètres d'étiquettes */}
      <div style={{
        background: isDark ? '#374151' : '#f7fafc',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '15px',
          color: isDark ? '#f7fafc' : '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={18} />
          Paramètres d'étiquettes
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#718096' }}>
              Format d'étiquette
            </label>
            <select
              value={labelFormat}
              onChange={(e) => setLabelFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                background: isDark ? '#2d3748' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}
            >
              <option value="standard">Standard (code-barres)</option>
              <option value="shelf">Étiquette rayon</option>
              <option value="price">Étiquette prix simple</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: isDark ? '#a0aec0' : '#718096' }}>
              Options d'affichage
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={barcodeSettings.includePrice}
                  onChange={(e) => setBarcodeSettings({...barcodeSettings, includePrice: e.target.checked})}
                />
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Afficher le prix</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={barcodeSettings.includeName}
                  onChange={(e) => setBarcodeSettings({...barcodeSettings, includeName: e.target.checked})}
                />
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Afficher le nom</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={barcodeSettings.includeStore}
                  onChange={(e) => setBarcodeSettings({...barcodeSettings, includeStore: e.target.checked})}
                />
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Afficher le magasin</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}>
            Sélectionner les produits
          </h3>
          <button
            onClick={selectAllProducts}
            style={{
              padding: '6px 12px',
              background: isDark ? '#4a5568' : '#e2e8f0',
              color: isDark ? '#f7fafc' : '#2d3748',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {selectedProducts.length === globalProducts.length ? 'Désélectionner tout' : 'Sélectionner tout'}
          </button>
        </div>
        
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          borderRadius: '8px'
        }}>
          <table style={{ width: '100%' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              background: isDark ? '#374151' : '#f8fafc',
              borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
            }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === globalProducts.length}
                    onChange={selectAllProducts}
                  />
                </th>
                <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                  Produit
                </th>
                <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                  SKU
                </th>
                <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                  Code-barres
                </th>
                <th style={{ padding: '10px', textAlign: 'right', color: isDark ? '#a0aec0' : '#718096' }}>
                  Prix
                </th>
                <th style={{ padding: '10px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' }}>
                  Aperçu
                </th>
              </tr>
            </thead>
            <tbody>
              {globalProducts.map(product => {
                const barcode = product.barcode || generateEAN13(product.id);
                return (
                  <tr key={product.id} style={{ 
                    borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}`,
                    background: selectedProducts.includes(product.id) ? 
                      (isDark ? '#374151' : '#eff6ff') : 'transparent'
                  }}>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td style={{ padding: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                      <div style={{ fontWeight: '600' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096' }}>
                        {product.category}
                      </div>
                    </td>
                    <td style={{ padding: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                      {product.sku}
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                      {barcode}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                      {product.price} {appSettings.currency}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedProducts([product.id]);
                          setShowPrintPreview(true);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Aperçu
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'aperçu avant impression */}
      {showPrintPreview && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
                Aperçu avant impression ({selectedProducts.length} étiquettes)
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#a0aec0' : '#718096'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Zone d'aperçu */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${
                  labelFormat === 'shelf' ? '220px' : 
                  labelFormat === 'price' ? '140px' : 
                  '180px'
                }, 1fr))`,
                gap: '10px'
              }}>
                {selectedProducts.map(productId => {
                  const product = globalProducts.find(p => p.id === productId);
                  return product ? <LabelPreview key={product.id} product={product} /> : null;
                })}
              </div>
            </div>
            
            {/* Zone cachée pour l'impression */}
            <div ref={printRef} style={{ display: 'none' }}>
              <div className="label-grid">
                {selectedProducts.map(productId => {
                  const product = globalProducts.find(p => p.id === productId);
                  if (!product) return null;
                  const barcode = product.barcode || generateEAN13(product.id);
                  
                  return (
                    <div key={product.id} className="label">
                      {barcodeSettings.includeStore && (
                        <div style={{ fontSize: '8pt', textAlign: 'center', fontWeight: 'bold' }}>
                          {appSettings.storeName}
                        </div>
                      )}
                      {barcodeSettings.includeName && (
                        <div className="product-name">{product.name}</div>
                      )}
                      <div className="barcode">{barcode}</div>
                      <div style={{ fontSize: '8pt', textAlign: 'center' }}>{barcode}</div>
                      {barcodeSettings.includePrice && (
                        <div className="price">{product.price} {appSettings.currency}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowPrintPreview(false)}
                style={{
                  padding: '10px 20px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handlePrint}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Printer size={18} />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeSystem;
