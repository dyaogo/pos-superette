// src/components/ui/Toast.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose,
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info
  };

  const colors = {
    success: {
      background: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
      icon: '#10b981'
    },
    warning: {
      background: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
      icon: '#f59e0b'
    },
    error: {
      background: '#fee2e2',
      border: '#ef4444',
      text: '#991b1b',
      icon: '#ef4444'
    },
    info: {
      background: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      icon: '#3b82f6'
    }
  };

  const positions = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
  };

  const Icon = icons[type];
  const style = colors[type];

  return (
    <div style={{
      position: 'fixed',
      ...positions[position],
      zIndex: 10000,
      minWidth: '300px',
      maxWidth: '500px',
      padding: '16px',
      background: style.background,
      border: `1px solid ${style.border}`,
      borderRadius: '8px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease'
    }}>
      <Icon size={20} color={style.icon} />
      
      <p style={{
        margin: 0,
        flex: 1,
        color: style.text,
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {message}
      </p>
      
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: style.text,
          padding: '4px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Hook pour gérer les toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return { toasts, addToast, removeToast };
};

export default Toast;

/* USAGE:
const { toasts, addToast, removeToast } = useToast();

// Afficher un toast
addToast('Produit ajouté au panier', 'success');
addToast('Stock insuffisant', 'error');

// Rendre les toasts
{toasts.map(toast => (
  <Toast
    key={toast.id}
    message={toast.message}
    type={toast.type}
    duration={toast.duration}
    onClose={() => removeToast(toast.id)}
  />
))}
*/
