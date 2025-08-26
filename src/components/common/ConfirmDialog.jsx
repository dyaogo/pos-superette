import React from 'react';

/**
 * Simple confirmation dialog.
 */
const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <p>{message}</p>
        <div style={styles.actions}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
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
  },
  box: {
    background: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    minWidth: '280px'
  },
  actions: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem'
  }
};

export default ConfirmDialog;

