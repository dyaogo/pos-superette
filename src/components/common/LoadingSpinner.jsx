import React from 'react';

/**
 * Simple loading spinner.
 */
const LoadingSpinner = () => {
  return (
    <div style={styles.spinner}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '1rem auto'
  }
};

export default LoadingSpinner;

