import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useApp } from './AppContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [allowedStores, setAllowedStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentStoreId } = useApp();

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
              setCurrentStoreId(stores[0]);
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

    return unsubscribe;
  }, [setCurrentStoreId]);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading, allowedStores }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
