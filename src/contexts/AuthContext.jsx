import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erreur parsing user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // Connexion
  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
      } else {
        const error = await res.json();
        return { success: false, error: error.error || 'Erreur de connexion' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  // Déconnexion
  const logout = async () => {
    // Logger l'activité avant de déconnecter
    if (currentUser) {
      try {
        await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            action: 'logout',
            details: 'Déconnexion'
          })
        });
      } catch (error) {
        console.error('Erreur log logout:', error);
      }
    }

    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roles) => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  // Vérifier si l'utilisateur a la permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;

    // Les admins ont toutes les permissions
    if (currentUser.role === 'admin') return true;

    // Définir les permissions par rôle
    const permissions = {
      admin: '*', // Toutes les permissions
      manager: [
        'view_dashboard',
        'view_consolidated_dashboard',
        'manage_pos',
        'manage_inventory',
        'view_stores',
        'manage_transfers',
        'view_sales',
        'manage_customers',
        'manage_credits',
        'view_returns',
        'view_reports',
        'view_accounting'
      ],
      cashier: [
        'view_dashboard',
        'manage_pos',
        'view_inventory',
        'view_sales',
        'view_customers'
      ]
    };

    const userPermissions = permissions[currentUser.role] || [];
    
    if (userPermissions === '*') return true;
    return userPermissions.includes(permission);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    isAuthenticated: !!currentUser,
    // Compatibilité avec l'ancien code qui utilise "user"
    user: currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}