import React from 'react';
import styles from './Receipt.module.css';

const Receipt = ({ data, onClose, appSettings }) => {
  if (!data) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Reçu</h3>
        {data.receiptNumber && (
          <p className={styles.text}>Reçu: {data.receiptNumber}</p>
        )}
        <p className={styles.text}>
          Total: {data.total.toLocaleString()} {appSettings?.currency}
        </p>
        {data.change > 0 && (
          <p className={styles.text}>
            Monnaie: {data.change.toLocaleString()} {appSettings?.currency}
          </p>
        )}
        <button onClick={onClose} className={styles.closeButton}>
          Fermer
        </button>
      </div>
    </div>
  );
};

export default Receipt;
