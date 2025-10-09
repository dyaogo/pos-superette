import { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Settings } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import { useRouter } from 'next/router';

export default function StoreSelector() {
  const { stores, currentStore, changeStore } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Fermer le dropdown en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!stores || stores.length === 0 || !currentStore) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          borderRadius: '8px',
          cursor: 'pointer',
          minWidth: '180px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }
        }}
      >
        <Store size={18} color="var(--color-primary)" />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Magasin
          </div>
          <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentStore.name}
          </div>
        </div>
        <ChevronDown 
          size={16} 
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {isOpen && (
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
          overflow: 'hidden',
          minWidth: '250px'
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
                background: currentStore.id === store.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                if (currentStore.id !== store.id) {
                  e.currentTarget.style.background = 'var(--color-surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentStore.id !== store.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                  {store.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {store.code} • {store._count?.products || 0} produits
                </div>
              </div>

              {currentStore.id === store.id && (
                <Check size={18} color="var(--color-primary)" />
              )}
            </button>
          ))}

          {/* Bouton Gérer les magasins */}
          <button
            onClick={() => {
              router.push('/stores');
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-primary)',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Settings size={16} />
            Gérer les magasins
          </button>
        </div>
      )}
    </div>
  );
}