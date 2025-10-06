import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, Package, Users, TrendingUp, 
  AlertTriangle, DollarSign, Box, UserCheck 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalCustomers: 0
  });
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les produits depuis l'API
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
        setStats({
          todaySales: 15000, // Valeur de démo pour l'instant
          totalProducts: data?.length || 0,
          lowStockCount: data?.filter(p => p.stock < 10).length || 0,
          totalCustomers: 3 // Valeur de démo
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement produits:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Chargement...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ marginBottom: '30px' }}>Tableau de Bord</h1>
      
      {/* Cartes de statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Ventes du jour */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Ventes du jour</p>
              <h2 style={{ margin: '10px 0', color: '#10b981' }}>{stats.todaySales.toLocaleString()} FCFA</h2>
            </div>
            <DollarSign size={40} color="#10b981" style={{ opacity: 0.3 }} />
          </div>
        </div>

        {/* Total Produits */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Produits</p>
              <h2 style={{ margin: '10px 0', color: '#3b82f6' }}>{stats.totalProducts}</h2>
            </div>
            <Package size={40} color="#3b82f6" style={{ opacity: 0.3 }} />
          </div>
        </div>

        {/* Stock Faible */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Stock Faible</p>
              <h2 style={{ margin: '10px 0', color: '#f59e0b' }}>{stats.lowStockCount}</h2>
            </div>
            <AlertTriangle size={40} color="#f59e0b" style={{ opacity: 0.3 }} />
          </div>
        </div>

        {/* Clients */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Clients</p>
              <h2 style={{ margin: '10px 0', color: '#8b5cf6' }}>{stats.totalCustomers}</h2>
            </div>
            <Users size={40} color="#8b5cf6" style={{ opacity: 0.3 }} />
          </div>
        </div>
      </div>

      {/* Actions Rapides */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Actions Rapides</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Link href="/pos">
            <button style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <ShoppingCart size={20} />
              Nouvelle Vente
            </button>
          </Link>
          
          <Link href="/inventory">
            <button style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Box size={20} />
              Gérer Inventaire
            </button>
          </Link>

          <Link href="/customers">
            <button style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <UserCheck size={20} />
              Ajouter Client
            </button>
          </Link>
        </div>
      </div>

      {/* Tableau des produits en stock faible */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#f59e0b' }}>
          ⚠️ Produits en Stock Faible
        </h2>
        
        {products.filter(p => p.stock < 10).length === 0 ? (
          <p style={{ color: '#10b981' }}>✅ Tous les produits ont un stock suffisant</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Produit</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Stock Actuel</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Catégorie</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Prix Vente</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter(p => p.stock < 10)
                .sort((a, b) => a.stock - b.stock)
                .map(product => (
                  <tr key={product.id} style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '12px', fontWeight: '500' }}>{product.name}</td>
                    <td style={{ 
                      padding: '12px',
                      color: product.stock < 5 ? '#ef4444' : '#f59e0b',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {product.stock}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{product.category}</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>
                      {product.sellingPrice?.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}