import { useState, useEffect } from 'react';
import { CloudSyncService } from '../services/CloudSyncService';
import { auth } from '../config/firebase';

export const useCloudSync = () => {
  const [cloudService] = useState(() => new CloudSyncService());
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsCloudEnabled(localStorage.getItem('pos_cloud_sync') === 'true');
    setLastSync(localStorage.getItem('pos_last_sync'));

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setIsCloudEnabled(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const enableCloud = async (email, password, isNewAccount = false) => {
    setSyncStatus('syncing');
    const result = await cloudService.enableCloudSync(email, password, isNewAccount);
    setSyncStatus(result.success ? 'success' : 'error');
    if (result.success) {
      setIsCloudEnabled(true);
      setLastSync(new Date().toISOString());
    }
    return result;
  };

  const manualSync = async () => {
    setSyncStatus('syncing');
    const result = await cloudService.performFullSync();
    setSyncStatus(result.success ? 'success' : 'error');
    if (result.success) {
      setLastSync(new Date().toISOString());
    }
    return result;
  };

  const signOut = async () => {
    await cloudService.signOut();
    setIsCloudEnabled(false);
    setUser(null);
  };

  const createBackup = async () => {
    setSyncStatus('creating');
    try {
      await cloudService.createBackup();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const restoreBackup = async (file) => {
    setSyncStatus('restoring');
    const result = await cloudService.restoreBackup(file);
    setSyncStatus(result.success ? 'success' : 'error');
    return result;
  };

  return {
    syncStatus,
    lastSync,
    isCloudEnabled,
    user,
    enableCloud,
    manualSync,
    signOut,
    createBackup,
    restoreBackup
  };
};
