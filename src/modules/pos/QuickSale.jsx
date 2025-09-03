import React from 'react';
import { Search } from 'lucide-react';
import ProductGrid from './ProductGrid';

const QuickSale = ({
  products,
  categories = [],
  selectedCategory = 'all',
  setSelectedCategory = () => {},
  addToCart,
  searchQuery,
  setSearchQuery,
  quickMode,
  setQuickMode,
  cart,
  setCart,
  isDark,
  appSettings,
  openScanner
}) => {
  const styles = {
    productSection: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      padding: quickMode ? '15px' : '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    quickActions: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
      padding: '10px',
      background: isDark ? '#374151' : '#f8fafc',
      borderRadius: '6px'
    },
    searchBar: {
      width: '100%',
      padding: '12px 40px 12px 15px',
      border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '16px',
      marginBottom: '15px',
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    categorySelect: {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '15px',
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748'
    }
  };

  const QuickActions = () => (
    <div style={styles.quickActions}>
      <button
        onClick={() => setQuickMode(!quickMode)}
        style={{
          padding: '6px 12px',
          background: quickMode ? '#3b82f6' : '#64748b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        {quickMode ? 'Mode Détaillé' : 'Mode Rapide'}
      </button>

      <button
        onClick={() => setCart([])}
        disabled={cart.length === 0}
        style={{
          padding: '6px 12px',
          background: cart.length > 0 ? '#ef4444' : '#94a3b8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: cart.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        Vider
      </button>

      <button
        onClick={openScanner}
        style={{
          padding: '6px 12px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Scanner
      </button>
    </div>
  );

  return (
    <div style={styles.productSection}>
      <QuickActions />

      <select
        aria-label="Catégorie"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={styles.categorySelect}
      >
        <option value="all">Toutes catégories</option>
        {categories.filter(cat => cat !== 'all').map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '12px' }} size={20} color="#94a3b8" />
        <input
          id="product-search"
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchBar}
          autoFocus
        />
      </div>

      <ProductGrid
        products={products}
        addToCart={addToCart}
        quickMode={quickMode}
        isDark={isDark}
        appSettings={appSettings}
      />
    </div>
  );
};

export default QuickSale;
