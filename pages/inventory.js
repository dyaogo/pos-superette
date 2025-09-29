import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, AlertCircle } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data || []);
      setFilteredProducts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const getStockColor = (stock) => {
    if (stock === 0) return '#ef4444';
    if (stock < 10) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Gestion de l'Inventaire</h1>
        <p style={{ color: '#6b7280' }}>
          {products.length} produits au total • 
          {products.filter(p => p.stock < 10).length} en stock faible
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou code-barres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="all">Toutes les catégories</option>
          {categories.filter(c => c !== 'all').map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Plus size={20} />
          Nouveau Produit
        </button>
      </div>

      {/* Tableau des produits */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Produit</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Catégorie</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Stock</th>
              <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Prix d'achat</th>
              <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Prix de vente</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <Package size={48} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>Aucun produit trouvé</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} style={{
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#fafafa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '15px' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{product.name}</div>
                      {product.barcode && (
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          Code: {product.barcode}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '15px', color: '#6b7280' }}>
                    {product.category}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: getStockColor(product.stock),
                      background: `${getStockColor(product.stock)}20`
                    }}>
                      {product.stock}
                      {product.stock === 0 && ' (Rupture)'}
                      {product.stock > 0 && product.stock < 10 && ' (Faible)'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', color: '#6b7280' }}>
                    {product.costPrice?.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '500' }}>
                    {product.sellingPrice?.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setEditingProduct(product)}
                        style={{
                          padding: '6px 10px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        style={{
                          padding: '6px 10px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: '4px solid #10b981'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Valeur totale stock</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: '600' }}>
            {products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0).toLocaleString()} FCFA
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Produits en rupture</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: '600' }}>
            {products.filter(p => p.stock === 0).length}
          </p>
        </div>
        
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Catégories</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: '600' }}>
            {categories.length - 1}
          </p>
        </div>
      </div>

{/* Modal Ajout de Produit */}
      {showAddModal && (
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
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2>Nouveau Produit</h2>
            
            <form onSubmit={async (e) => {
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

  try {
    // Envoyer à l'API
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const newProduct = await response.json();
      
      // Ajouter au state local
      setProducts([...products, newProduct]);
      setShowAddModal(false);
      
      // Recharger les produits depuis l'API pour avoir les données à jour
      loadProducts();
      
      alert('Produit ajouté avec succès !');
    } else {
      throw new Error('Erreur API');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'ajout du produit');
  }
}}>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nom du produit *</label>
                <input
                  type="text"
                  name="name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Catégorie *</label>
                <input
                  type="text"
                  name="category"
                  required
                  placeholder="Ex: Boissons, Snacks..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Code-barres</label>
                <input
                  type="text"
                  name="barcode"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Prix d'achat *</label>
                  <input
                    type="number"
                    name="costPrice"
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Prix de vente *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Stock initial</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
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
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}