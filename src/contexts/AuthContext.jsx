import React, { createContext, useContext, useEffect, useState } from 'react';
//import { auth, db } from '../config/firebase';
//import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useApp } from './AppContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [allowedStores, setAllowedStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setCurrentStoreId } = useApp();

/*  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);*/

  useEffect(() => {
    /*const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role || null);
            const stores = data.stores || [];
            setAllowedStores(stores);
            if (stores.length) {
              const saved = localStorage.getItem('pos_current_store');
              const chosen = saved && stores.includes(saved) ? saved : stores[0];
              setCurrentStoreId(chosen);
            }
          } else {
            setRole(null);
            setAllowedStores([]);
          }
        } catch (e) {
          setRole(null);
          setAllowedStores([]);
        }
      } else {
        setRole(null);
        setAllowedStores([]);
      }
      setLoading(false);
    });

    return unsubscribe;*/
    setUser({ 
      email: 'test@superette.com', 
      role: 'admin',
      name: 'Utilisateur Test'
    });
    setLoading(false);
  }, []);

  // Fonctions simplifiées sans Firebase
  const login = async (email, password) => {
    setLoading(true);
    // Simulation de connexion
    setTimeout(() => {
      setUser({ email, role: 'admin', name: 'Admin' });
      setLoading(false);
    }, 500);
    return true;
  };

  const logout = async () => {
    setUser(null);
  };

  const signup = async (email, password) => {
    // Simulation
    return { user: { email } };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
