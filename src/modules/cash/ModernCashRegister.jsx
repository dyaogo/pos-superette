import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, Clock, Users, TrendingUp, AlertTriangle, 
  Lock, Unlock, Plus, Minus, FileText, Download 
} from 'lucide-react';

// Hook personnalisé pour la gestion de caisse
const useCashSession = (salesHistory, appSettings) => {
  const [session, setSession] = useState(null);
  const [operations, setOperations] = useState([]);

  // Charger la session depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cash_session_v2');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        console.error('Erreur chargement session:', e);
      }
    }

    const storedOps = localStorage.getItem('cash_operations_v2');
    if (storedOps) {
      try {
        setOperations(JSON.parse(storedOps));
      } catch (e) {
        console.error('Erreur chargement opérations:', e);
      }
    }
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (session) {
      localStorage.setItem('cash_session_v2', JSON.stringify(session));
    } else {
      localStorage.removeItem('cash_session_v2');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('cash_operations_v2', JSON.stringify(operations));
  }, [operations]);

  // Calculer les ventes de la session
  const sessionSales = useMemo(() => {
    if (!session || !salesHistory?.length) return [];

    const sessionStart = new Date(session.openedAt);
    
    return salesHistory.filter(sale => {
      if (!sale?.date) return false;
      const saleDate = new Date(sale.date);
      return !isNaN(saleDate.getTime()) && saleDate >= sessionStart;
    }).filter(sale => {
      // Filtrer seulement les ventes valides
      return sale.total && sale.total > 0;
    });
  }, [session, salesHistory]);

  // Calculer les totaux
  const totals = useMemo(() => {
    if (!sessionSales.length) {
      return {
        totalSales: 0,
        cashSales: 0,
        cardSales: 0,
        creditSales: 0,
        transactionCount: 0,
        operationsTotal: 0
      };
    }

    // Séparer par méthode de paiement (en gérant les données corrompues)
    const validSales = sessionSales.filter(s => s.paymentMethod && typeof s.paymentMethod === 'string');
    const cashSales = validSales.filter(s => s.paymentMethod === 'cash');
    const cardSales = validSales.filter(s => s.paymentMethod === 'card');
    const creditSales = validSales.filter(s => s.paymentMethod === 'credit');

    // Si aucune vente valide avec paymentMethod string, traiter toutes comme espèces
    const fallbackToAll = validSales.length === 0 && sessionSales.length > 0;

    const operationsTotal = operations.reduce((total, op) => {
      if (op.type === 'in') return total + op.amount;
      if (op.type === 'out') return total - op.amount;
      return total;
    }, 0);

    return {
      totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
      cashSales: fallbackToAll 
        ? sessionSales.reduce((sum, s) => sum + s.total, 0)
        : cashSales.reduce((sum, s) => sum + s.total, 0),
      cardSales: cardSales.reduce((sum, s) => sum + s.total, 0),
      creditSales: creditSales.reduce((sum, s) => sum + s.total, 0),
      transactionCount: sessionSales.length,
      operationsTotal
    };
  }, [sessionSales, operations]);

  // Fonctions de gestion
  const openSession = useCallback((initialAmount, operator = 'Caissier') => {
    const newSession = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: operator,
      initialAmount: parseFloat(initialAmount),
      status: 'open'
    };

    const openOperation = {
      id: Date.now(),
      type: 'opening',
      amount: parseFloat(initialAmount),
      timestamp: new Date().toISOString(),
      description: 'Ouverture de caisse',
      operator
    };

    setSession(newSession);
    setOperations([openOperation]);
  }, []);

  const closeSession = useCallback((actualAmount, notes = '', operator = 'Caissier') => {
    if (!session) return null;

    const expectedAmount = session.initialAmount + totals.cashSales + totals.operationsTotal;
    const difference = parseFloat(actualAmount) - expectedAmount;

    const closingReport = {
      sessionId: session.id,
      openedAt: session.openedAt,
      closedAt: new Date().toISOString(),
      openedBy: session.openedBy,
      closedBy: operator,
      initialAmount: session.initialAmount,
      expectedAmount,
      actualAmount: parseFloat(actualAmount),
      difference,
      totals,
      notes,
      operations
    };

    // Sauvegarder le rapport
    const reports = JSON.parse(localStorage.getItem('cash_reports_v2') || '[]');
    reports.push(closingReport);
    localStorage.setItem('cash_reports_v2', JSON.stringify(reports));

    // Fermer la session
    setSession(null);
    setOperations([]);

    return closingReport;
  }, [session, totals]);

  const addOperation = useCallback((type, amount, description, operator = 'Caissier') => {
    const operation = {
      id: Date.now(),
      type, // 'in' ou 'out'
      amount: parseFloat(amount),
      timestamp: new Date().toISOString(),
      description,
      operator
    };

    setOperations(prev => [...prev, operation]);
    return operation;
  }, []);

  return {
    session,
    operations,
    sessionSales,
    totals,
    openSession,
    closeSession,
    addOperation,
    expectedAmount: session ? session.initialAmount + totals.cashSales + totals.operationsTotal : 0
  };
};

