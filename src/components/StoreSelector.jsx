import React, { useState } from 'react';
import { Store, ChevronDown, Eye, Grid } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const StoreSelector = ({ modal = false }) => {
  const {
    stores,
    currentStoreId,
    setCurrentStoreId,
    viewMode,
    setViewMode,
    getCurrentStore,
    appSettings
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const isDark = appSettings?.darkMode;

  const currentStore = getCurrentStore();

  const handleStoreChange = (storeId) => {
    if (storeId !== currentStoreId) {
      setCurrentStoreId(storeId);
      setViewMode('single');
    }
    setIsOpen(false);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setIsOpen(false);
  };

  // ----- Mode modal -----
  if (modal) {
    return (
      <div
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
          style={{
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '280px'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Sélection du magasin
          </div>
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => handleStoreChange(store.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: currentStoreId === store.id && viewMode === 'single'
                  ? (isDark ? '#4a5568' : '#edf2f7')
                  : 'transparent',
                color: isDark ? '#f7fafc' : '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: store.color,
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{store.name}</div>
                <div
                  style={{
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#718096',
                    marginTop: '2px'
                  }}
                >
                  {store.code} • {store.manager}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ----- Mode dropdown par défaut -----
  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: isDark ? '#4a5568' : '#edf2f7',
          border: `1px solid ${isDark ? '#718096' : '#cbd5e0'}`,
          borderRadius: '8px',
          color: isDark ? '#f7fafc' : '#2d3748',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        <Store size={16} />

        {viewMode === 'single' ? (
          <>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentStore.color
              }}
            />
            <span>{currentStore.code}</span>
          </>
        ) : (
          <>
            <Grid size={16} />
            <span>Tous les magasins</span>
          </>
        )}

        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: isDark ? '#2d3748' : 'white',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '200px',
              zIndex: 20,
              overflow: 'hidden'
            }}
          >
            {/* En-tête */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                background: isDark ? '#4a5568' : '#f7fafc'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDark ? '#cbd5e0' : '#718096',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Sélection du magasin
              </div>
            </div>

            {/* Vue consolidée */}
            <button
              onClick={() => handleViewModeChange('consolidated')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: viewMode === 'consolidated'
                  ? (isDark ? '#4a5568' : '#edf2f7')
                  : 'transparent',
                color: isDark ? '#f7fafc' : '#2d3748',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'consolidated') {
                  e.target.style.background = isDark ? '#4a5568' : '#f7fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'consolidated') {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <Eye size={16} />
              <div>
                <div style={{ fontWeight: '500' }}>Vue consolidée</div>
                <div style={{
                  fontSize: '12px',
                  color: isDark ? '#a0aec0' : '#718096',
                  marginTop: '2px'
                }}>
                  Tous les magasins
                </div>
              </div>
              {viewMode === 'consolidated' && (
                <div
                  style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#48bb78'
                  }}
                />
              )}
            </button>

            {/* Séparateur */}
            <div
              style={{
                height: '1px',
                background: isDark ? '#4a5568' : '#e2e8f0',
                margin: '4px 0'
              }}
            />

            {/* Liste des magasins */}
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => handleStoreChange(store.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: currentStoreId === store.id && viewMode === 'single'
                    ? (isDark ? '#4a5568' : '#edf2f7')
                    : 'transparent',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!(currentStoreId === store.id && viewMode === 'single')) {
                    e.target.style.background = isDark ? '#4a5568' : '#f7fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(currentStoreId === store.id && viewMode === 'single')) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: store.color,
                    flexShrink: 0
                  }}
                />

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '500' }}>{store.name}</div>
                  <div style={{
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#718096',
                    marginTop: '2px'
                  }}>
                    {store.code} • {store.manager}
                  </div>
                </div>

                {currentStoreId === store.id && viewMode === 'single' && (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: store.color
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StoreSelector;
