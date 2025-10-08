import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../src/contexts/AppContext';
import ProductImportModal from '../components/ProductImportModal';
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, TrendingDown, X, Save, Upload } from 'lucide-react';
export default function InventoryPage() {
  const { productCatalog, addProduct, updateProduct, deleteProduct, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Extraire les catégories uniques
  const categories = ['all', ...new Set(productCatalog.map(p => p.category))];

  // Filtrer les produits
  const filteredProducts = productCatalog.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Statistiques
  const totalProducts = productCatalog.length;
  const totalValue = productCatalog.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  const lowStockProducts = productCatalog.filter(p => p.stock < 10).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const productData = {
      name: formData.get('name'),
      category: formData.get('category'),
      barcode: formData.get('barcode') || null,
      costPrice: parseFloat(formData.get('costPrice')),
      sellingPrice: parseFloat(formData.get('sellingPrice')),
      stock: parseInt(formData.get('stock')) || 0
    };

    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, productData);
      if (result.success) {
        alert('Produit modifié avec succès');
        setEditingProduct(null);
      } else {
        alert('Erreur lors de la modification');
      }
    } else {
      const result = await addProduct(productData);
      if (result.success) {
        alert('Produit ajouté avec succès');
        setShowAddModal(false);
        e.target.reset();
      } else {
        alert('Erreur lors de l\'ajout');
      }
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!confirm(`Supprimer le produit "${productName}" ?`)) return;

    const result = await deleteProduct(productId);
    if (result.success) {
      alert('Produit supprimé');
    } else {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
      return <LoadingSpinner fullScreen />;

  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', gap: '10px' }}>
  <button
    onClick={() => setShowImportModal(true)}
    style={{
      padding: '12px 24px',
      background: 'var(--color-success)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px'
    }}
  >
    <Upload size={20} />
    Importer Excel
  </button>

  <button
    onClick={() => setShowAddModal(true)}
    style={{
      padding: '12px 24px',
      background: 'var(--color-primary)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px'
    }}
  >
    <Plus size={20} />
    Ajouter Produit
  </button>
</div>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Total produits</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {totalProducts}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Valeur stock</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {totalValue.toLocaleString()} FCFA
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} />
            Stock faible
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {lowStockProducts}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search 
            size={20} 
            style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} 
          />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            minWidth: '150px'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Toutes catégories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des produits */}
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Aucun produit trouvé
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Produit</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Prix achat</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Prix vente</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr 
                  key={product.id}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    background: product.stock < 10 ? '#fef2f2' : 'white'
                  }}
                >
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                    {product.barcode && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{product.barcode}</div>
                    )}
                  </td>
                  <td style={{ padding: '15px' }}>{product.category}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    {product.costPrice.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                    {product.sellingPrice.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: product.stock < 10 ? '#fecaca' : '#dcfce7',
                      color: product.stock < 10 ? '#991b1b' : '#166534'
                    }}>
                      {product.stock}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setEditingProduct(product)}
                        style={{
                          padding: '8px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={16} />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        style={{
                          padding: '8px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <ProductModal
          title="Nouveau Produit"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal Modification */}
      {editingProduct && (
        <ProductModal
          title="Modifier le Produit"
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// Composant Modal
function ProductModal({ title, product, onClose, onSubmit }) {
  return (
    <div 
      onClick={onClose}
      style={{
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
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '30px',
          width: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom du produit *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={product?.name}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Catégorie *</label>
              <input
                type="text"
                name="category"
                required
                defaultValue={product?.category}
                placeholder="Ex: Boissons, Snacks..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code-barres</label>
              <input
                type="text"
                name="barcode"
                defaultValue={product?.barcode || ''}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Prix d'achat *</label>
              <input
                type="number"
                name="costPrice"
                required
                min="0"
                step="0.01"
                defaultValue={product?.costPrice}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Prix de vente *</label>
              <input
                type="number"
                name="sellingPrice"
                required
                min="0"
                step="0.01"
                defaultValue={product?.sellingPrice}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Stock</label>
            <input
              type="number"
              name="stock"
              min="0"
              defaultValue={product?.stock || 0}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={20} />
              {product ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
{/* Modal d'import Excel */}
      {showImportModal && (
        <ProductImportModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            window.location.reload();
          }}
          productCatalog={productCatalog}
          addProduct={addProduct}
        />
      )}
    </div>
  );
}