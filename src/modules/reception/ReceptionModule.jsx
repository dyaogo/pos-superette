import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  FileText,
  Download,
  Eye
} from 'lucide-react';

/**
 * Module de Réception de Commandes
 * Permet d'enregistrer les marchandises reçues et d'ajuster automatiquement le stock
 */
export default function ReceptionModule() {
  const { productCatalog, addProduct, updateProduct, loading } = useApp();
  
  // États principaux
  const [receptionItems, setReceptionItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('');
  const [activeView, setActiveView] = useState('new'); // new, history
  const [receptionHistory, setReceptionHistory] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    category: 'Divers',
    costPrice: '',
    sellingPrice: '',
    barcode: ''
  });

  // Recherche de produits
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return productCatalog
      .filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [searchQuery, productCatalog]);

  // Statistiques de réception
  const receptionStats = useMemo(() => {
    const totalItems = receptionItems.length;
    const totalQuantity = receptionItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = receptionItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    
    return { totalItems, totalQuantity, totalValue };
  }, [receptionItems]);

  // Ajouter un produit à la réception
  const addToReception = useCallback((product, quantity = 1, costPrice = null) => {
    const existingIndex = receptionItems.findIndex(item => item.productId === product.id);
    
    if (existingIndex >= 0) {
      // Mettre à jour la quantité
      const updated = [...receptionItems];
      updated[existingIndex].quantity += quantity;
      setReceptionItems(updated);
    } else {
      // Ajouter nouveau
      setReceptionItems(prev => [...prev, {
        productId: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.stock,
        quantity: quantity,
        costPrice: costPrice || product.costPrice,
        sellingPrice: product.sellingPrice,
        barcode: product.barcode
      }]);
    }
    
    setSearchQuery('');
  }, [receptionItems]);

  // Mettre à jour un item de réception
  const updateReceptionItem = useCallback((index, field, value) => {
    const updated = [...receptionItems];
    updated[index][field] = field === 'quantity' || field === 'costPrice' 
      ? parseFloat(value) || 0 
      : value;
    setReceptionItems(updated);
  }, [receptionItems]);

  // Supprimer un item
  const removeFromReception = useCallback((index) => {
    setReceptionItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Valider la réception
  const validateReception = useCallback(async () => {
    if (receptionItems.length === 0) {
      alert('❌ Aucun produit à réceptionner');
      return;
    }

    if (!supplierName.trim()) {
      alert('⚠️ Veuillez indiquer le fournisseur');
      return;
    }

    const confirmation = window.confirm(
      `📦 VALIDATION DE RÉCEPTION\n\n` +
      `Fournisseur: ${supplierName}\n` +
      `Produits: ${receptionStats.totalItems}\n` +
      `Quantité totale: ${receptionStats.totalQuantity}\n` +
      `Valeur totale: ${receptionStats.totalValue.toLocaleString()} FCFA\n\n` +
      `Confirmer la réception ?`
    );

    if (!confirmation) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Mettre à jour le stock de chaque produit
      for (const item of receptionItems) {
        const product = productCatalog.find(p => p.id === item.productId);
        if (!product) continue;

        const updatedProduct = {
          stock: product.stock + item.quantity,
          costPrice: item.costPrice, // Mettre à jour le prix d'achat si changé
        };

        const result = await updateProduct(item.productId, updatedProduct);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Enregistrer dans l'historique
      const reception = {
        id: Date.now(),
        date: new Date().toISOString(),
        supplier: supplierName,
        items: receptionItems,
        totalItems: receptionStats.totalItems,
        totalQuantity: receptionStats.totalQuantity,
        totalValue: receptionStats.totalValue,
        notes: receptionNotes,
        processedBy: 'Admin' // À remplacer par l'utilisateur connecté
      };

      setReceptionHistory(prev => [reception, ...prev]);
      
      // Sauvegarder dans localStorage
      const storedHistory = JSON.parse(localStorage.getItem('receptionHistory') || '[]');
      localStorage.setItem('receptionHistory', JSON.stringify([reception, ...storedHistory]));

      alert(
        `✅ RÉCEPTION VALIDÉE !\n\n` +
        `${successCount} produit(s) mis à jour\n` +
        (errorCount > 0 ? `❌ ${errorCount} erreur(s)` : '')
      );

      // Réinitialiser
      setReceptionItems([]);
      setSupplierName('');
      setReceptionNotes('');
      setActiveView('history');

    } catch (error) {
      console.error('Erreur validation réception:', error);
      alert('❌ Erreur lors de la validation : ' + error.message);
    }
  }, [receptionItems, supplierName, receptionNotes, receptionStats, productCatalog, updateProduct]);

  // Créer un nouveau produit à la volée
  const createNewProduct = useCallback(async () => {
    if (!newProductData.name || !newProductData.costPrice || !newProductData.sellingPrice) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    const productData = {
      name: newProductData.name,
      category: newProductData.category,
      barcode: newProductData.barcode || `BAR${Date.now()}`,
      costPrice: parseFloat(newProductData.costPrice),
      sellingPrice: parseFloat(newProductData.sellingPrice),
      stock: 0
    };

    const result = await addProduct(productData);
    
    if (result.success) {
      alert(`✅ Produit "${productData.name}" créé avec succès !`);
      setShowProductModal(false);
      setNewProductData({
        name: '',
        category: 'Divers',
        costPrice: '',
        sellingPrice: '',
        barcode: ''
      });
    } else {
      alert('❌ Erreur lors de la création du produit');
    }
  }, [newProductData, addProduct]);

  // Charger l'historique au montage
  useState(() => {
    const storedHistory = JSON.parse(localStorage.getItem('receptionHistory') || '[]');
    setReceptionHistory(storedHistory);
  }, []);

  // Export Excel
  const exportToExcel = useCallback((reception) => {
    alert('🚧 Export Excel à venir dans la prochaine mise à jour');
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            📦 Réception de Commandes
          </h1>
          <p style={{ color: '#6b7280' }}>
            Enregistrez les marchandises reçues et ajustez le stock
          </p>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveView('new')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeView === 'new' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f3f4f6',
              color: activeView === 'new' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ➕ Nouvelle réception
          </button>
          <button
            onClick={() => setActiveView('history')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeView === 'history' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f3f4f6',
              color: activeView === 'history' ? 'white' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📋 Historique
          </button>
        </div>
      </div>

      {/* Vue Nouvelle Réception */}
      {activeView === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
          {/* Colonne gauche - Liste des produits à réceptionner */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Produits à réceptionner ({receptionItems.length})
            </h2>

            {/* Barre de recherche */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Rechercher un produit (nom, code-barres)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />

              {/* Résultats de recherche */}
              {searchQuery && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {searchResults.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToReception(product)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {product.category} • Stock actuel: {product.stock} • {product.sellingPrice} FCFA
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProductModal(true)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f3f4f6',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                color: '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> Créer un nouveau produit
            </button>

            {/* Table des produits */}
            {receptionItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#9ca3af'
              }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Aucun produit ajouté
                </p>
                <p style={{ fontSize: '14px' }}>
                  Recherchez et ajoutez des produits à réceptionner
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        PRODUIT
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        STOCK ACTUEL
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        QUANTITÉ
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        PRIX D'ACHAT
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        TOTAL
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionItems.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.category}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                          {item.currentStock}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateReceptionItem(index, 'quantity', e.target.value)}
                            min="1"
                            style={{
                              width: '80px',
                              padding: '6px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            value={item.costPrice}
                            onChange={(e) => updateReceptionItem(index, 'costPrice', e.target.value)}
                            min="0"
                            step="10"
                            style={{
                              width: '100px',
                              padding: '6px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          {(item.quantity * item.costPrice).toLocaleString()} FCFA
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => removeFromReception(index)}
                            style={{
                              padding: '8px',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Colonne droite - Récapitulatif et validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Statistiques */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                📊 Récapitulatif
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Produits</span>
                  <span style={{ fontWeight: '600' }}>{receptionStats.totalItems}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Quantité totale</span>
                  <span style={{ fontWeight: '600' }}>{receptionStats.totalQuantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', background: '#f0f9ff', margin: '0 -20px', padding: '12px 20px' }}>
                  <span style={{ fontWeight: '600', color: '#1e40af' }}>Valeur totale</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                    {receptionStats.totalValue.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Informations fournisseur */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                ℹ️ Informations
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Fournisseur *
                </label>
                <input
                  type="text"
                  placeholder="Nom du fournisseur"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Notes (optionnel)
                </label>
                <textarea
                  placeholder="Bon de livraison, observations..."
                  value={receptionNotes}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Bouton validation */}
            <button
              onClick={validateReception}
              disabled={receptionItems.length === 0}
              style={{
                padding: '16px',
                background: receptionItems.length === 0 
                  ? '#e5e7eb' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: receptionItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: receptionItems.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Check size={20} />
              Valider la réception
            </button>
          </div>
        </div>
      )}

      {/* Vue Historique */}
      {activeView === 'history' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Historique des réceptions
          </h2>

          {receptionHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af'
            }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                Aucune réception enregistrée
              </p>
              <p style={{ fontSize: '14px' }}>
                Les réceptions validées apparaîtront ici
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {receptionHistory.map(reception => (
                <div
                  key={reception.id}
                  style={{
                    padding: '20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        📦 {reception.supplier}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                        <span>
                          <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(reception.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span>
                          <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {reception.processedBy}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                        {reception.totalValue.toLocaleString()} FCFA
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {reception.totalItems} produit(s) • {reception.totalQuantity} unités
                      </div>
                    </div>
                  </div>

                  {reception.notes && (
                    <div style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '16px'
                    }}>
                      📝 {reception.notes}
                    </div>
                  )}

                  <details>
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: '#3b82f6',
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      Voir les détails ({reception.items.length} produit(s))
                    </summary>
                    
                    <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>Produit</th>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600' }}>Qté</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>Prix unitaire</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reception.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px' }}>{item.name}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{item.costPrice.toLocaleString()} FCFA</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                                {(item.quantity * item.costPrice).toLocaleString()} FCFA
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal création produit */}
      {showProductModal && (
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
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                ➕ Créer un nouveau produit
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                style={{
                  padding: '8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Nom du produit *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Coca-Cola 50cl"
                  value={newProductData.name}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Catégorie *
                </label>
                <select
                  value={newProductData.category}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Divers">Divers</option>
                  <option value="Boissons">Boissons</option>
                  <option value="Alimentaire">Alimentaire</option>
                  <option value="Hygiène">Hygiène</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Prix d'achat *
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={newProductData.costPrice}
                    onChange={(e) => setNewProductData(prev => ({ ...prev, costPrice: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Prix de vente *
                  </label>
                  <input
                    type="number"
                    placeholder="800"
                    value={newProductData.sellingPrice}
                    onChange={(e) => setNewProductData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Code-barres (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Généré automatiquement si vide"
                  value={newProductData.barcode}
                  onChange={(e) => setNewProductData(prev => ({ ...prev, barcode: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                onClick={createNewProduct}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Créer le produit
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ fontWeight: '600' }}>Traitement en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
