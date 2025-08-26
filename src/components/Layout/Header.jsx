import React from 'react';
import Navigation from './Navigation';
import { CloudSyncPanel } from '../CloudSyncPanel';

/**
 * Simple header component with optional title and navigation links.
 */
const Header = ({ title = '', links = [], children }) => {
  return (
    <header style={styles.header}>
      {title && <h1 style={styles.title}>{title}</h1>}
      <div style={styles.right}>
        {links.length > 0 && <Navigation links={links} />}
        {children}
        <CloudSyncPanel />
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    background: '#f8f9fa',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  }
};

export default Header;

