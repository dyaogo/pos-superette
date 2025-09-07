import React, { useState } from 'react';
import { Upload, Download, X, AlertTriangle, CheckCircle, FileSpreadsheet, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ProductImportModal = ({ isOpen, onClose }) => {
  const { 
    addProduct, 
    addStock, 
    appSettings, 
    stores, 
    currentStoreId, 
    productCatalog, 
    stockByStore, 
    setStockForStore 
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'importing', 'success'

  const isDark = appSettings.darkMode;

  // Headers pour le template et validation
  const baseHeaders = ['sku', 'name', 'category', 'price', 'costPrice', 'minStock', 'maxStock', 'supplier'];
  const stockHeaders = stores.map(s => `stock_${s.code}`);
  const HEADERS = [...baseHeaders, ...stockHeaders];

  if (!isOpen) return null;

  // Générer et télécharger le template Excel
  const handleDownloadTemplate = async () => {
    try {
      // Import dynamique pour éviter les erreurs si XLSX n'est pas installé
      const XLSX = await import('xlsx');
      
      // Créer le workbook
      const workbook = XLSX.utils.book_new();
      
      // Headers avec exemples
      const exampleData = [
        HEADERS, // Headers
        [
          'SKU001', 
          'Coca-Cola 33cl', 
          'Boissons', 
          '500', 
          '300', 
          '10', 
          '100', 
          'Coca-Cola Company',
          '45', // stock pour premier magasin
          '25'  // stock pour deuxième magasin
        ],
        [
          'SKU002', 
          'Pain de mie', 
          'Alimentaire', 
          '800', 
          '600', 
          '5', 
          '50', 
          'Boulangerie Martin',
          '20',
          '15'
        ]
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(exampleData);
      
      // Largeurs des colonnes
      const colWidths = [
        { wch: 12 }, // SKU
        { wch: 25 }, // Name
        { wch: 15 }, // Category
        { wch: 10 }, // Price
        { wch: 10 }, // Cost Price
        { wch: 10 }, // Min Stock
        { wch: 10 }, // Max Stock
        { wch: 20 }, // Supplier
        ...stockHeaders.map(() => ({ wch: 12 })) // Stock columns
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
      
      // Ajouter une feuille d'instructions
      const instructionsData = [
        ['Instructions d\'importation'],
        [''],
        ['Colonnes obligatoires:'],
        ['- sku: Code unique du produit'],
        ['- name: Nom du produit'],
        ['- price: Prix de vente (FCFA)'],
        ['- costPrice: Prix d\'achat (FCFA)'],
        [''],
        ['Colonnes optionnelles:'],
        ['- category: Catégorie du produit'],
        ['- minStock: Stock minimum'],
        ['- maxStock: Stock maximum'],
        ['- supplier: Fournisseur'],
        [`- stock_${stores[0]?.code}: Stock pour ${stores[0]?.name}`],
        [`- stock_${stores[1]?.code}: Stock pour ${stores[1]?.name}`],
        [''],
        ['Notes importantes:'],
        ['- Ne modifiez pas les en-têtes'],
        ['- Supprimez les lignes d\'exemple avant import'],
        ['- Les SKU doivent être uniques'],
        ['- Les prix doivent être en nombres entiers (FCFA)']
      ];
      
      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsSheet['!cols'] = [{ wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
      
      // Télécharger le fichier
      XLSX.writeFile(workbook, 'template-import-produits.xlsx');
      
    } catch (error) {
      console.error('Erreur lors de la génération du template:', error);
      alert('Erreur: Veuillez installer la dépendance XLSX pour cette fonctionnalité:\nnpm install xlsx');
    }
  };

  // Sélection de fichier
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setImportPreview(null);
      setStep('upload');
    }
  };

  // Génération d'un SKU automatique
  const generateSku = (name, index) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}${index}`;
  };

  // Prévisualisation du fichier
  const handlePreview = async () => {
    if (!file) return;
    
    setLoading(true);
    setErrors([]);

    try {
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON avec headers personnalisés
          const rows = XLSX.utils.sheet_to_json(sheet, { 
            header: HEADERS, 
            range: 1, 
            defval: '',
            raw: false 
          });

          if (rows.length === 0) {
            setErrors(['Le fichier ne contient aucune donnée']);
            setLoading(false);
            return;
          }

          // Validation des données
          const validationErrors = [];
          const previewData = [];
          const seenSkus = new Set();

          rows.forEach((row, index) => {
            const lineNumber = index + 2; // +1 pour header, +1 pour index 0
            const sku = (row.sku || '').toString().trim();
            
            // Validation SKU
            if (!sku) {
              validationErrors.push(`Ligne ${lineNumber}: SKU manquant`);
              return;
            }

            if (seenSkus.has(sku)) {
              validationErrors.push(`Ligne ${lineNumber}: SKU ${sku} dupliqué dans le fichier`);
              return;
            }
            seenSkus.add(sku);

            // Vérifier si le produit existe déjà
            const existingProduct = (productCatalog || []).find(p => p.sku === sku);
            const isUpdate = !!existingProduct;

            // Validation pour nouveaux produits
            if (!isUpdate) {
              if (!row.name || !row.name.trim()) {
                validationErrors.push(`Ligne ${lineNumber}: Nom du produit manquant pour nouveau produit`);
                return;
              }
              if (!row.price || isNaN(parseFloat(row.price))) {
                validationErrors.push(`Ligne ${lineNumber}: Prix de vente invalide`);
                return;
              }
              if (!row.costPrice || isNaN(parseFloat(row.costPrice))) {
                validationErrors.push(`Ligne ${lineNumber}: Prix d'achat invalide`);
                return;
              }
            }

            // Calculer les stocks
            const stocks = {};
            stores.forEach(store => {
              const stockValue = row[`stock_${store.code}`];
              if (stockValue && !isNaN(parseInt(stockValue))) {
                stocks[store.code] = parseInt(stockValue);
              }
            });

            previewData.push({
              ...row,
              isUpdate,
              existingProduct,
              stocks,
              lineNumber
            });
          });

          if (validationErrors.length > 0) {
            setErrors(validationErrors);
          } else {
            setImportPreview(previewData);
            setStep('preview');
          }

        } catch (error) {
          setErrors(['Erreur lors de la lecture du fichier Excel']);
        }
        setLoading(false);
      };

      reader.readAsBinaryString(file);

    } catch (error) {
      setErrors(['Erreur: XLSX non installé. Exécutez: npm install xlsx']);
      setLoading(false);
    }
  };

  // Import effectif
  const handleImport = async () => {
    if (!importPreview) return;

    setLoading(true);
    setStep('importing');

    try {
      let importedCount = 0;
      let updatedCount = 0;

      for (const row of importPreview) {
        const sku = row.sku.trim();
        
        if (row.isUpdate) {
          // Mise à jour du stock pour produit existant
          stores.forEach(store => {
            const qty = row.stocks[store.code];
            if (qty !== undefined) {
              const currentStock = { ...(stockByStore[store.id] || {}) };
              currentStock[row.existingProduct.id] = qty;
              setStockForStore(store.id, currentStock);
            }
          });
          updatedCount++;
        } else {
          // Création d'un nouveau produit
          const product = {
            id: Date.now() + Math.random(),
            sku: sku,
            name: row.name.trim(),
            category: row.category || 'Divers',
            price: parseFloat(row.price) || 0,
            costPrice: parseFloat(row.costPrice) || 0,
            minStock: parseInt(row.minStock) || 5,
            maxStock: parseInt(row.maxStock) || 100,
            supplier: row.supplier || '',
            barcode: `${Date.now()}${Math.floor(Math.random() * 1000)}`
          };

          // Stock pour le magasin actuel
          const currentStoreCode = stores.find(s => s.id === currentStoreId)?.code;
          const initialStock = row.stocks[currentStoreCode] || 0;
          
          await addProduct(product, initialStock);

          // Ajouter du stock aux autres magasins si nécessaire
          for (const store of stores) {
            if (store.id !== currentStoreId && row.stocks[store.code] > 0) {
              await addStock(store.id, product.id, row.stocks[store.code], 'Import initial');
            }
          }
          
          importedCount++;
        }

        // Petit délai pour éviter les conflits
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setStep('success');
      
      // Toast de succès
      const message = `Import réussi! ${importedCount} produits ajoutés, ${updatedCount} produits mis à jour.`;
      setTimeout(() => {
        alert(message);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setErrors(['Erreur lors de l\'import des produits']);
      setStep('preview');
    }

    setLoading(false);
  };

  // Reset du modal
  const handleClose = () => {
    setFile(null);
    setImportPreview(null);
    setErrors([]);
    setStep('upload');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: step === 'preview' ? '800px' : '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}>
            Import de Produits
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Étape 1: Upload */}
        {step === 'upload' && (
          <div>
            {/* Instructions */}
            <div style={{
              backgroundColor: isDark ? '#4a5568' : '#f0f9ff',
              border: `1px solid ${isDark ? '#718096' : '#0ea5e9'}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Info style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
                <h3 style={{ margin: 0, fontSize: '16px', color: isDark ? '#f7fafc' : '#0c4a6e' }}>
                  Instructions
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: isDark ? '#e2e8f0' : '#075985' }}>
                <li>Téléchargez d'abord le template Excel</li>
                <li>Remplissez vos données dans le template</li>
                <li>Supprimez les lignes d'exemple</li>
                <li>Importez votre fichier Excel</li>
              </ul>
            </div>

            {/* Bouton Template */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={handleDownloadTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Télécharger le Template Excel
              </button>
            </div>

            {/* Upload de fichier */}
            <div style={{
              border: `2px dashed ${isDark ? '#4a5568' : '#d1d5db'}`,
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <FileSpreadsheet style={{
                width: '48px',
                height: '48px',
                color: isDark ? '#a0aec0' : '#9ca3af',
                margin: '0 auto 16px'
              }} />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '16px'
                }}
              />
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#6b7280'
              }}>
                Sélectionnez votre fichier Excel (.xlsx, .xls)
              </p>
            </div>

            {/* Erreurs */}
            {errors.length > 0 && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#dc2626' }}>
                    Erreurs de validation
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
                  {errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDark ? '#4a5568' : '#e5e7eb',
                  color: isDark ? '#f7fafc' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: file && !loading ? '#059669' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: file && !loading ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Analyse...' : 'Prévisualiser'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Prévisualisation */}
        {step === 'preview' && importPreview && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Prévisualisation ({importPreview.length} produits)
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#6b7280'
              }}>
                Vérifiez les données avant l'import final
              </p>
            </div>

            {/* Table de prévisualisation */}
            <div style={{
              maxHeight: '400px',
              overflow: 'auto',
              border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    backgroundColor: isDark ? '#4a5568' : '#f9fafb',
                    position: 'sticky',
                    top: 0
                  }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Action</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>SKU</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Nom</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Prix</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, index) => (
                    <tr key={index} style={{
                      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
                    }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          backgroundColor: row.isUpdate ? '#fef3c7' : '#dcfce7',
                          color: row.isUpdate ? '#92400e' : '#166534'
                        }}>
                          {row.isUpdate ? 'Mise à jour' : 'Nouveau'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px' }}>{row.sku}</td>
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {row.isUpdate ? row.existingProduct.name : row.name}
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {row.isUpdate ? row.existingProduct.price : row.price} FCFA
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {Object.entries(row.stocks).map(([code, qty]) => (
                          <div key={code}>{code}: {qty}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep('upload')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDark ? '#4a5568' : '#e5e7eb',
                  color: isDark ? '#f7fafc' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Import en cours...' : 'Confirmer l\'import'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Import en cours */}
        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }} />
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Import en cours...
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}>
              Veuillez patienter pendant l'import des produits
            </p>
          </div>
        )}

        {/* Étape 4: Succès */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle style={{
              width: '64px',
              height: '64px',
              color: '#059669',
              margin: '0 auto 24px'
            }} />
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Import réussi !
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}>
              Tous les produits ont été importés avec succès
            </p>
          </div>
        )}

        {/* Style pour l'animation de loading */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default ProductImportModal;
