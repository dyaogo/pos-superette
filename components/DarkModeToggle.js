import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Charger la préférence
    const saved = localStorage.getItem('dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('dark-mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('dark-mode', 'false');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '2px solid var(--color-border)',
        background: 'var(--color-surface)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--transition-normal)',
        boxShadow: 'var(--shadow-md)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      title={darkMode ? 'Mode clair' : 'Mode sombre'}
    >
      {darkMode ? <Sun size={24} color="#f59e0b" /> : <Moon size={24} color="#3b82f6" />}
    </button>
  );
}