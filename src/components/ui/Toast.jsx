// 📁 Créer : src/components/ui/Toast.jsx

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 4000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  const colors = {
    success: {
      background: 'var(--color-success-bg)',
      border: 'var(--color-success)',
      text: 'var(--color-success)'
    },
    error: {
      background: 'var(--color-danger-bg)',
      border: 'var(--color-danger)',
      text: 'var(--color-danger)'
    },
    warning: {
      background: 'var(--color-warning-bg)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)'
    },
    info: {
      background: 'var(--color-primary-bg)',
      border: 'var(--color-primary)',
      text: 'var(--color-primary)'
    }
  };

  const positions = {
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' }
  };

  const toastStyles = {
    position: 'fixed',
    ...positions[position],
    background: 'var(--color-surface)',
    border: `1px solid ${colors[type].border}`,
    borderLeft: `4px solid ${colors[type].border}`,
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '300px',
    maxWidth: '400px',
    zIndex: 10000,
    transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
    opacity: isExiting ? 0 : 1,
    transition: 'all 0.3s ease-out'
  };

  return (
    <div style={toastStyles} className="animate-slide-in-left">
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-md)'
      }}>
        <div style={{ color: colors[type].text, flexShrink: 0 }}>
          {icons[type]}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <h4 style={{
              margin: '0 0 var(--space-xs) 0',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text-primary)'
            }}>
              {title}
            </h4>
          )}
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4
          }}>
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition-normal)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// Hook pour utiliser les toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showToast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title })
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};

export default Toast;
