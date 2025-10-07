import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { FileText, Search, Eye, Download, Calendar, DollarSign, User } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';


export default function SalesPage() {
  const { salesHistory, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);

  // Filtrer les ventes
  const filteredSales = salesHistory.filter(sale => {
    const matchesSearch = 
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    const matchesDate = 
      dateFilter === 'all' ||
      (dateFilter === 'today' && saleDate.toDateString() === today.toDateString()) ||
      (dateFilter === 'week' && (today - saleDate) / (1000 * 60 * 60 * 24) <= 7) ||
      (dateFilter === 'month' && saleDate.getMonth() === today.getMonth());

    return matchesSearch && matchesDate;
  });
    
      // Après la déclaration des états
const { 
  currentPage, 
  totalPages, 
  paginatedData, 
  goToPage, 
  hasNext, 
  hasPrev 
} = usePagination(filteredSales, 20);

    

  // Statistiques
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  if (loading) {
      return <LoadingSpinner fullScreen />;

  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={32} />
          Historique des ventes
        </h1>
      </div>

      {/* Statistiques rapides */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Total ventes</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
            {filteredSales.length}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Chiffre d'affaires</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
            {totalRevenue.toLocaleString()} FCFA
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Panier moyen</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
            {Math.round(averageSale).toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search 
            size={20} 
            style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} 
          />
          <input
            type="text"
            placeholder="Rechercher par client ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}
          />
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            minWidth: '150px'
          }}
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {/* Liste des ventes */}
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        {filteredSales.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Aucune vente trouvée
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Méthode</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Montant</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Articles</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((sale) => (
                <tr 
                  key={sale.id}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '15px' }}>
                    {new Date(sale.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="#6b7280" />
                      {sale.customer?.name || 'Client comptant'}
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: 
                        sale.paymentMethod === 'cash' ? '#dcfce7' :
                        sale.paymentMethod === 'card' ? '#dbeafe' : '#fef3c7',
                      color:
                        sale.paymentMethod === 'cash' ? '#166534' :
                        sale.paymentMethod === 'card' ? '#1e40af' : '#92400e'
                    }}>
                      {sale.paymentMethod === 'cash' ? 'Espèces' :
                       sale.paymentMethod === 'card' ? 'Carte' : 'Mobile'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                    {sale.total.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {sale.items?.length || 0}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedSale(sale)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={16} />
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />


      {/* Modal détails de vente */}
      {selectedSale && (
        <div 
          onClick={() => setSelectedSale(null)}
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
              borderRadius: '12px',
              padding: '30px',
              width: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Détails de la vente</h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Date :</strong>
                  <p>{new Date(selectedSale.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <strong>Client :</strong>
                  <p>{selectedSale.customer?.name || 'Client comptant'}</p>
                </div>
                <div>
                  <strong>Méthode :</strong>
                  <p>{selectedSale.paymentMethod === 'cash' ? 'Espèces' :
                     selectedSale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}</p>
                </div>
                <div>
                  <strong>Total :</strong>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {selectedSale.total.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <h3>Articles vendus</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Prix U.</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item, index) => (
  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
    <td style={{ padding: '10px' }}>
      {item.product?.name || item.productName || 'Produit inconnu'}
    </td>
    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
    <td style={{ padding: '10px', textAlign: 'right' }}>
      {item.unitPrice.toLocaleString()} FCFA
    </td>
    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
      {(item.quantity * item.unitPrice).toLocaleString()} FCFA
    </td>
  </tr>
))}
              </tbody>
            </table>

            <button
              onClick={() => setSelectedSale(null)}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
