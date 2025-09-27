import { WifiOff } from 'lucide-react';

export default function Offline() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <WifiOff size={80} color="#9ca3af" />
      <h1 style={{ marginTop: '20px' }}>Mode Hors Ligne</h1>
      <p style={{ color: '#6b7280', marginTop: '10px' }}>
        L'application fonctionne en mode hors ligne.
      </p>
      <p style={{ color: '#6b7280' }}>
        Vos données seront synchronisées automatiquement au retour de la connexion.
      </p>
    </div>
  );
}