import React from 'react';

const ProductGrid = ({ products, addToCart, quickMode, isDark, appSettings }) => {
  const styles = {
    productGrid: {
      display: 'grid',
      gridTemplateColumns: quickMode
        ? 'repeat(auto-fill, minmax(120px, 1fr))'
        : 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: quickMode ? '10px' : '15px'
    },
    productCard: {
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: quickMode ? '10px' : '15px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: isDark ? '#374151' : 'white'
    }
  };

  return (
    <div style={styles.productGrid}>
      {products.map(product => (
        <div
          key={product.id}
          style={styles.productCard}
          onClick={() => addToCart(product)}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ fontSize: quickMode ? '24px' : '40px', marginBottom: '5px' }}>
            {product.image}
          </div>
          <div style={{
            fontSize: quickMode ? '12px' : '14px',
            fontWeight: '600',
            marginBottom: '3px',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}>
            {quickMode
              ? product.name.substring(0, 15) + (product.name.length > 15 ? '...' : '')
              : product.name}
          </div>
          <div style={{
            color: '#2563eb',
            fontWeight: 'bold',
            fontSize: quickMode ? '14px' : '16px'
          }}>
            {product.price} {appSettings.currency}
          </div>
          {!quickMode && (
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Stock: {product.stock}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
