import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'rgba(16, 185, 129, 0.95)',
      icon: CheckCircle,
      color: 'white'
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.95)',
      icon: AlertTriangle,
      color: 'white'
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.95)',
      icon: Info,
      color: 'white'
    }
  };

  const { bg, icon: Icon, color } = config[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: bg,
        color: color,
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <Icon size={24} />
      <div style={{ flex: 1, fontWeight: '500', fontSize: '15px' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'white',
          opacity: 0.8
        }}
      >
        <X size={20} />
      </button>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}