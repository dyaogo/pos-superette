import React, { useState, useEffect } from 'react';
import { Calculator, Clock, DollarSign, FileText, Printer, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

import {
  getCashSession,
  saveCashSession,
  getCashOperations,
  saveCashOperations,
  addCashReport,
  clearCashData,
} from '../../services/cash.service';
import { useResponsive, getResponsiveStyles } from '../../components/ResponsiveComponents';

const CashRegisterModule = () => {
  const { salesHistory, appSettings } = useApp();
  const [cashSession, setCashSession] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [closingCash, setClosingCash] = useState('');
  const [cashOperations, setCashOperations] = useState([]);
  const [notes, setNotes] = useState('');

  const isDark = appSettings.darkMode;
  const { deviceType } = useResponsive();
  const sharedStyles = getResponsiveStyles(deviceType, isDark);

  // Charger la session de caisse actuelle
  useEffect(() => {
    const session = getCashSession();
    const operations = getCashOperations();
    if (session) {
      setCashSession(session);
    }
    if (operations.length) {
      setCashOperations(operations);
    }
  }, []);

  // Sauvegarder automatiquement via le service
  useEffect(() => {
    saveCashSession(cashSession);
    saveCashOperations(cashOperations);
  }, [cashSession, cashOperations]);

  // Calculer les ventes de la session actuelle
  const getSessionSales = () => {
    if (!cashSession) return [];
    
    return salesHistory.filter(sale => 
      new Date(sale.date) >= new Date(cashSession.openedAt)
    );
  };

  // Calculer les totaux de la session
  const getSessionTotals = () => {
  const sessionSales = getSessionSales();
  const cashSales = sessionSales.filter(s => s.paymentMethod === 'cash');
  const cardSales = sessionSales.filter(s => s.paymentMethod === 'card');
  
  // ✅ NOUVEAU : Calculer les opérations de caisse (entrées/sorties)
  const cashOperationsTotal = cashOperations.reduce((total, op) => {
    if (op.type === 'in') {
      return total + op.amount;
    } else if (op.type === 'out') {
      return total - op.amount;
    }
    return total; // Ignorer les opérations d'ouverture/fermeture
  }, 0);

  return {
    totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
    cashSales: cashSales.reduce((sum, s) => sum + s.total, 0),
    cardSales: cardSales.reduce((sum, s) => sum + s.total, 0),
    transactionCount: sessionSales.length,
    cashTransactions: cashSales.length,
    cardTransactions: cardSales.length,
    cashOperationsTotal // ✅ NOUVEAU : Total des opérations de caisse
  };
};

  // Ouvrir la caisse
  const openRegister = () => {
    const session = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: 'Caissier Principal', // À personnaliser selon votre système d'utilisateurs
      openingAmount: parseFloat(openingAmount),
      status: 'open'
    };
    
    setCashSession(session);
    
    // Ajouter l'opération d'ouverture
    const operation = {
      id: Date.now(),
      type: 'opening',
      amount: parseFloat(openingAmount),
      timestamp: new Date().toISOString(),
      description: 'Ouverture de caisse',
      user: 'Caissier Principal'
    };
    
    setCashOperations([operation]);
    setShowOpenModal(false);
    setOpeningAmount('50000');
  };

  // Fermer la caisse
  const closeRegister = () => {
    if (!cashSession || !closingCash) return;
    
    const totals = getSessionTotals();
    const expectedCash = cashSession.openingAmount + totals.cashSales + (totals.cashOperationsTotal || 0);
    const actualCash = parseFloat(closingCash);
    const difference = actualCash - expectedCash;
    
    // Créer le rapport de clôture
    const closingReport = {
      sessionId: cashSession.id,
      closedAt: new Date().toISOString(),
      closedBy: 'Caissier Principal',
      openingAmount: cashSession.openingAmount,
      expectedCash,
      actualCash,
      difference,
      totals,
      notes,
      operations: cashOperations
    };
    
    // Sauvegarder le rapport
    addCashReport(closingReport);
    
    // Fermer la session
    setCashSession(null);
    setCashOperations([]);
    clearCashData();
    
    setShowCloseModal(false);
    setClosingCash('');
    setNotes('');
    
    // Afficher le résumé
    alert(`Caisse fermée!\nÉcart: ${difference.toLocaleString()} ${appSettings.currency}\n${difference === 0 ? 'Parfait!' : difference > 0 ? 'Surplus' : 'Manque'}`);
  };

  // Ajouter une opération de caisse
  const addCashOperation = (type, amount, description) => {
    const operation = {
      id: Date.now(),
      type, // 'in', 'out', 'opening', 'closing'
      amount: parseFloat(amount),
      timestamp: new Date().toISOString(),
      description,
      user: 'Caissier Principal'
    };
    
    setCashOperations([...cashOperations, operation]);
  };

  const totals = cashSession ? getSessionTotals() : null;
  const expectedCash = cashSession ? 
  cashSession.openingAmount + (totals?.cashSales || 0) + (totals?.cashOperationsTotal || 0) : 0;

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px'
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
          Gestion de Caisse
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {!cashSession ? (
            <button
              onClick={() => setShowOpenModal(true)}
              style={{ ...sharedStyles.button, background: '#10b981', color: 'white' }}
            >
              <CheckCircle size={18} />
              Ouvrir la caisse
            </button>
          ) : (
            <button
              onClick={() => setShowCloseModal(true)}
              style={{ ...sharedStyles.button, background: '#ef4444', color: 'white' }}
            >
              <XCircle size={18} />
              Fermer la caisse
            </button>
          )}
        </div>
      </div>

      {!cashSession ? (
        // Caisse fermée
        <div style={sharedStyles.card}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ 
              fontSize: '20px', 
              marginBottom: '10px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Caisse Fermée
            </h2>
            <p style={{ color: isDark ? '#a0aec0' : '#64748b', marginBottom: '20px' }}>
              Ouvrez la caisse pour commencer les opérations de la journée
            </p>
            <button
              onClick={() => setShowOpenModal(true)}
              style={{ ...sharedStyles.button, background: '#10b981', color: 'white' }}
            >
              <CheckCircle size={18} />
              Ouvrir la caisse
            </button>
          </div>
        </div>
      ) : (
        // Caisse ouverte - Tableau de bord
        <>
          {/* Statut de la session */}
          <div style={sharedStyles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  margin: 0
                }}>
                  Caisse Ouverte
                </h3>
                <p style={{ 
                  color: isDark ? '#a0aec0' : '#64748b',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Session ouverte le {new Date(cashSession.openedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            
            <div style={styles.grid}>
              <div>
                <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                  Fond de caisse initial
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {cashSession.openingAmount.toLocaleString()} {appSettings.currency}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                  Espèces attendues
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {expectedCash.toLocaleString()} {appSettings.currency}
                </div>
              </div>
            </div>
          </div>

          {/* Résumé des ventes */}
          {totals && (
            <div style={sharedStyles.card}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '15px',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Résumé des Ventes
              </h3>
              
              <div style={styles.grid}>
                <div style={{ 
                  padding: '15px', 
                  background: isDark ? '#374151' : '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <DollarSign size={20} color="#3b82f6" />
                    <span style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                      Total des ventes
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    {totals.totalSales.toLocaleString()} {appSettings.currency}
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                    {totals.transactionCount} transactions
                  </div>
                </div>

                <div style={{ 
                  padding: '15px', 
                  background: isDark ? '#374151' : '#f0fdf4',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Calculator size={20} color="#10b981" />
                    <span style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                      Ventes espèces
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    {totals.cashSales.toLocaleString()} {appSettings.currency}
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                    {totals.cashTransactions} transactions
                  </div>
                </div>

                <div style={{ 
                  padding: '15px', 
                  background: isDark ? '#374151' : '#eff6ff',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <FileText size={20} color="#6366f1" />
                    <span style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#64748b' }}>
                      Ventes carte
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6366f1' }}>
                    {totals.cardSales.toLocaleString()} {appSettings.currency}
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                    {totals.cardTransactions} transactions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opérations de caisse */}
          <div style={sharedStyles.card}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '15px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Opérations de Caisse
            </h3>
            
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '6px'
            }}>
              <table style={{ width: '100%' }}>
                <thead style={{ 
                  background: isDark ? '#374151' : '#f8fafc',
                  position: 'sticky',
                  top: 0
                }}>
                  <tr>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'left',
                      color: isDark ? '#a0aec0' : '#64748b',
                      fontSize: '12px'
                    }}>
                      Heure
                    </th>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'left',
                      color: isDark ? '#a0aec0' : '#64748b',
                      fontSize: '12px'
                    }}>
                      Type
                    </th>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'left',
                      color: isDark ? '#a0aec0' : '#64748b',
                      fontSize: '12px'
                    }}>
                      Description
                    </th>
                    <th style={{ 
                      padding: '10px', 
                      textAlign: 'right',
                      color: isDark ? '#a0aec0' : '#64748b',
                      fontSize: '12px'
                    }}>
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cashOperations.map(op => (
                    <tr key={op.id} style={{ 
                      borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}`
                    }}>
                      <td style={{ 
                        padding: '8px 10px',
                        fontSize: '14px',
                        color: isDark ? '#f7fafc' : '#2d3748'
                      }}>
                        {new Date(op.timestamp).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td style={{ 
                        padding: '8px 10px',
                        fontSize: '14px',
                        color: isDark ? '#f7fafc' : '#2d3748'
                      }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: op.type === 'opening' ? '#f0fdf4' : 
                                     op.type === 'in' ? '#eff6ff' : '#fef2f2',
                          color: op.type === 'opening' ? '#166534' : 
                                 op.type === 'in' ? '#1d4ed8' : '#dc2626'
                        }}>
                          {op.type === 'opening' ? 'Ouverture' : 
                           op.type === 'in' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '8px 10px',
                        fontSize: '14px',
                        color: isDark ? '#a0aec0' : '#64748b'
                      }}>
                        {op.description}
                      </td>
                      <td style={{ 
                        padding: '8px 10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'right',
                        color: op.type === 'out' ? '#ef4444' : '#10b981'
                      }}>
                        {op.type === 'out' ? '-' : '+'}{op.amount.toLocaleString()} {appSettings.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal d'ouverture */}
      {showOpenModal && (
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
              Ouverture de Caisse
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Fond de caisse initial
              </label>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
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
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowOpenModal(false)}
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
                onClick={openRegister}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fermeture */}
      {showCloseModal && (
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
              Fermeture de Caisse
            </h3>
            
            {/* Récapitulatif */}
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Fond initial:</span>
                <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                  {cashSession.openingAmount.toLocaleString()} {appSettings.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ventes espèces:</span>
                <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                  {(totals?.cashSales || 0).toLocaleString()} {appSettings.currency}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
              }}>
                <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>Attendu:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {expectedCash.toLocaleString()} {appSettings.currency}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Montant réel en caisse
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
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
              
              {/* Calcul d'écart en temps réel */}
              {closingCash && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '6px',
                  background: Math.abs(parseFloat(closingCash) - expectedCash) === 0 ? 
                    '#f0fdf4' : '#fef2f2',
                  color: Math.abs(parseFloat(closingCash) - expectedCash) === 0 ? 
                    '#166534' : '#dc2626'
                }}>
                  <div style={{ fontWeight: '600' }}>
                    Écart: {(parseFloat(closingCash) - expectedCash).toLocaleString()} {appSettings.currency}
                    {Math.abs(parseFloat(closingCash) - expectedCash) === 0 && ' ✅ Parfait!'}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaires sur la journée..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCloseModal(false)}
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
                onClick={closeRegister}
                disabled={!closingCash}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: closingCash ? '#ef4444' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: closingCash ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Fermer Caisse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterModule;
