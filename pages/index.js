export default function Home() {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Chargement...</p>
    </div>
  );
}