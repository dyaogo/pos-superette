import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { CreditCard, Plus, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreditsPage() {
  const { customers, loading } = useApp();
  const [credits, setCredits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Charger les crédits
  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      setCredits(data);
    } catch (error) {
      console.error('Erreur chargement crédits:', error);
    }
  };

  // Filtrer les crédits
  const filteredCredits = credits.filter(credit => {
    if (filter === 'pending') return credit.status === 'pending';
    if (filter === 'partial') return credit.status === 'partial';
    if (filter === 'paid') return credit.status === 'paid';
    if (filter === 'overdue') {
      return credit.status !== 'paid' && new Date(credit.dueDate) < new Date();
    }
    return true;
  });

  // Statistiques
  const totalCredits = credits.reduce((sum, c) => sum + c.remainingAmount, 0);
  const overdueCredits = credits.filter(c => 
    c.status !== 'paid' && new Date(c.dueDate) < new Date()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const creditData = {
      customerId: formData.get('customerId'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      dueDate: formData.get('dueDate')
    };

    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditData)
      });

      if (res.ok) {
        alert('Crédit enregistré');
        setShowAddModal(false);
        loadCredits();
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
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
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={32} />
          Gestion des Crédits
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Nouveau Crédit
        </button>
      </div>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>Total crédits en cours</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {totalCredits.toLocaleString()} FCFA
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>Crédits en retard</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {overdueCredits.length}
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>Total crédits</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {credits.length}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            minWidth: '200px'
          }}
        >
          <option value="all">Tous les crédits</option>
          <option value="pending">En attente</option>
          <option value="partial">Partiellement payés</option>
          <option value="paid">Payés</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Liste des crédits */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {filteredCredits.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Aucun crédit trouvé
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Montant</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Restant</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Échéance</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => {
                const customer = customers.find(c => c.id === credit.customerId);
                const isOverdue = credit.status !== 'paid' && new Date(credit.dueDate) < new Date();
                
                return (
                  <tr key={credit.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '15px', fontWeight: '500' }}>
                      {customer?.name || 'Client inconnu'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      {credit.amount.toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                      {credit.remainingAmount.toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color={isOverdue ? '#ef4444' : '#6b7280'} />
                        {new Date(credit.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: 
                          credit.status === 'paid' ? '#dcfce7' :
                          credit.status === 'partial' ? '#fef3c7' :
                          isOverdue ? '#fecaca' : '#dbeafe',
                        color:
                          credit.status === 'paid' ? '#166534' :
                          credit.status === 'partial' ? '#92400e' :
                          isOverdue ? '#991b1b' : '#1e40af'
                      }}>
                        {credit.status === 'paid' ? 'Payé' :
                         credit.status === 'partial' ? 'Partiel' :
                         isOverdue ? 'En retard' : 'En cours'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
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
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '500px'
            }}
          >
            <h2>Nouveau Crédit</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Client *</label>
                <select
                  name="customerId"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Montant *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Date d'échéance *</label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}