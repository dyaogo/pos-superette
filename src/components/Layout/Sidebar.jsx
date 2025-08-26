import React from 'react';

/**
 * Basic sidebar container.
 */
const Sidebar = ({ children }) => {
  return <aside style={styles.sidebar}>{children}</aside>;
};

const styles = {
  sidebar: {
    width: '220px',
    padding: '1rem',
    background: '#f1f5f9',
    borderRight: '1px solid #e5e7eb'
  }
};

export default Sidebar;

