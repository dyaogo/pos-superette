import { useState } from 'react';
import { Store, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';

export default function StoreSelector() {
  const { stores, currentStore, changeStore } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!stores || stores.length === 0) return null;
  if (stores.length === 1) {
    // Si un seul magasin, afficher juste le nom
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'var(--color-surface)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <Store size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: '600' }}>{currentStore?.name || stores[0].name}</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-primary)',
          borderRadius: '8px',
          cursor: 'pointer',
          minWidth: '200px',
          justifyContent: 'space-between',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-surface)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} color="var(--color-primary)" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Magasin actif
            </div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>
              {currentStore?.name || 'Sélectionner'}
            </div>
          </div>
        </div>
        <ChevronDown size={16} style={{
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }} />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />

          {/* Menu déroulant */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => {
                  changeStore(store);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: currentStore?.id === store.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentStore?.id !== store.id) {
                    e.currentTarget.style.background = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStore?.id !== store.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    {store.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {store.code} • {store._count?.products || 0} produits
                  </div>
                </div>

                {currentStore?.id === store.id && (
                  <Check size={18} color="var(--color-primary)" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}