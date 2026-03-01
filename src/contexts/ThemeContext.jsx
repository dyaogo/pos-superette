import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Lire la préférence sauvegardée au premier chargement
  useEffect(() => {
    const saved = localStorage.getItem('pos-theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    } else if (saved === 'light') {
      setIsDark(false);
      document.body.classList.remove('dark-mode');
    } else {
      // Respecter la préférence système si aucune sauvegarde
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('pos-theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('pos-theme', 'light');
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
