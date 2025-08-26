import React from 'react';

/**
 * Simple footer component.
 */
const Footer = ({ children }) => {
  return <footer style={styles.footer}>{children}</footer>;
};

const styles = {
  footer: {
    padding: '1rem',
    textAlign: 'center',
    background: '#f8f9fa',
    borderTop: '1px solid #e5e7eb'
  }
};

export default Footer;

