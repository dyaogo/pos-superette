import { useState, useEffect } from 'react';
import { Store as StoreIcon, Plus, Edit, Trash2, X, Save, MapPin, Phone, DollarSign, Package, ShoppingCart } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const storeData = {
      code: formData.get('code'),
      name: formData.get('name'),
      address: formData.get('address') || null,
      phone: formData.get('phone') || null,
      currency: formData.get('currency') || 'FCFA',
      taxRate: parseFloat(formData.get('taxRate')) || 18
    };

    try {
      if (editingStore) {
        const res = await fetch(`/api/stores/${editingStore.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData)
        });

        if (res.ok) {
          alert('Magasin modifié avec succès');
          setEditingStore(null);
          loadStores();
        }
      } else {
        const res = await fetch('/api/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData)
        });

        if (res.ok) {
          alert('Magasin créé avec succès');
          setShowAddModal(false);
          loadStores();
        } else {
          const error = await res.json();
          alert('Erreur: ' + error.error);
        }
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDelete = async (storeId, storeName) => {
    if (!confirm(`Supprimer le magasin "${storeName}" ?\n\nCette action est irréversible.`)) return;

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Magasin supprimé');
        loadStores();
      } else {
        const error = await res.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StoreIcon size={32} />
            Gestion des Magasins
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            Gérez vos différents points de vente
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}
        >
          <Plus size={20} />
          Nouveau Magasin
        </button>
      </div>

      {/* Statistiques globales */}
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
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
            Total magasins
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {stores.length}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
            Total produits
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {stores.reduce((sum, store) => sum + (store._count?.products || 0), 0)}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
            Total ventes
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-warning)' }}>
            {stores.reduce((sum, store) => sum + (store._count?.sales || 0), 0)}
          </div>
        </div>
      </div>

      {/* Liste des magasins */}
      {stores.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)',
          padding: '60px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          textAlign: 'center'
        }}>
          <StoreIcon size={64} color="var(--color-text-muted)" style={{ marginBottom: '20px' }} />
          <h3 style={{ margin: '0 0 10px 0' }}>Aucun magasin</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Commencez par créer votre premier point de vente
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Créer un magasin
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {stores.map(store => (
            <div
              key={store.id}
              style={{
                background: 'var(--color-surface)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* En-tête du magasin */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>{store.name}</h3>
                  <span style={{
                    padding: '4px 10px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {store.code}
                  </span>
                </div>

                {store.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    <MapPin size={16} />
                    {store.address}
                  </div>
                )}

                {store.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    <Phone size={16} />
                    {store.phone}
                  </div>
                )}
              </div>

              {/* Statistiques */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-border)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {store._count?.products || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                    <Package size={14} />
                    Produits
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                    {store._count?.sales || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                    <ShoppingCart size={14} />
                    Ventes
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div style={{ 
                background: 'var(--color-bg)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Devise:</span>
                  <span style={{ fontWeight: '600' }}>{store.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>TVA:</span>
                  <span style={{ fontWeight: '600' }}>{store.taxRate}%</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingStore(store)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '14px'
                  }}
                >
                  <Edit size={16} />
                  Modifier
                </button>

                <button
                  onClick={() => handleDelete(store.id, store.name)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--color-danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '14px'
                  }}
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout */}
      {showAddModal && (
        <StoreModal
          title="Nouveau Magasin"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal Modification */}
      {editingStore && (
        <StoreModal
          title="Modifier le Magasin"
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// Composant Modal
function StoreModal({ title, store, onClose, onSubmit }) {
  return (
    <div 
      onClick={onClose}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code *</label>
              <input
                type="text"
                name="code"
                required
                defaultValue={store?.code}
                placeholder="Ex: MAG001"
                disabled={!!store}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: store ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  cursor: store ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={store?.name}
                placeholder="Ex: Superette Centre"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Adresse</label>
            <input
              type="text"
              name="address"
              defaultValue={store?.address || ''}
              placeholder="Ex: Avenue de l'Indépendance, Ouagadougou"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Téléphone</label>
            <input
              type="tel"
              name="phone"
              defaultValue={store?.phone || ''}
              placeholder="Ex: +226 XX XX XX XX"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Devise</label>
              <select
                name="currency"
                defaultValue={store?.currency || 'FCFA'}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Taux TVA (%)</label>
              <input
                type="number"
                name="taxRate"
                min="0"
                max="100"
                step="0.01"
                defaultValue={store?.taxRate || 18}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={20} />
              {store ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}