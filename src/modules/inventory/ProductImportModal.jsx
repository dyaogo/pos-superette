import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../contexts/AppContext';

const ProductImportModal = ({ isOpen, onClose }) => {
  const {
    addProduct,
    addStock,
    removeProduct,
    setStockForStore,
    productCatalog,
    stockByStore,
    appSettings,
    stores,
    currentStoreId
  } = useApp();
  const baseHeaders = ['name', 'sku', 'category', 'price', 'costPrice', 'minStock'];
  const stockHeaders = stores.map(s => `stock_${s.code}`);
  const HEADERS = [...baseHeaders, ...stockHeaders];
  const isDark = appSettings.darkMode;
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    XLSX.writeFile(wb, 'gabarit-import-produits.xlsx');
  };

  const handleFileSelect = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleImport = () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: HEADERS, range: 1, defval: '' });

        const currentStore = stores.find(s => s.id === currentStoreId);

        const errors = [];
        const seen = new Set();
        const validRows = [];

        rows.forEach((row, idx) => {
          const sku = (row.sku || '').toString().trim();
          if (!sku) {
            errors.push({ index: idx + 2, message: 'SKU manquant' });
            return;
          }
          if (seen.has(sku)) {
            errors.push({ index: idx + 2, message: `SKU dupliqué (${sku})` });
            return;
          }
          seen.add(sku);
          validRows.push(row);
        });

        let added = 0;
        let updated = 0;

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          if (!row.name) continue;
          const sku = row.sku.toString().trim();
          const existing = productCatalog.find(p => p.sku === sku);

          const productId = existing ? existing.id : Date.now() + i;
          const product = {
            id: productId,
            sku,
            name: row.name,
            category: row.category || 'Divers',
            price: parseFloat(row.price) || 0,
            costPrice: parseFloat(row.costPrice) || 0,
            minStock: parseInt(row.minStock) || 0,
            barcode: existing ? existing.barcode : `${Date.now()}${Math.floor(Math.random() * 1000)}`
          };

          const currentStock = parseInt(row[`stock_${currentStore.code}`]) || 0;

          if (existing) {
            removeProduct(existing.id);
            addProduct(product, 0);
            stores.forEach(store => {
              const qty = parseInt(row[`stock_${store.code}`]) || 0;
              const storeStock = { ...(stockByStore[store.id] || {}), [productId]: qty };
              setStockForStore(store.id, storeStock);
            });
            updated++;
          } else {
            addProduct(product, currentStock);
            stores.forEach(store => {
              if (store.id === currentStoreId) return;
              const qty = parseInt(row[`stock_${store.code}`]) || 0;
              if (qty > 0) {
                addStock(store.id, product.id, qty, 'Import initial');
              }
            });
            added++;
          }
        }

        const summary = `Import terminé.\nAjouts: ${added}\nMises à jour: ${updated}\nErreurs: ${errors.length ? errors.map(e => `Ligne ${e.index}: ${e.message}`).join('\n') : 'Aucune'}`;
        alert(summary);
        onClose();
      } catch (err) {
        console.error("Erreur lors de l'importation:", err);
      } finally {
        setLoading(false);
        setFile(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: isDark ? '#2d3748' : 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginTop: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Importer Produits</h2>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          disabled={loading}
        />
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            style={{ padding: '8px 12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Importer
          </button>
          <button
            onClick={handleTemplate}
            style={{ padding: '8px 12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Télécharger gabarit
          </button>
          <button
            onClick={onClose}
            style={{ padding: '8px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImportModal;

