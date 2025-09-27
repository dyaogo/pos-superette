import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function Credits() {
  const [credits, setCredits] = useState([
    {
      id: 1,
      customerName: 'Jean Dupont',
      amount: 15000,
      paid: 5000,
      remaining: 10000,
      date: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'partial'
    },
    {
      id: 2,
      customerName: 'Marie Martin',
      amount: 8000,
      paid: 8000,
      remaining: 0,
      date: '2024-01-10',
      status: 'paid'
    }
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const totalCredits = credits.reduce((sum, c) => sum + c.remaining, 0);
  const overdueCredits = credits.filter(c => 
    c.status !== 'paid' && new Date(c.dueDate) < new Date()
  ).length;

  const handlePayment = () => {
    if (selectedCredit && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      setCredits(credits.map(credit => {
        if (credit.id === selectedCredit.id) {
          const newPaid = credit.paid + amount;
          const newRemaining = credit.amount - newPaid;
          return {
            ...credit,
            paid: newPaid,
            remaining: newRemaining,
            status: newRemaining === 0 ? 'paid' : 'partial'
          };
        }
        return credit;
      }));
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedCredit(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Gestion des Crédits</h1>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Crédits</p>
          <h2 style={{ margin: '10px 0', color: '#ef4444' }}>
            {totalCredits.toLocaleString()} FCFA
          </h2>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>En retard</p>
          <h2 style={{ margin: '10px 0' }}>{overdueCredits}</h2>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Clients à crédit</p>
          <h2 style={{ margin: '10px 0' }}>{credits.filter(c => c.status !== 'paid').length}</h2>
        </div>
      </div>

      {/* Tableau des crédits */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Montant Total</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Payé</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Reste</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Échéance</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Statut</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {credits.map(credit => (
              <tr key={credit.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '15px', fontWeight: '500' }}>{credit.customerName}</td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  {credit.amount.toLocaleString()} FCFA
                </td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#10b981' }}>
                  {credit.paid.toLocaleString()} FCFA
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                  {credit.remaining.toLocaleString()} FCFA
                </td>
                <td style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
                  {credit.dueDate || '-'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: 'white',
                    background: getStatusColor(credit.status)
                  }}>
                    {credit.status === 'paid' ? 'Payé' : 
                     credit.status === 'partial' ? 'Partiel' : 'En cours'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {credit.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setSelectedCredit(credit);
                        setShowPaymentModal(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Paiement
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de paiement */}
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
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '400px'
          }}>
            <h2>Enregistrer un Paiement</h2>
            <p>Client: <strong>{selectedCredit.customerName}</strong></p>
            <p>Montant restant: <strong>{selectedCredit.remaining} FCFA</strong></p>
            
            <input
              type="number"
              placeholder="Montant du paiement"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              max={selectedCredit.remaining}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginTop: '15px',
                marginBottom: '20px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handlePayment}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
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
          </div>
        </div>
      )}
    </div>
  );
}