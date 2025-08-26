import React from 'react';

/**
 * Simple horizontal navigation list.
 */
const Navigation = ({ links = [] }) => {
  return (
    <nav style={styles.nav}>
      {links.map((link) => (
        <a key={link.href} href={link.href} style={styles.link}>
          {link.label}
        </a>
      ))}
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    gap: '1rem'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none'
  }
};

export default Navigation;

