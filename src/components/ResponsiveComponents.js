// Hook personnalisé pour détecter la taille d'écran
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Déterminer le type d'appareil
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Appel initial
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
};

// Styles responsifs centralisés
export const getResponsiveStyles = (deviceType, isDark) => {
  const baseStyles = {
    // Tailles de base selon l'appareil
    padding: {
      mobile: '10px',
      tablet: '15px',
      desktop: '20px'
    },
    fontSize: {
      mobile: {
        h1: '20px',
        h2: '18px',
        h3: '16px',
        body: '14px',
        small: '12px'
      },
      tablet: {
        h1: '24px',
        h2: '20px',
        h3: '18px',
        body: '16px',
        small: '14px'
      },
      desktop: {
        h1: '28px',
        h2: '24px',
        h3: '20px',
        body: '16px',
        small: '14px'
      }
    },
    buttonHeight: {
      mobile: '48px',  // Minimum recommandé pour tactile
      tablet: '44px',
      desktop: '40px'
    },
    touchTarget: {
      mobile: '44px',  // Taille minimale tactile
      tablet: '40px',
      desktop: '36px'
    }
  };

  return {
    container: {
      padding: baseStyles.padding[deviceType],
      minHeight: '100vh',
      background: isDark ? '#1a202c' : '#f7fafc'
    },
    
    card: {
      background: isDark ? '#2d3748' : 'white',
      padding: baseStyles.padding[deviceType],
      borderRadius: deviceType === 'mobile' ? '12px' : '8px',
      boxShadow: deviceType === 'mobile' ? 
        '0 4px 6px rgba(0,0,0,0.1)' : 
        '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: deviceType === 'mobile' ? '15px' : '20px'
    },

    button: {
      height: baseStyles.buttonHeight[deviceType],
      minHeight: baseStyles.touchTarget[deviceType],
      padding: deviceType === 'mobile' ? '12px 20px' : '10px 16px',
      fontSize: baseStyles.fontSize[deviceType].body,
      borderRadius: deviceType === 'mobile' ? '12px' : '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease'
    },

    input: {
      height: baseStyles.buttonHeight[deviceType],
      padding: deviceType === 'mobile' ? '12px 16px' : '10px 12px',
      fontSize: baseStyles.fontSize[deviceType].body,
      borderRadius: deviceType === 'mobile' ? '12px' : '8px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748',
      width: '100%'
    },

    grid: {
      display: 'grid',
      gap: deviceType === 'mobile' ? '12px' : '15px',
      gridTemplateColumns: deviceType === 'mobile' ?
        'repeat(auto-fit, minmax(140px, 1fr))' :
        deviceType === 'tablet' ?
        'repeat(auto-fit, minmax(160px, 1fr))' :
        'repeat(auto-fit, minmax(180px, 1fr))'
    },

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: deviceType === 'mobile' ? '15px' : '20px'
    },

    modal: {
      padding: deviceType === 'mobile' ? '20px' : '30px',
      borderRadius: deviceType === 'mobile' ? '20px 20px 0 0' : '12px',
      width: deviceType === 'mobile' ? '100%' : '90%',
      maxWidth: deviceType === 'mobile' ? '100%' : '500px',
      maxHeight: deviceType === 'mobile' ? '85vh' : '90vh',
      position: deviceType === 'mobile' ? 'fixed' : 'relative',
      bottom: deviceType === 'mobile' ? '0' : 'auto',
      transform: deviceType === 'mobile' ? 'none' : 'translate(-50%, -50%)'
    },

    navigation: {
      height: deviceType === 'mobile' ? '60px' : '50px',
      padding: `0 ${baseStyles.padding[deviceType]}`,
      display: 'flex',
      alignItems: 'center',
      gap: deviceType === 'mobile' ? '8px' : '15px',
      overflowX: deviceType === 'mobile' ? 'auto' : 'visible'
    },

    productCard: {
      minHeight: deviceType === 'mobile' ? '140px' : '160px',
      padding: deviceType === 'mobile' ? '12px' : '16px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: deviceType === 'mobile' ? '16px' : '12px',
      background: isDark ? '#374151' : 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      touchAction: 'manipulation' // Évite le zoom sur double-tap
    },

    typography: {
      h1: {
        fontSize: baseStyles.fontSize[deviceType].h1,
        fontWeight: 'bold',
        color: isDark ? '#f7fafc' : '#2d3748',
        margin: 0
      },
      h2: {
        fontSize: baseStyles.fontSize[deviceType].h2,
        fontWeight: '600',
        color: isDark ? '#f7fafc' : '#2d3748',
        margin: 0
      },
      body: {
        fontSize: baseStyles.fontSize[deviceType].body,
        color: isDark ? '#f7fafc' : '#2d3748'
      },
      small: {
        fontSize: baseStyles.fontSize[deviceType].small,
        color: isDark ? '#a0aec0' : '#64748b'
      }
    }
  };
};

