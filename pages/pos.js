import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { ShoppingCart, Search, Trash2, Plus, Minus, DollarSign } from 'lucide-react';
import ReceiptPrinter from '../components/ReceiptPrinter';


export default function POSPage() {
  const { productCatalog, recordSale, customers, loading } = useApp();
  
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // Filtrer les produits selon la recherche
  const filteredProducts = productCatalog.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  // Ajouter un produit au panier
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Mettre à jour la quantité
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Retirer du panier
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Calculer le total
  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Finaliser la vente
  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Le panier est vide');
      return;
    }

    const saleData = {
      customerId: selectedCustomer?.id || null,
      total,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.sellingPrice
      }))
    };

    const result = await recordSale(saleData);

    if (result.success) {
      // Sauvegarder la vente pour l'impression
      setLastSale(result.sale);
      
      // Afficher le message approprié
      if (result.offline) {
        alert(`Vente enregistrée en mode hors ligne ! Total: ${total} FCFA\n\nLa vente sera synchronisée dès le retour de la connexion.`);
      } else {
        alert(`Vente enregistrée avec succès ! Total: ${total} FCFA`);
      }
      
      // Proposer l'impression
      setShowReceipt(true);
      
      // Vider le panier
      setCart([]);
      setSearchTerm('');
      setSelectedCustomer(null);
    } else {
      alert('Erreur lors de l\'enregistrement de la vente');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Colonne gauche - Produits */}
      <div style={{ flex: 2, padding: '20px', overflow: 'auto' }}>
        <h1 style={{ marginBottom: '20px' }}>Point de Vente</h1>

        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search 
            size={20} 
            style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} 
          />
          <input
            type="text"
            placeholder="Rechercher un produit (nom ou code-barres)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Grille de produits */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {filteredProducts.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af' }}>
              Aucun produit trouvé
            </p>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{product.name}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                  {product.category}
                </p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {product.sellingPrice} FCFA
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  Stock: {product.stock || 0}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Colonne droite - Panier */}
      <div style={{ 
        width: '400px', 
        background: 'white', 
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* En-tête du panier */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <ShoppingCart size={24} />
            <h2 style={{ margin: 0 }}>Panier ({itemsCount})</h2>
          </div>

          {/* Sélection client */}
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(customer || null);
            }}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '10px'
            }}
          >
            <option value="">Client comptant</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          {/* Méthode de paiement */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <option value="cash">Espèces</option>
            <option value="card">Carte bancaire</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </div>

        {/* Articles du panier */}
        <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
              Panier vide
            </p>
          ) : (
            cart.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    {item.sellingPrice} FCFA × {item.quantity}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: '5px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={16} />
                  </button>

                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      padding: '5px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      padding: '5px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                  {(item.sellingPrice * item.quantity).toLocaleString()} FCFA
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bas du panier - Total et paiement */}
        <div style={{ 
          padding: '20px', 
          borderTop: '2px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            <span>Total</span>
            <span style={{ color: '#3b82f6' }}>{total.toLocaleString()} FCFA</span>
          </div>

          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              padding: '15px',
              background: cart.length === 0 ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <DollarSign size={24} />
            Finaliser la vente
          </button>
        </div>
      </div>
      {/* Modal d'impression */}
      {showReceipt && lastSale && (
        <ReceiptPrinter 
          sale={lastSale} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
