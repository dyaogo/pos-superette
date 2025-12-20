import React, { useState, useEffect } from 'react';
import { Users, CreditCard, AlertTriangle, Clock, Check, Phone, Plus, Eye, FileText } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { saveCredits } from '../../services/sales.service';
import { useResponsive, getResponsiveStyles } from '../../components/ResponsiveComponents';

const CreditManagementModule = () => {
  const { customers, setCustomers, appSettings, credits, setCredits } = useApp();
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [newCredit, setNewCredit] = useState({
    customerId: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const isDark = appSettings?.darkMode;
  const { deviceType } = useResponsive();
  const sharedStyles = getResponsiveStyles(deviceType, isDark);

  // Sauvegarder automatiquement via le service
  useEffect(() => {
    saveCredits(credits);
  }, [credits]);

  // Calculer la date d'échéance par défaut (30 jours)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // Ajouter un nouveau crédit
  const addCredit = () => {
    if (!newCredit.customerId || !newCredit.amount) return;

    const credit = {
      id: Date.now(),
      customerId: parseInt(newCredit.customerId),
      amount: parseFloat(newCredit.amount),
      originalAmount: parseFloat(newCredit.amount),
      description: newCredit.description || 'Vente à crédit',
      createdAt: new Date().toISOString(),
      dueDate: newCredit.dueDate || getDefaultDueDate(),
      status: 'pending', // pending, partial, paid, overdue
      payments: [],
      remainingAmount: parseFloat(newCredit.amount)
    };

    setCredits([...credits, credit]);
    setNewCredit({ customerId: '', amount: '', description: '', dueDate: '' });
    setShowAddCreditModal(false);
  };

  // Enregistrer un paiement
  const recordPayment = () => {
    if (!selectedCredit || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount > selectedCredit.remainingAmount) {
      alert('Le montant dépasse la dette restante!');
      return;
    }

    const payment = {
      id: Date.now(),
      amount,
      date: new Date().toISOString(),
      method: 'cash' // Peut être étendu
    };

    const updatedCredits = credits.map(credit => {
      if (credit.id === selectedCredit.id) {
        const newRemainingAmount = credit.remainingAmount - amount;
        return {
          ...credit,
          payments: [...credit.payments, payment],
          remainingAmount: newRemainingAmount,
          status: newRemainingAmount === 0 ? 'paid' : 'partial'
        };
      }
      return credit;
    });

    setCredits(updatedCredits);
    setPaymentAmount('');
    setShowPaymentModal(false);
    setSelectedCredit(null);
  };

  // Obtenir le nom du client
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Client inconnu';
  };

  // Obtenir le téléphone du client
  const getCustomerPhone = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.phone : '';
  };

  // Filtrer les crédits selon l'onglet actif
  const getFilteredCredits = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'pending':
        return credits.filter(c => c.status === 'pending' || c.status === 'partial');
      case 'paid':
        return credits.filter(c => c.status === 'paid');
      case 'overdue':
        return credits.filter(c => {
          const dueDate = new Date(c.dueDate);
          return (c.status === 'pending' || c.status === 'partial') && dueDate < now;
        });
      default:
        return credits;
    }
  };

  // Calculer les statistiques
  const getStats = () => {
    const totalCredits = credits.reduce((sum, c) => sum + c.remainingAmount, 0);
    const overdueCredits = credits.filter(c => {
      const dueDate = new Date(c.dueDate);
      return (c.status === 'pending' || c.status === 'partial') && dueDate < new Date();
    });
    const overdueAmount = overdueCredits.reduce((sum, c) => sum + c.remainingAmount, 0);
    
    return {
      totalCredits,
      pendingCount: credits.filter(c => c.status === 'pending' || c.status === 'partial').length,
      overdueCount: overdueCredits.length,
      overdueAmount,
      paidCount: credits.filter(c => c.status === 'paid').length
    };
  };

  const stats = getStats();
  const filteredCredits = getFilteredCredits();

  const styles = {
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    tab: {
      padding: '12px 20px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      color: isDark ? '#cbd5e0' : '#64748b',
      borderBottom: '3px solid transparent',
      marginBottom: '-2px',
      transition: 'all 0.2s'
    },
    activeTab: {
      color: '#3b82f6',
      borderBottomColor: '#3b82f6'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      padding: '15px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }
  };

  return (
    <div style={sharedStyles.container}>
      {/* En-tête */}
      <div style={sharedStyles.header}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: isDark ? '#f7fafc' : '#2d3748' 
        }}>
          Gestion des Crédits Clients
        </h1>
        
        <button
          onClick={() => setShowAddCreditModal(true)}
          style={{ ...sharedStyles.button, background: '#3b82f6', color: 'white' }}
        >
          <Plus size={18} />
          Nouveau Crédit
        </button>
      </div>

      {/* Statistiques */}
      <div style={styles.statsGrid}>
        <div style={{
          ...styles.statCard,
          background: isDark ? '#374151' : '#eff6ff'
        }}>
          <CreditCard size={24} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
              {stats.totalCredits.toLocaleString()} {appSettings?.currency}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Total crédits en cours
            </div>
          </div>
        </div>

        <div style={{
          ...styles.statCard,
          background: isDark ? '#374151' : '#fef2f2'
        }}>
          <AlertTriangle size={24} color="#ef4444" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.overdueCount}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Crédits en retard
            </div>
          </div>
        </div>

        <div style={{
          ...styles.statCard,
          background: isDark ? '#374151' : '#f0fdf4'
        }}>
          <Check size={24} color="#10b981" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
              {stats.paidCount}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Crédits remboursés
            </div>
          </div>
        </div>

        <div style={{
          ...styles.statCard,
          background: isDark ? '#374151' : '#fffbeb'
        }}>
          <Clock size={24} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.overdueAmount.toLocaleString()} {appSettings?.currency}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Montant en retard
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'pending' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('pending')}
        >
          En cours ({stats.pendingCount})
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'overdue' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('overdue')}
        >
          En retard ({stats.overdueCount})
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'paid' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('paid')}
        >
          Remboursés ({stats.paidCount})
        </button>
      </div>

      {/* Liste des crédits */}
      <div style={sharedStyles.card}>
        {filteredCredits.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: isDark ? '#a0aec0' : '#64748b'
          }}>
            <CreditCard size={48} />
            <p style={{ marginTop: '15px' }}>
              Aucun crédit dans cette catégorie
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}` }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Client
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Montant
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Restant
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Échéance
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Statut
                  </th>
                  <th style={{ padding: '10px', textAlign: 'center', color: isDark ? '#a0aec0' : '#64748b' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.map(credit => {
                  const dueDate = new Date(credit.dueDate);
                  const isOverdue = dueDate < new Date() && credit.status !== 'paid';
                  const daysOverdue = isOverdue ? Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <tr key={credit.id} style={{ 
                      borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}`,
                      background: isOverdue ? (isDark ? '#431018' : '#fef2f2') : 'transparent'
                    }}>
                      <td style={{ padding: '12px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                        <div style={{ fontWeight: '600' }}>
                          {getCustomerName(credit.customerId)}
                        </div>
                        {getCustomerPhone(credit.customerId) && (
                          <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                            {getCustomerPhone(credit.customerId)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                        {credit.originalAmount.toLocaleString()} {appSettings?.currency}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        <span style={{ color: credit.remainingAmount > 0 ? '#ef4444' : '#10b981' }}>
                          {credit.remainingAmount.toLocaleString()} {appSettings?.currency}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                        <div>{dueDate.toLocaleDateString('fr-FR')}</div>
                        {isOverdue && (
                          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>
                            Retard: {daysOverdue} jour(s)
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: credit.status === 'paid' ? '#f0fdf4' : 
                                     credit.status === 'partial' ? '#fffbeb' :
                                     isOverdue ? '#fef2f2' : '#eff6ff',
                          color: credit.status === 'paid' ? '#166534' :
                                 credit.status === 'partial' ? '#d97706' :
                                 isOverdue ? '#dc2626' : '#1d4ed8'
                        }}>
                          {credit.status === 'paid' ? 'Payé' :
                           credit.status === 'partial' ? 'Partiel' :
                           isOverdue ? 'Retard' : 'En cours'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          {credit.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedCredit(credit);
                                setPaymentAmount(credit.remainingAmount.toString());
                                setShowPaymentModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              Paiement
                            </button>
                          )}
                          
                          {getCustomerPhone(credit.customerId) && credit.status !== 'paid' && (
                            <button
                              onClick={() => {
                                const phone = getCustomerPhone(credit.customerId);
                                const message = `Bonjour ${getCustomerName(credit.customerId)}, rappel amical: votre crédit de ${credit.remainingAmount.toLocaleString()} ${appSettings?.currency} arrive à échéance le ${new Date(credit.dueDate).toLocaleDateString('fr-FR')}. Merci!`;
                                window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#25d366',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nouveau crédit */}
      {showAddCreditModal && (
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
            background: isDark ? '#2d3748' : 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ 
              marginBottom: '20px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Nouveau Crédit Client
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Client *
              </label>
              <select
                value={newCredit.customerId}
                onChange={(e) => setNewCredit({...newCredit, customerId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748'
                }}
              >
                <option value="">Sélectionner un client</option>
                {customers.filter(c => c.id !== 1).map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `(${customer.phone})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Montant *
              </label>
              <input
                type="number"
                value={newCredit.amount}
                onChange={(e) => setNewCredit({...newCredit, amount: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Description
              </label>
              <input
                type="text"
                value={newCredit.description}
                onChange={(e) => setNewCredit({...newCredit, description: e.target.value})}
                placeholder="Vente à crédit"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Date d'échéance
              </label>
              <input
                type="date"
                value={newCredit.dueDate || getDefaultDueDate()}
                onChange={(e) => setNewCredit({...newCredit, dueDate: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddCreditModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={addCredit}
                disabled={!newCredit.customerId || !newCredit.amount}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: newCredit.customerId && newCredit.amount ? '#3b82f6' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newCredit.customerId && newCredit.amount ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal paiement */}
      {showPaymentModal && selectedCredit && (
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
            background: isDark ? '#2d3748' : 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ 
              marginBottom: '20px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Enregistrer un Paiement
            </h3>
            
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>
                  {getCustomerName(selectedCredit.customerId)}
                </strong>
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                Montant restant: {selectedCredit.remainingAmount.toLocaleString()} {appSettings?.currency}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Montant du paiement
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={selectedCredit.remainingAmount}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '16px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748'
                }}
                autoFocus
              />
              
              {/* Boutons de montants rapides */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => setPaymentAmount((selectedCredit.remainingAmount / 2).toString())}
                  style={{
                    padding: '6px 12px',
                    background: isDark ? '#4a5568' : '#e2e8f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Moitié
                </button>
                <button
                  onClick={() => setPaymentAmount(selectedCredit.remainingAmount.toString())}
                  style={{
                    padding: '6px 12px',
                    background: isDark ? '#4a5568' : '#e2e8f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Total
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedCredit(null);
                  setPaymentAmount('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={recordPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: paymentAmount && parseFloat(paymentAmount) > 0 ? '#10b981' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: paymentAmount && parseFloat(paymentAmount) > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagementModule;
