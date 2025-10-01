export default function ClearCache() {
  const handleClear = async () => {
    // Désinscrire tous les service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      alert('Service workers supprimés');
    }

    // Vider le cache
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      alert('Cache vidé');
    }

    // Recharger
    window.location.reload(true);
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Nettoyer le cache</h1>
      <button
        onClick={handleClear}
        style={{
          padding: '15px 30px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        Vider le cache et recharger
      </button>
    </div>
  );
}