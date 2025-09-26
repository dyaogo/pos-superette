import { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, X, 
  CreditCard, DollarSign, Smartphone, Trash2 
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);

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
      console.error('Erreur:', error);
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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert(`Stock insuffisant! Maximum: ${product.stock}`);
      }
    } else {
      if (product.stock > 0) {
        setCart([...cart, { ...product, quantity: 1 }]);
      } else {
        alert('Produit en rupture de stock!');
      }
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (newQuantity <= product.stock) {
        setCart(cart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const handlePayment = async (method) => {
  try {
    // Préparer les données de vente
    const saleData = {
      storeId: 'default', // À récupérer du contexte
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.sellingPrice
      })),
      paymentMethod: method,
      cashReceived: method === 'cash' ? getCartTotal() : null
    };
    
    // Envoyer à l'API
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleData)
    });
    
    if (response.ok) {
      const sale = await response.json();
      alert(`Vente enregistrée!\nReçu: ${sale.receiptNumber}\nTotal: ${sale.total} FCFA`);
      
      // Vider le panier
      setCart([]);
      setShowPayment(false);
      
      // Recharger les produits pour mettre à jour les stocks
      loadProducts();
    } else {
      alert('Erreur lors de l\'enregistrement de la vente');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur de connexion au serveur');
  }
};

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      {/* Partie gauche - Produits */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* Recherche et filtres */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Rechercher produit..."
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
              <option value="all">Toutes catégories</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille de produits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '15px'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{product.name}</h3>
              <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                {product.sellingPrice} FCFA
              </p>
              <p style={{ 
                margin: '5px 0', 
                fontSize: '12px', 
                color: product.stock < 10 ? '#f59e0b' : '#6b7280' 
              }}>
                Stock: {product.stock}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Partie droite - Panier */}
      <div style={{
        width: '400px',
        background: 'white',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* En-tête panier */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#3b82f6',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={24} />
            Panier ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </h2>
        </div>

        {/* Articles du panier */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <ShoppingCart size={48} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p>Panier vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.quantity}</span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {(item.sellingPrice * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total et paiement */}
        {cart.length > 0 && (
          <div style={{
            borderTop: '2px solid #e5e7eb',
            padding: '20px',
            background: '#f9fafb'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Total:</span>
              <span style={{ color: '#3b82f6' }}>{getCartTotal().toLocaleString()} FCFA</span>
            </div>
            
            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Procéder au paiement
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => handlePayment('cash')}
                  style={{
                    padding: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <DollarSign size={18} />
                  Espèces
                </button>
                
                <button
                  onClick={() => handlePayment('card')}
                  style={{
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <CreditCard size={18} />
                  Carte
                </button>
                
                <button
                  onClick={() => handlePayment('mobile')}
                  style={{
                    padding: '12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Smartphone size={18} />
                  Mobile
                </button>
                
                <button
                  onClick={() => setShowPayment(false)}
                  style={{
                    padding: '12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}