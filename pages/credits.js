import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { CreditCard, Plus, DollarSign, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CreditsPage() {
  const { customers, loading, salesHistory } = useApp();
  const [credits, setCredits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expandedCredit, setExpandedCredit] = useState(null);

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

  // Obtenir le nom du client
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Client inconnu';
  };

  // Trouver la vente liée au crédit
  const findRelatedSale = (creditDescription) => {
    // Le description contient "Vente RECXXXX"
    const match = creditDescription?.match(/REC\d+/);
    if (match) {
      const receiptNumber = match[0];
      return salesHistory.find(s => s.receiptNumber === receiptNumber);
    }
    return null;
  };

  const toggleExpand = (creditId) => {
    setExpandedCredit(expandedCredit === creditId ? null : creditId);
  };

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
        loadCredits();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Erreur création crédit:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          <CreditCard size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Gestion des Crédits
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Nouveau crédit
        </button>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total à recouvrer</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {totalCredits.toLocaleString()} FCFA
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Crédits en retard</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {overdueCredits.length}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total crédits</div>
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
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            minWidth: '200px',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)'
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
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {filteredCredits.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Aucun crédit trouvé
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Montant</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Restant</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Créé le</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Échéance</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map(credit => {
                const isOverdue = new Date(credit.dueDate) < new Date() && credit.status !== 'paid';
                const relatedSale = findRelatedSale(credit.description);
                const isExpanded = expandedCredit === credit.id;

                return (
                  <>
                    <tr 
                      key={credit.id}
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '15px', fontWeight: '600' }}>
                        {getCustomerName(credit.customerId)}
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {credit.description}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                        {credit.amount.toLocaleString()} FCFA
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: credit.remainingAmount > 0 ? '#ef4444' : '#10b981' }}>
                        {credit.remainingAmount.toLocaleString()} FCFA
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>
                        {new Date(credit.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>
                        {new Date(credit.dueDate).toLocaleDateString('fr-FR')}
                        {isOverdue && (
                          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                            En retard
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: credit.status === 'paid' ? '#d1fae5' : credit.status === 'partial' ? '#fef3c7' : '#fee2e2',
                          color: credit.status === 'paid' ? '#065f46' : credit.status === 'partial' ? '#92400e' : '#991b1b'
                        }}>
                          {credit.status === 'paid' ? 'Payé' : credit.status === 'partial' ? 'Partiel' : 'En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {relatedSale && (
                          <button
                            onClick={() => toggleExpand(credit.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--color-primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              margin: '0 auto'
                            }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Détails
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Ligne développée avec les produits */}
                    {isExpanded && relatedSale && (
                      <tr>
                        <td colSpan="8" style={{ padding: '20px', background: 'var(--color-bg)' }}>
                          <div style={{ marginBottom: '10px', fontWeight: '600', fontSize: '14px' }}>
                            Produits vendus (Vente {relatedSale.receiptNumber})
                          </div>
                          <table style={{ width: '100%', fontSize: '14px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Produit</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Quantité</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Prix unitaire</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {relatedSale.items?.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td style={{ padding: '8px' }}>{item.productName}</td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()} FCFA</td>
                                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>
                                    {item.total.toLocaleString()} FCFA
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ fontWeight: '600', background: 'var(--color-surface-hover)' }}>
                                <td colSpan="3" style={{ padding: '10px', textAlign: 'right' }}>Total:</td>
                                <td style={{ padding: '10px', textAlign: 'right', color: 'var(--color-primary)' }}>
                                  {relatedSale.total.toLocaleString()} FCFA
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajout crédit - reste inchangé */}
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
              background: 'var(--color-surface)',
              padding: '30px',
              borderRadius: '12px',
              width: '500px'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Nouveau crédit</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Client</label>
                <select
                  name="customerId"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Montant (FCFA)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <input
                  type="text"
                  name="description"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Date d'échéance</label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--color-border)',
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
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}