// Composant principal
const ModernCashRegister = ({ salesHistory = [], appSettings = {} }) => {
  const {
    session,
    operations,
    sessionSales,
    totals,
    openSession,
    closeSession,
    addOperation,
    expectedAmount
  } = useCashSession(salesHistory, appSettings);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('25000');
  const [actualAmount, setActualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [operationType, setOperationType] = useState('in');
  const [operationAmount, setOperationAmount] = useState('');
  const [operationDescription, setOperationDescription] = useState('');

  const isDark = appSettings.darkMode;
  const currency = appSettings.currency || 'FCFA';

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const handleOpenSession = () => {
    openSession(initialAmount);
    setShowOpenModal(false);
    setInitialAmount('25000');
  };

  const handleCloseSession = () => {
    const report = closeSession(actualAmount, notes);
    setShowCloseModal(false);
    setActualAmount('');
    setNotes('');
    
    if (report) {
      const message = `Caisse fermée!\nÉcart: ${formatAmount(report.difference)} ${currency}\n${
        report.difference === 0 ? 'Parfait!' : 
        report.difference > 0 ? 'Surplus' : 'Manque'
      }`;
      alert(message);
    }
  };

  const handleAddOperation = () => {
    addOperation(operationType, operationAmount, operationDescription);
    setShowOperationModal(false);
    setOperationAmount('');
    setOperationDescription('');
  };

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: isDark ? '#1f2937' : '#f8fafc',
      minHeight: '100vh'
    },
    card: {
      backgroundColor: isDark ? '#374151' : 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: isDark ? '#f9fafb' : '#111827',
      margin: 0
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: isDark ? '#4b5563' : '#6b7280',
      color: 'white'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    metric: {
      padding: '20px',
      backgroundColor: isDark ? '#4b5563' : '#f8fafc',
      borderRadius: '8px',
      textAlign: 'center'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: '4px'
    },
    metricLabel: {
      fontSize: '14px',
      color: isDark ? '#9ca3af' : '#6b7280'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: isDark ? '#374151' : 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '500px'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#4b5563' : 'white',
      color: isDark ? '#f9fafb' : '#111827',
      fontSize: '14px',
      marginBottom: '16px',
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      borderBottom: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
      color: isDark ? '#f9fafb' : '#111827',
      fontWeight: '600'
    },
    td: {
      padding: '12px',
      borderBottom: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
      color: isDark ? '#d1d5db' : '#374151'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion de Caisse Moderne</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!session ? (
            <button
              onClick={() => setShowOpenModal(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Unlock size={16} />
              Ouvrir la caisse
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowOperationModal(true)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                <Plus size={16} />
                Opération
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                style={{ ...styles.button, ...styles.dangerButton }}
              >
                <Lock size={16} />
                Fermer la caisse
              </button>
            </>
          )}
        </div>
      </div>

      {!session ? (
        /* Caisse fermée */
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Lock size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: isDark ? '#f9fafb' : '#111827' }}>
              Caisse Fermée
            </h2>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '32px' }}>
              Ouvrez la caisse pour commencer les opérations de la journée
            </p>
            <button
              onClick={() => setShowOpenModal(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Unlock size={16} />
              Ouvrir la caisse
            </button>
          </div>
        </div>
      ) : (
        /* Caisse ouverte */
        <>
          {/* Statut de la session */}
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <Unlock size={24} color="#10b981" />
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', margin: 0 }}>
                  Caisse Ouverte
                </h3>
                <p style={{ color: isDark ? '#9ca3af' : '#6b7280', margin: 0 }}>
                  Session ouverte le {new Date(session.openedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(session.initialAmount)} {currency}</div>
                <div style={styles.metricLabel}>Fond initial</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(expectedAmount)} {currency}</div>
                <div style={styles.metricLabel}>Espèces attendues</div>
              </div>
            </div>
          </div>

          {/* Résumé des ventes */}
          <div style={styles.card}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: isDark ? '#f9fafb' : '#111827' }}>
              Résumé des Ventes
            </h3>
            <div style={styles.grid}>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(totals.totalSales)} {currency}</div>
                <div style={styles.metricLabel}>Total des ventes ({totals.transactionCount})</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(totals.cashSales)} {currency}</div>
                <div style={styles.metricLabel}>Ventes espèces</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(totals.cardSales)} {currency}</div>
                <div style={styles.metricLabel}>Ventes carte</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>{formatAmount(totals.operationsTotal)} {currency}</div>
                <div style={styles.metricLabel}>Opérations caisse</div>
              </div>
            </div>
          </div>

          {/* Opérations de caisse */}
          {operations.length > 0 && (
            <div style={styles.card}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: isDark ? '#f9fafb' : '#111827' }}>
                Opérations de Caisse
              </h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Heure</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map(op => (
                    <tr key={op.id}>
                      <td style={styles.td}>
                        {new Date(op.timestamp).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: op.type === 'opening' ? '#ddd6fe' : 
                                          op.type === 'in' ? '#dcfce7' : '#fee2e2',
                          color: op.type === 'opening' ? '#7c3aed' : 
                                op.type === 'in' ? '#16a34a' : '#dc2626'
                        }}>
                          {op.type === 'opening' ? 'Ouverture' : 
                           op.type === 'in' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td style={styles.td}>{op.description}</td>
                      <td style={styles.td}>
                        <span style={{ 
                          color: op.type === 'out' ? '#ef4444' : '#10b981',
                          fontWeight: '600'
                        }}>
                          {op.type === 'out' ? '-' : '+'}{formatAmount(op.amount)} {currency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal d'ouverture */}
      {showOpenModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: isDark ? '#f9fafb' : '#111827' }}>
              Ouverture de Caisse
            </h3>
            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Fond de caisse initial
            </label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowOpenModal(false)}
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
              >
                Annuler
              </button>
              <button
                onClick={handleOpenSession}
                style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
              >
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fermeture */}
      {showCloseModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: isDark ? '#f9fafb' : '#111827' }}>
              Fermeture de Caisse
            </h3>
            
            {/* Récapitulatif */}
            <div style={{
              padding: '16px',
              backgroundColor: isDark ? '#4b5563' : '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Fond initial:</span>
                <span style={{ fontWeight: '600' }}>{formatAmount(session.initialAmount)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Ventes espèces:</span>
                <span style={{ fontWeight: '600' }}>{formatAmount(totals.cashSales)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Opérations:</span>
                <span style={{ fontWeight: '600' }}>{formatAmount(totals.operationsTotal)} {currency}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: `1px solid ${isDark ? '#6b7280' : '#d1d5db'}`,
                fontWeight: '700',
                fontSize: '16px'
              }}>
                <span>Attendu:</span>
                <span style={{ color: '#3b82f6' }}>{formatAmount(expectedAmount)} {currency}</span>
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Montant réel compté
            </label>
            <input
              type="number"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              style={styles.input}
              autoFocus
            />

            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              placeholder="Remarques de fin de journée..."
            />

            {/* Écart en temps réel */}
            {actualAmount && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: Math.abs(parseFloat(actualAmount) - expectedAmount) === 0 ? 
                  '#dcfce7' : '#fee2e2',
                color: Math.abs(parseFloat(actualAmount) - expectedAmount) === 0 ? 
                  '#16a34a' : '#dc2626'
              }}>
                Écart: {formatAmount(parseFloat(actualAmount) - expectedAmount)} {currency}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCloseModal(false)}
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
              >
                Annuler
              </button>
              <button
                onClick={handleCloseSession}
                disabled={!actualAmount}
                style={{ 
                  ...styles.button, 
                  ...styles.dangerButton, 
                  flex: 1,
                  opacity: !actualAmount ? 0.5 : 1,
                  cursor: !actualAmount ? 'not-allowed' : 'pointer'
                }}
              >
                Fermer Caisse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'opération */}
      {showOperationModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: isDark ? '#f9fafb' : '#111827' }}>
              Ajouter une Opération
            </h3>
            
            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Type d'opération
            </label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              style={styles.input}
            >
              <option value="in">Entrée d'argent</option>
              <option value="out">Sortie d'argent</option>
            </select>

            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Montant
            </label>
            <input
              type="number"
              value={operationAmount}
              onChange={(e) => setOperationAmount(e.target.value)}
              style={styles.input}
              autoFocus
            />

            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#d1d5db' : '#374151' }}>
              Description
            </label>
            <input
              type="text"
              value={operationDescription}
              onChange={(e) => setOperationDescription(e.target.value)}
              style={styles.input}
              placeholder="Ex: Remboursement client, Achat fournitures..."
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowOperationModal(false)}
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
              >
                Annuler
              </button>
              <button
                onClick={handleAddOperation}
                disabled={!operationAmount || !operationDescription}
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton, 
                  flex: 1,
                  opacity: (!operationAmount || !operationDescription) ? 0.5 : 1,
                  cursor: (!operationAmount || !operationDescription) ? 'not-allowed' : 'pointer'
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCashRegister;
