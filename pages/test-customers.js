import { useState } from 'react';

export default function TestCustomers() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestCustomers = async () => {
    setLoading(true);
    const customers = [
      { name: 'Amadou Traoré', phone: '70123456', email: 'amadou@example.com' },
      { name: 'Fatou Diallo', phone: '75234567', email: 'fatou@example.com' },
      { name: 'Ibrahim Kaboré', phone: '76345678', email: 'ibrahim@example.com' },
      { name: 'Aïcha Ouédraogo', phone: '77456789', email: 'aicha@example.com' },
      { name: 'Moussa Sawadogo', phone: '78567890', email: 'moussa@example.com' }
    ];

    let results = [];
    for (const customer of customers) {
      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        const data = await res.json();
        results.push(`✅ ${data.name || 'Erreur: ' + data.error}`);
      } catch (error) {
        results.push(`❌ Erreur: ${error.message}`);
      }
    }
    setResult(results.join('\n'));
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Créer des clients de test</h1>
      <p>Cliquez sur le bouton pour créer 5 clients de test dans la base de données.</p>
      
      <button 
        onClick={createTestCustomers}
        disabled={loading}
        style={{
          padding: '15px 30px',
          background: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        {loading ? 'Création en cours...' : 'Créer 5 clients de test'}
      </button>
      
      {result && (
        <pre style={{ 
          marginTop: '20px', 
          whiteSpace: 'pre-wrap',
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
}