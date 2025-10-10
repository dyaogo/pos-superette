import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { ShoppingCart, Plus, Minus, Trash2, Search, User, DollarSign, Printer, X, AlertTriangle, CheckCircle } from 'lucide-react';
import ReceiptPrinter from '../components/ReceiptPrinter';


export default function POSPage() {
  const { productCatalog, recordSale, customers, loading } = useApp();
  
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [cashSession, setCashSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingAmount, setClosingAmount] = useState('');
  const [cashReceived, setCashReceived] = useState(''); // NOUVEAU pour le calcul de rendu

  // État pour le scan
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());

  // Détecter le scan de code-barres
useEffect(() => {
  const handleKeyDown = (e) => {
    const now = Date.now();
    
    // Si plus de 100ms entre les touches, nouveau scan
    if (now - lastKeyTime > 100) {
      setScanBuffer('');
    }
    
    setLastKeyTime(now);
    
    // Si c'est Enter, traiter le code-barres
    if (e.key === 'Enter' && scanBuffer.length > 0) {
      e.preventDefault();
      processBarcodeScan(scanBuffer);
      setScanBuffer('');
    }
    // Accumuler les caractères (sauf les touches spéciales)
    else if (e.key.length === 1) {
      setScanBuffer(prev => prev + e.key);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [scanBuffer, lastKeyTime, productCatalog]);

const processBarcodeScan = (barcode) => {
  console.log('Code-barres scanné:', barcode);
  
  // Chercher le produit par code-barres
  const product = productCatalog.find(p => p.barcode === barcode);
  
  if (product) {
    addToCart(product);
    // Feedback sonore (optionnel)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVa3m7q5aFg1Ln+PyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVa3m7q5aFg==');
    audio.play().catch(() => {}); // Ignorer les erreurs
  } else {
    alert(`Produit non trouvé: ${barcode}`);
  }
};


  // Raccourcis clavier
useEffect(() => {
  const handleKeyPress = (e) => {
    // F1 - Focus sur la recherche
    if (e.key === 'F1') {
      e.preventDefault();
      document.getElementById('product-search')?.focus();
    }
    
    // F2 - Vider le panier
    if (e.key === 'F2') {
      e.preventDefault();
      if (cart.length > 0 && confirm('Vider le panier ?')) {
        setCart([]);
      }
    }
    
    // F3 - Finaliser la vente
    if (e.key === 'F3') {
      e.preventDefault();
      if (cart.length > 0) {
        completeSale();
      }
    }
    
    // Échap - Fermer les modals
    if (e.key === 'Escape') {
      setShowReceipt(false);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [cart, showReceipt]);

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

  // Charger la session active
useEffect(() => {
  loadActiveSession();
}, [currentStore]);

const loadActiveSession = async () => {
  if (!currentStore) return;
  
  try {
    const res = await fetch(`/api/cash-sessions?storeId=${currentStore.id}&status=open`);
    const sessions = await res.json();
    if (sessions.length > 0) {
      setCashSession(sessions[0]);
    }
  } catch (error) {
    console.error('Erreur chargement session:', error);
  }
};

// Ouvrir une session
const openCashSession = async () => {
  if (!currentStore) {
    alert('Aucun magasin sélectionné');
    return;
  }
  
  try {
    const res = await fetch('/api/cash-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: currentStore.id,
        openingAmount: parseFloat(openingAmount),
        openedBy: 'Admin'
      })
    });
    
    if (res.ok) {
      const session = await res.json();
      setCashSession(session);
      setShowSessionModal(false);
      alert('Session de caisse ouverte !');
    } else {
      const error = await res.json();
      alert('Erreur: ' + error.error);
    }
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

// Fermer une session
const closeCashSession = async () => {
  if (!cashSession || !closingAmount) {
    alert('Montant de fermeture requis');
    return;
  }
  
  try {
    const res = await fetch(`/api/cash-sessions/${cashSession.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        closingAmount: parseFloat(closingAmount),
        closedBy: 'Admin'
      })
    });
    
    if (res.ok) {
      const closedSession = await res.json();
      const diff = closedSession.difference;
      
      alert(
        `Session fermée !\n\n` +
        `Attendu: ${closedSession.expectedAmount.toLocaleString()} FCFA\n` +
        `Réel: ${closedSession.closingAmount.toLocaleString()} FCFA\n` +
        `Écart: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} FCFA\n\n` +
        (diff === 0 ? '✅ Parfait !' : diff > 0 ? '💰 Surplus' : '⚠️ Manque')
      );
      
      setCashSession(null);
      setShowCloseModal(false);
      setClosingAmount('');
    }
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

// NOUVEAU : Calculer le rendu de monnaie
const calculateChange = () => {
  const received = parseFloat(cashReceived) || 0;
  return Math.max(0, received - total);
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
            style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} 
          />
          <input
            id="product-search"
            type="text"
            placeholder="Rechercher un produit (nom ou code-barres)... [F1]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '1px solid var(--color-border)',
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
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Aucun produit trouvé
            </p>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--color-surface)'
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
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  {product.category}
                </p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {product.sellingPrice} FCFA
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Stock: {product.stock || 0}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Indicateur de session */}
{!cashSession ? (
  <div style={{
    padding: '15px 20px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid var(--color-danger)',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <AlertTriangle size={24} color="var(--color-danger)" />
      <div>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>Caisse fermée</div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Ouvrez une session pour commencer les ventes
        </div>
      </div>
    </div>
    <button
      onClick={() => setShowSessionModal(true)}
      style={{
        padding: '10px 20px',
        background: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
      }}
    >
      Ouvrir la caisse
    </button>
  </div>
) : (
  <div style={{
    padding: '15px 20px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid var(--color-success)',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <CheckCircle size={24} color="var(--color-success)" />
      <div>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>Session ouverte</div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Fond de caisse: {cashSession.openingAmount.toLocaleString()} FCFA • 
          Ouvert par {cashSession.openedBy} • 
          {new Date(cashSession.openedAt).toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </div>
    <button
      onClick={() => setShowCloseModal(true)}
      style={{
        padding: '10px 20px',
        background: 'var(--color-danger)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
      }}
    >
      Fermer la caisse
    </button>
  </div>
)}

      {/* Colonne droite - Panier */}
      <div style={{ 
        width: '400px', 
        background: 'var(--color-surface)', 
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
              border: '1px solid var(--color-border)',
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

          {/* Mode de paiement avec calcul de rendu */}
<div style={{ marginBottom: '15px' }}>
  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
    Mode de paiement
  </label>
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
    {['cash', 'card', 'mobile'].map(method => (
      <button
        key={method}
        onClick={() => setPaymentMethod(method)}
        style={{
          padding: '10px',
          background: paymentMethod === method ? 'var(--color-primary)' : 'var(--color-surface)',
          color: paymentMethod === method ? 'white' : 'var(--color-text-primary)',
          border: `2px solid ${paymentMethod === method ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px',
          transition: 'all 0.2s'
        }}
      >
        {method === 'cash' ? '💵 Espèces' : method === 'card' ? '💳 Carte' : '📱 Mobile'}
      </button>
    ))}
  </div>
</div>

{/* Calcul de rendu pour paiement espèces */}
{paymentMethod === 'cash' && (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
      Montant reçu (FCFA)
    </label>
    <input
      type="number"
      value={cashReceived}
      onChange={(e) => setCashReceived(e.target.value)}
      placeholder="Montant donné par le client"
      style={{
        width: '100%',
        padding: '10px',
        border: '2px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'right',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)'
      }}
    />
    
    {/* Affichage du rendu si montant suffisant */}
    {cashReceived && parseFloat(cashReceived) >= total && (
      <div style={{
        marginTop: '10px',
        padding: '12px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '2px solid var(--color-success)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>💰 Rendu à rendre:</span>
        <span style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: 'var(--color-success)' 
        }}>
          {calculateChange().toLocaleString()} FCFA
        </span>
      </div>
    )}
    
    {/* Alerte si montant insuffisant */}
    {cashReceived && parseFloat(cashReceived) < total && (
      <div style={{
        marginTop: '10px',
        padding: '12px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '2px solid var(--color-danger)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>⚠️ Insuffisant:</span>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: 'var(--color-danger)' 
        }}>
          Manque {(total - parseFloat(cashReceived)).toLocaleString()} FCFA
        </span>
      </div>
    )}
  </div>
)}
        </div>

        {/* Articles du panier */}
        <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>
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
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    {item.sellingPrice} FCFA × {item.quantity}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: '5px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      background: 'var(--color-surface)',
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
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      background: 'var(--color-surface)',
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
          background: 'var(--color-surface-hover)'
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
  disabled={cart.length === 0 || !cashSession}
  style={{
    width: '100%',
    padding: '18px',
    background: cart.length === 0 || !cashSession ? 'var(--color-border)' : 'var(--color-success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: cart.length === 0 || !cashSession ? 'not-allowed' : 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  }}
>
  <ShoppingCart size={24} />
  Finaliser la vente (F3)
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

      {/* Modal Ouverture Session */}
{showSessionModal && (
  <div
    onClick={() => setShowSessionModal(false)}
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
      zIndex: 2000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '30px',
        width: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DollarSign size={24} color="var(--color-success)" />
          Ouverture de Caisse
        </h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Magasin: <strong>{currentStore?.name}</strong>
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Fond de caisse initial (FCFA)
        </label>
        <input
          type="number"
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'right',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowSessionModal(false)}
          style={{
            flex: 1,
            padding: '12px',
            background: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Annuler
        </button>
        <button
          onClick={openCashSession}
          disabled={!openingAmount || parseFloat(openingAmount) < 0}
          style={{
            flex: 1,
            padding: '12px',
            background: !openingAmount || parseFloat(openingAmount) < 0 ? 'var(--color-border)' : 'var(--color-success)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !openingAmount || parseFloat(openingAmount) < 0 ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          Ouvrir la caisse
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal Fermeture Session */}
{showCloseModal && cashSession && (
  <div
    onClick={() => setShowCloseModal(false)}
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
      zIndex: 2000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '30px',
        width: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DollarSign size={24} color="var(--color-danger)" />
          Fermeture de Caisse
        </h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Session ouverte à {new Date(cashSession.openedAt).toLocaleTimeString('fr-FR')}
        </p>
      </div>

      <div style={{ 
        background: 'var(--color-bg)', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Fond de caisse initial:</span>
          <strong>{cashSession.openingAmount.toLocaleString()} FCFA</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Ventes en espèces:</span>
          <strong style={{ color: 'var(--color-success)' }}>
            {currentStoreSales
              .filter(s => s.paymentMethod === 'cash' && 
                new Date(s.createdAt).toDateString() === new Date().toDateString())
              .reduce((sum, s) => sum + s.total, 0)
              .toLocaleString()} FCFA
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Montant réel en caisse (FCFA)
        </label>
        <input
          type="number"
          value={closingAmount}
          onChange={(e) => setClosingAmount(e.target.value)}
          placeholder="Comptez l'argent en caisse"
          autoFocus
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'right',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowCloseModal(false)}
          style={{
            flex: 1,
            padding: '12px',
            background: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Annuler
        </button>
        <button
          onClick={closeCashSession}
          disabled={!closingAmount}
          style={{
            flex: 1,
            padding: '12px',
            background: !closingAmount ? 'var(--color-border)' : 'var(--color-danger)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !closingAmount ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          Fermer la caisse
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
