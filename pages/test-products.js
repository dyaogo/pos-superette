import { useState, useEffect } from 'react';

export default function TestProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        // 🔥 PAGINATION: Extraire .data si présent
        setProducts(data.data || data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '50px' }}>Chargement...</div>;
  if (error) return <div style={{ padding: '50px' }}>Erreur: {error}</div>;

  return (
    <div style={{ padding: '50px' }}>
      <h1>Produits depuis PostgreSQL</h1>
      <p>Nombre de produits : {products.length}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nom</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Prix</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Stock</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Catégorie</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{p.name}</td>
              <td style={{ padding: '10px' }}>{p.sellingPrice} FCFA</td>
              <td style={{ padding: '10px' }}>{p.stock}</td>
              <td style={{ padding: '10px' }}>{p.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}