// Navigation mobile avec bottom tabs
export const MobileNavigation = ({ activeModule, setActiveModule, isDark, allowedModules = [] }) => {
  const { deviceType } = useResponsive();

  if (deviceType === 'desktop') return null;

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Accueil' },
    { id: 'sales', icon: '🛒', label: 'Ventes' },
    { id: 'stocks', icon: '📦', label: 'Stocks' },
    { id: 'credits', icon: '💳', label: 'Crédits' },
    { id: 'cash', icon: '🧮', label: 'Caisse' },
    { id: 'employees', icon: '👥', label: 'Employés' },
    { id: 'returns', icon: '↩️', label: 'Retours' }
  ].filter(item => allowedModules.includes(item.id));

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: isDark ? '#2d3748' : 'white',
      borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      display: 'flex',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)' // Support iPhone notch
    }}>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveModule(item.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
            color: activeModule === item.id ? '#3b82f6' : (isDark ? '#cbd5e0' : '#64748b'),
            fontSize: '10px',
            fontWeight: activeModule === item.id ? '600' : '400',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation'
          }}
        >
          <span style={{ fontSize: '20px', marginBottom: '2px' }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Composant swipe pour navigation mobile
export const SwipeContainer = ({ children, onSwipeLeft, onSwipeRight }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </div>
  );
};

// Layout responsif principal
export const ResponsiveLayout = ({ children, isDark }) => {
  const { deviceType, isMobile } = useResponsive();
  const styles = getResponsiveStyles(deviceType, isDark);

  return (
    <div style={{
      ...styles.container,
      paddingBottom: isMobile ? '80px' : '0' // Espace pour la navigation mobile
    }}>
      {children}
    </div>
  );
};

// Grid responsif pour produits
export const ProductGrid = ({ products, onProductClick, isDark }) => {
  const { deviceType } = useResponsive();
  const styles = getResponsiveStyles(deviceType, isDark);

  return (
    <div style={styles.grid}>
      {products.map(product => (
        <div
          key={product.id}
          style={styles.productCard}
          onClick={() => onProductClick(product)}
          onTouchStart={() => {}} // Améliore la réactivité tactile
        >
          <div style={{ 
            fontSize: deviceType === 'mobile' ? '32px' : '40px',
            marginBottom: '8px'
          }}>
            {product.image}
          </div>
          
          <div style={{
            ...styles.typography.body,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '4px',
            lineHeight: 1.2
          }}>
            {deviceType === 'mobile' && product.name.length > 12 ? 
              product.name.substring(0, 12) + '...' : 
              product.name
            }
          </div>
          
          <div style={{
            color: '#3b82f6',
            fontWeight: 'bold',
            fontSize: deviceType === 'mobile' ? '16px' : '18px'
          }}>
            {product.price.toLocaleString()}
          </div>
          
          {deviceType !== 'mobile' && (
            <div style={styles.typography.small}>
              Stock: {product.stock}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Modal responsive
export const ResponsiveModal = ({ isOpen, onClose, title, children, isDark }) => {
  const { deviceType } = useResponsive();
  const styles = getResponsiveStyles(deviceType, isDark);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: deviceType === 'mobile' ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: deviceType === 'mobile' ? '0' : '20px'
    }}>
      <div style={{
        ...styles.modal,
        background: isDark ? '#2d3748' : 'white',
        overflowY: 'auto'
      }}>
        {/* En-tête mobile avec bouton fermer */}
        {deviceType === 'mobile' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
          }}>
            <h3 style={styles.typography.h2}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                ...styles.button,
                background: 'transparent',
                color: isDark ? '#a0aec0' : '#64748b',
                minWidth: '44px',
                height: '44px',
                padding: '0'
              }}
            >
              ✕
            </button>
          </div>
        )}
        
        {deviceType !== 'mobile' && title && (
          <h3 style={{ ...styles.typography.h2, marginBottom: '20px' }}>
            {title}
          </h3>
        )}
        
        {children}
      </div>
    </div>
  );
};

// Exemple d'utilisation dans SalesModule
export const MobileSalesExample = () => {
  const { deviceType, isMobile } = useResponsive();
  const styles = getResponsiveStyles(deviceType, false);

  return (
    <ResponsiveLayout isDark={false}>
      {/* Layout adaptatif selon l'appareil */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 
          '1fr' : // Mobile: pile verticale
          deviceType === 'tablet' ? 
          '1fr 300px' : // Tablette: sidebar réduite
          '1fr 400px', // Desktop: sidebar normale
        gap: '20px',
        height: '100%'
      }}>
        
        {/* Section produits */}
        <div style={styles.card}>
          <h2 style={styles.typography.h2}>Produits</h2>
          
          {/* Barre de recherche tactile */}
          <input
            type="text"
            placeholder="Rechercher..."
            style={{
              ...styles.input,
              marginBottom: '15px',
              fontSize: isMobile ? '16px' : '14px' // Évite le zoom iOS
            }}
          />
          
          {/* Grille de produits responsive */}
          <ProductGrid 
            products={[
              { id: 1, name: 'Coca Cola', price: 500, image: '🥤', stock: 45 },
              { id: 2, name: 'Pain de mie', price: 800, image: '🍞', stock: 12 }
            ]}
            onProductClick={(product) => console.log('Produit:', product)}
            isDark={false}
          />
        </div>

        {/* Panier - Drawer sur mobile */}
        {isMobile ? (
          <div style={{
            position: 'fixed',
            bottom: '80px', // Au-dessus de la navigation
            left: '10px',
            right: '10px',
            ...styles.card,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <h3 style={styles.typography.h3}>Panier (0)</h3>
            <p style={styles.typography.small}>Aucun article</p>
          </div>
        ) : (
          <div style={styles.card}>
            <h3 style={styles.typography.h3}>Panier</h3>
            <p style={styles.typography.small}>Aucun article</p>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
};
