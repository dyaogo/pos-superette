import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { ShoppingCart, Plus, Minus, Trash2, Search, User, DollarSign, Printer, X, AlertTriangle, CheckCircle } from 'lucide-react';
import ReceiptPrinter from '../components/ReceiptPrinter';
import Toast from '../components/Toast';
import NumericKeypad from '../components/NumericKeypad';

export default function POSPage() {
  const { productCatalog, recordSale, customers, loading, currentStore, salesHistory: currentStoreSales } = useApp();  
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
  const [toast, setToast] = useState(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [creditDueDate, setCreditDueDate] = useState('');

  // État pour le scan
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());

  // Calculer les produits les plus vendus avec statistiques
const getTopProducts = () => {
  const productSales = {};
  
  currentStoreSales.forEach(sale => {
    sale.items?.forEach(item => {
      const productId = item.productId;
      if (productSales[productId]) {
        productSales[productId] += item.quantity;
      } else {
        productSales[productId] = item.quantity;
      }
    });
  });
  
  // Trier et ajouter les stats
  const sortedProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productId, salesCount]) => {
      const product = productCatalog.find(p => p.id === productId);
      return product ? { ...product, salesCount } : null;
    })
    .filter(p => p !== null);
  
  return sortedProducts;
};

const topProducts = getTopProducts();

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

const showToast = (message, type = 'success') => {
  setToast({ message, type });
};

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
  )
    .sort((a, b) => a.name.localeCompare(b.name)); // TRI ALPHABÉTIQUE AJOUTÉ


// Ajouter au panier avec feedback visuel
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
  
  // Animation de feedback (optionnel)
  showToast(`${product.name} ajouté au panier`, 'success');
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

// Finaliser la vente - VERSION AVEC CRÉDIT
const completeSale = async () => {
  if (cart.length === 0) {
    showToast('Le panier est vide', 'error');
    return;
  }

  // Validation crédit
  if (paymentMethod === 'credit') {
    if (!selectedCustomer || selectedCustomer.id === '') {
      showToast('Sélectionnez un client pour vente à crédit', 'error');
      return;
    }
    if (!creditDueDate) {
      showToast('Date d\'échéance requise pour vente à crédit', 'error');
      return;
    }
  }

  // Vérifier si paiement espèces avec montant insuffisant
  if (paymentMethod === 'cash' && cashReceived) {
    const received = parseFloat(cashReceived);
    if (received < total) {
      showToast(`Montant insuffisant. Manque ${(total - received).toLocaleString()} FCFA`, 'error');
      return;
    }
  }

  setIsProcessingSale(true);

  const saleData = {
    customerId: selectedCustomer?.id || null,
    total,
    paymentMethod,
    cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) || total : null,
    change: paymentMethod === 'cash' ? calculateChange() : null,
    items: cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.sellingPrice
    }))
  };

  const result = await recordSale(saleData);

  // Si vente à crédit, créer l'enregistrement de crédit
  if (result.success && paymentMethod === 'credit') {
    try {
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: total,
          description: `Vente ${result.sale.receiptNumber}`,
          dueDate: creditDueDate
        })
      });
    } catch (error) {
      console.error('Erreur création crédit:', error);
    }
  }

  setIsProcessingSale(false);

  if (result.success) {
    setLastSale(result.sale);
    
    if (paymentMethod === 'credit') {
      showToast(`Vente à crédit enregistrée ! Échéance: ${new Date(creditDueDate).toLocaleDateString('fr-FR')}`, 'success');
    } else if (result.offline) {
      showToast('Vente enregistrée hors ligne ! Synchronisation en attente.', 'info');
    } else {
      showToast(`Vente enregistrée ! Total: ${total.toLocaleString()} FCFA`, 'success');
    }
    
    setShowReceipt(true);
    
    // Réinitialiser
    setCart([]);
    setSearchTerm('');
    setSelectedCustomer(null);
    setCashReceived('');
    setCreditDueDate('');
  } else {
    showToast('Erreur lors de l\'enregistrement de la vente', 'error');
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
    showToast('Aucun magasin sélectionné', 'error');
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
      showToast('Session de caisse ouverte !', 'success');
    } else {
      const error = await res.json();
      showToast(error.error, 'error');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
  }
};

