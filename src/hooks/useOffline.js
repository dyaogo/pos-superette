import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true); // valeur par défaut pour SSR
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    // Initialiser la vraie valeur après montage
  setIsOnline(navigator.onLine);
  
  // Charger la queue depuis localStorage
  if (typeof window !== 'undefined') {
    const savedQueue = localStorage.getItem('offline_queue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
  }

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = (type, data) => {
    const newItem = {
      id: Date.now(),
      type,
      data,
      timestamp: new Date().toISOString()
    };

    const updatedQueue = [...offlineQueue, newItem];
    setOfflineQueue(updatedQueue);
    localStorage.setItem('offline_queue', JSON.stringify(updatedQueue));

    return newItem.id;
  };

  const syncOfflineData = async () => {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    
    for (const item of queue) {
      try {
        if (item.type === 'sale') {
          await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
        }
        // Ajouter d'autres types si nécessaire
      } catch (error) {
        console.error('Sync failed for item:', item);
        continue;
      }
    }

    // Vider la queue après sync réussie
    localStorage.removeItem('offline_queue');
    setOfflineQueue([]);
  };

  return {
    isOnline,
    offlineQueue,
    addToQueue,
    syncOfflineData
  };
}