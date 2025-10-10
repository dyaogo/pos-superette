import { Delete } from 'lucide-react';

export default function NumericKeypad({ value, onChange, onClose }) {
  const handleNumber = (num) => {
    onChange(value + num);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          padding: '20px',
          width: '320px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Affichage */}
        <div style={{
          background: 'var(--color-bg)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'right',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--color-primary)',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          border: '2px solid var(--color-border)'
        }}>
          {value || '0'} <span style={{ fontSize: '20px', marginLeft: '8px' }}>FCFA</span>
        </div>

        {/* Grille de boutons */}
        <div style={{ display: 'grid', gap: '10px' }}>
          {buttons.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === '⌫') handleBackspace();
                    else handleNumber(btn);
                  }}
                  style={{
                    padding: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    background: btn === 'C' || btn === '⌫' 
                      ? 'var(--color-danger)' 
                      : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Bouton OK */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '15px',
            background: 'var(--color-success)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}