// Fermer une session
const closeCashSession = async () => {
  if (!cashSession || !closingAmount) {
    showToast('Montant de fermeture requis', 'error');
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
      
      // Message détaillé
      const message = `Session fermée !\n` +
        `Attendu: ${closedSession.expectedAmount.toLocaleString()} FCFA\n` +
        `Réel: ${closedSession.closingAmount.toLocaleString()} FCFA\n` +
        `Écart: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} FCFA\n` +
        (diff === 0 ? '✅ Parfait !' : diff > 0 ? '💰 Surplus' : '⚠️ Manque');
      
      showToast(message, diff === 0 ? 'success' : 'info');
      
      setCashSession(null);
      setShowCloseModal(false);
      setClosingAmount('');
    }
  } catch (error) {
    showToast('Erreur: ' + error.message, 'error');
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

        {/* Barre de recherche */}
<div style={{ marginBottom: '20px' }}>
  <div style={{ position: 'relative' }}>
    <Search 
      size={20} 
      style={{ 
        position: 'absolute', 
        left: '12px', 
        top: '50%', 
        transform: 'translateY(-50%)',
        color: 'var(--color-text-muted)'
      }} 
    />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Rechercher un produit (nom ou code-barres)..."
      autoFocus
      style={{
        width: '100%',
        padding: '12px 12px 12px 45px',
        border: '2px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '16px',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)'
      }}
    />
  </div>
</div>

{/* NOUVELLE SECTION - Produits populaires */}
{topProducts.length > 0 && searchTerm === '' && (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      marginBottom: '12px',
      color: 'var(--color-text-primary)'
    }}>
      <span style={{ fontSize: '18px' }}>⭐</span>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
        Produits populaires
      </h3>
      <span style={{ 
        fontSize: '12px', 
        color: 'var(--color-text-muted)',
        background: 'var(--color-surface-hover)',
        padding: '2px 8px',
        borderRadius: '10px'
      }}>
        Les plus vendus
      </span>
    </div>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
      gap: '10px',
      padding: '15px',
      background: 'var(--color-surface)',
      borderRadius: '12px',
      border: '2px solid var(--color-primary)',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
    }}>
      {topProducts.map(product => (
        <div
          key={product.id}
          onClick={() => addToCart(product)}
          style={{
            background: 'var(--color-bg)',
            border: '2px solid var(--color-border)',
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Badge "Populaire" */}
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            ⭐ TOP
          </div>
          
          {/* Image du produit */}
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '6px',
                marginBottom: '8px',
                background: 'var(--color-surface-hover)'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '80px',
                background: 'var(--color-surface-hover)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '8px'
              }}
            >
              📦
            </div>
          )}
          
          <div>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '13px', 
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {product.name}
            </div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: 'var(--color-primary)' 
            }}>
              {product.sellingPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Liste complète des produits */}
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
  gap: '15px', 
  marginTop: '20px' 
}}></div>

        {/* Grille de produits */}
        {/* Liste des produits */}
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
  gap: '15px', 
  marginTop: '20px' 
}}>
  {filteredProducts.map(product => (
    <div
      key={product.id}
      onClick={() => addToCart(product)}
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image du produit */}
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'cover',
            borderRadius: '8px',
            background: 'var(--color-surface-hover)'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '120px',
            background: 'var(--color-surface-hover)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '48px'
          }}
        >
          📦
        </div>
      )}
      
      <div>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
          {product.name}
        </div>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: 'var(--color-primary)' 
        }}>
          {product.sellingPrice.toLocaleString()} FCFA
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--color-text-secondary)',
          marginTop: '4px'
        }}>
          Stock: {product.stock}
        </div>
      </div>
    </div>
  ))}
