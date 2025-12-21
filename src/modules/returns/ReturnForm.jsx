import React, { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ReturnForm = () => {
  const { salesHistory, appSettings, setReturnsHistory, returnsHistory } = useApp();
  const [selectedSale, setSelectedSale] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const isDark = appSettings?.darkMode;

  const sale = salesHistory?.find(s => s.id === selectedSale);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert('Sélectionnez au moins un article à retourner');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

    // Créer le retour optimiste
    const optimisticReturn = {
      id: `temp-${Date.now()}`,
      saleId: selectedSale,
      reason,
      amount: totalAmount,
      refundMethod,
      items: selectedItems,
      createdAt: new Date().toISOString(),
      processedBy: 'Admin'
    };

    // Ajouter à l'historique local
    const newReturns = [optimisticReturn, ...(returnsHistory || [])];
    setReturnsHistory(newReturns);

    // Sauvegarder dans localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('returns_history', JSON.stringify(newReturns));
      } catch (e) {
        console.warn('Erreur sauvegarde localStorage:', e);
      }
    }

    // Enregistrer dans la DB
    try {
      const returnData = {
        saleId: selectedSale,
        reason,
        refundMethod,
        items: selectedItems
      };

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });

      if (res.ok) {
        console.log('✅ Retour enregistré dans la DB');
      }
    } catch (error) {
      console.warn('⚠️ Erreur API retour:', error);
    }

    // Réinitialiser le formulaire
    setSelectedSale('');
    setReason('');
    setRefundMethod('cash');
    setSelectedItems([]);

    // Afficher message de succès
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.productId === item.productId);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.productId));
    } else {
      setSelectedItems([...selectedItems, {
        productId: item.productId,
        productName: item.name || item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }]);
    }
  };

  const styles = {
    container: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      fontSize: '14px',
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px'
    },
    itemsBox: {
      padding: '16px',
      background: isDark ? '#374151' : '#f7fafc',
      borderRadius: '8px',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    itemLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      marginBottom: '8px',
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      cursor: 'pointer',
      border: `2px solid transparent`,
      transition: 'all 0.2s'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    refundMethods: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px'
    },
    methodButton: (isActive) => ({
      padding: '12px',
      borderRadius: '8px',
      border: `2px solid ${isActive ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
      background: isActive ? '#3b82f6' : (isDark ? '#374151' : 'white'),
      color: isActive ? 'white' : (isDark ? '#f7fafc' : '#2d3748'),
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
      transition: 'all 0.2s'
    }),
    submitButton: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
    },
    successMessage: {
      padding: '12px 16px',
      background: '#10b981',
      color: 'white',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600'
    }
  };

  return (
    <div style={styles.container}>
      {showSuccess && (
        <div style={styles.successMessage}>
          <Check size={20} />
          Retour enregistré avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Sélectionner une vente *</label>
          <select
            value={selectedSale}
            onChange={(e) => {
              setSelectedSale(e.target.value);
              setSelectedItems([]);
            }}
            required
            style={styles.select}
          >
            <option value="">Choisir une vente...</option>
            {(salesHistory || []).slice(0, 50).map(s => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt).toLocaleDateString('fr-FR')} - {s.total?.toLocaleString() || 0} FCFA - {s.items?.length || 0} article(s)
              </option>
            ))}
          </select>
        </div>

        {sale && sale.items && sale.items.length > 0 && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Articles de la vente</label>
            <div style={styles.itemsBox}>
              {sale.items.map((item, index) => (
                <label
                  key={item.id || index}
                  style={{
                    ...styles.itemLabel,
                    borderColor: selectedItems.some(i => i.productId === item.productId) ? '#3b82f6' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedItems.some(i => i.productId === item.productId)) {
                      e.currentTarget.style.borderColor = isDark ? '#4a5568' : '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedItems.some(i => i.productId === item.productId)) {
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.some(i => i.productId === item.productId)}
                    onChange={() => toggleItem(item)}
                    style={styles.checkbox}
                  />
                  <span style={{ flex: 1 }}>
                    {item.name || item.productName} - <strong>{item.quantity}</strong> × {item.unitPrice?.toLocaleString() || 0} FCFA
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                    {(item.total || 0).toLocaleString()} FCFA
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Raison du retour *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Décrivez la raison du retour..."
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Méthode de remboursement *</label>
          <div style={styles.refundMethods}>
            <button
              type="button"
              onClick={() => setRefundMethod('cash')}
              style={styles.methodButton(refundMethod === 'cash')}
            >
              💵 Espèces
            </button>
            <button
              type="button"
              onClick={() => setRefundMethod('mobile')}
              style={styles.methodButton(refundMethod === 'mobile')}
            >
              📱 Mobile
            </button>
            <button
              type="button"
              onClick={() => setRefundMethod('credit')}
              style={styles.methodButton(refundMethod === 'credit')}
            >
              📝 Crédit
            </button>
          </div>
        </div>

        <button
          type="submit"
          style={styles.submitButton}
          disabled={!selectedSale || selectedItems.length === 0}
          onMouseEnter={(e) => {
            if (selectedSale && selectedItems.length > 0) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
          }}
        >
          <Check size={20} />
          Enregistrer le retour
        </button>
      </form>
    </div>
  );
};

export default ReturnForm;
