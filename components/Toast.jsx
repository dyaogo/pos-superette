import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'linear-gradient(135deg, #10b981, #059669)',
      icon: <CheckCircle size={24} />,
      title: 'Succès'
    },
    error: {
      bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: <XCircle size={24} />,
      title: 'Erreur'
    },
    warning: {
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: <AlertTriangle size={24} />,
      title: 'Attention'
    },
    info: {
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      icon: <Info size={24} />,
      title: 'Information'
    }
  };

  const { bg, icon, title } = config[type] || config.info;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20px',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: bg,
          color: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          minWidth: '300px',
          maxWidth: '500px',
          animation: 'slideDown 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.95 }}>
            {message}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}