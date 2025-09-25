import { useState, useEffect } from 'react';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '50px' }}>
      <h1>Produits depuis PostgreSQL</h1>
      <ul>
        {products.map(p => (
          <li key={p.id}>
            {p.name} - {p.sellingPrice} FCFA - Stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}