</div>
      </div>


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
  
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: selectedCustomer && selectedCustomer.id !== '' ? '1fr 1fr 1fr' : '1fr 1fr', 
    gap: '8px' 
  }}>
    {['cash', 'mobile', ...(selectedCustomer && selectedCustomer.id !== '' ? ['credit'] : [])].map(method => (
      <button
        key={method}
        onClick={() => setPaymentMethod(method)}
        style={{
          padding: '12px',
          background: paymentMethod === method ? 'var(--color-primary)' : 'var(--color-surface)',
          color: paymentMethod === method ? 'white' : 'var(--color-text-primary)',
          border: `2px solid ${paymentMethod === method ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.2s'
        }}
      >
        {method === 'cash' ? '💵 Espèces' : method === 'mobile' ? '📱 Mobile' : '📝 Crédit'}
      </button>
    ))}
  </div>
</div>

{/* Date d'échéance pour crédit */}
{paymentMethod === 'credit' && (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
      Date d'échéance
    </label>
    <input
      type="date"
      value={creditDueDate}
      onChange={(e) => setCreditDueDate(e.target.value)}
      min={new Date().toISOString().split('T')[0]}
      style={{
        width: '100%',
        padding: '10px',
        border: '2px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '14px',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)'
      }}
    />
  </div>
)}

{/* Calcul de rendu pour paiement espèces */}
{paymentMethod === 'cash' && (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
      Montant reçu (FCFA)
    </label>
    
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        value={cashReceived}
        onChange={(e) => setCashReceived(e.target.value)}
        placeholder="Montant donné par le client"
        style={{
          width: '100%',
          padding: '10px',
          paddingRight: '45px',
          border: '2px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'right',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)'
        }}
      />
      
      {/* Bouton clavier numérique */}
      <button
        onClick={() => setShowKeypad(true)}
        style={{
          position: 'absolute',
          right: '5px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '8px',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        🔢
      </button>
    </div>
    
    {/* Montants suggérés */}
    <div style={{ marginTop: '10px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Montants suggérés:
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {[
          Math.ceil(total / 500) * 500,
          Math.ceil(total / 1000) * 1000,
          Math.ceil(total / 2000) * 2000,
          Math.ceil(total / 5000) * 5000,
          Math.ceil(total / 10000) * 10000
        ]
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 6)
          .map(amount => (
            <button
              key={amount}
              onClick={() => setCashReceived(amount.toString())}
              style={{
                padding: '8px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-surface)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
            >
              {amount.toLocaleString()}
            </button>
          ))
        }
      </div>
    </div>
    
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
  disabled={cart.length === 0 || !cashSession || isProcessingSale}
  style={{
    width: '100%',
    padding: '18px',
    background: cart.length === 0 || !cashSession || isProcessingSale 
      ? 'var(--color-border)' 
      : 'var(--color-success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: cart.length === 0 || !cashSession || isProcessingSale 
      ? 'not-allowed' 
      : 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    opacity: isProcessingSale ? 0.7 : 1
  }}
>
  {isProcessingSale ? (
    <>
      <div className="spinner" style={{
        width: '20px',
        height: '20px',
        border: '3px solid rgba(255,255,255,0.3)',
        borderTop: '3px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      Traitement...
    </>
  ) : (
    <>
      <ShoppingCart size={24} />
      Finaliser la vente (F3)
    </>
  )}
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

      <div style={{ 
  fontSize: '11px', 
  color: 'var(--color-text-muted)',
  marginTop: '2px'
}}>
  🔥 {product.salesCount} vendus
</div>

    </div>
  </div>
)}

<style jsx>{`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`}</style>

{/* Toast Notifications */}
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}

{/* Clavier numérique */}
{showKeypad && (
  <NumericKeypad
    value={cashReceived}
    onChange={setCashReceived}
    onClose={() => setShowKeypad(false)}
  />
)}


    </div>
  );
}
