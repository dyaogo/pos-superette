import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../contexts/AppContext';
import { generateSku } from '../../utils/helpers';

const ProductImportModal = ({ isOpen, onClose }) => {
  const { addProduct, addStock, appSettings, stores, currentStoreId, productCatalog, stockByStore, setStockForStore } = useApp();
  const baseHeaders = ['sku', 'name', 'category', 'price', 'costPrice', 'minStock'];
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

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row.name) continue;

          const sku = row.sku;
          const existing = (productCatalog || []).find(p => p.sku === sku);

          if (existing) {
            stores.forEach(store => {
              const qty = parseInt(row[`stock_${store.code}`]) || 0;
              setStockForStore(
                store.id,
                { ...(stockByStore[store.id] || {}), [existing.id]: qty }
              );
            });
            continue;
          }

          const product = {
            id: Date.now() + i,
            sku: sku || generateSku(),
            name: row.name,
            category: row.category || 'Divers',
            price: parseFloat(row.price) || 0,
            costPrice: parseFloat(row.costPrice) || 0,
            minStock: parseInt(row.minStock) || 0,
            barcode: `${Date.now()}${Math.floor(Math.random() * 1000)}`
          };

          const currentStock = parseInt(row[`stock_${currentStore.code}`]) || 0;
          addProduct(product, currentStock);

          stores.forEach(store => {
            if (store.id === currentStoreId) return;
            const qty = parseInt(row[`stock_${store.code}`]) || 0;
            if (qty > 0) {
              addStock(store.id, product.id, qty, 'Import initial');
            }
          });
        }

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

