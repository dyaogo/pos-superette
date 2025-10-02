import { Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';

export default function OfflineIndicator() {
  const { isOnline, offlineQueue, lastSync } = useApp();

  if (isOnline && offlineQueue.length === 0) {
    return null; // Masquer si tout est OK
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      background: isOnline ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: isOnline ? 'none' : 'pulse 2s infinite'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
      
      <div>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {isOnline ? 'Connecté' : 'Mode Hors Ligne'}
        </div>
        
        {offlineQueue.length > 0 && (
          <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {offlineQueue.length} opération(s) en attente
          </div>
        )}
        
        {isOnline && offlineQueue.length === 0 && lastSync && (
          <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} />
            Dernière sync: {new Date(lastSync).toLocaleTimeString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
}