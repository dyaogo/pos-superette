import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Phone, Mail, Award } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Client Comptant', phone: '', email: '', points: 0, totalPurchases: 0 },
    { id: 2, name: 'Jean Dupont', phone: '0123456789', email: 'jean@email.com', points: 150, totalPurchases: 45000 },
    { id: 3, name: 'Marie Martin', phone: '0987654321', email: 'marie@email.com', points: 320, totalPurchases: 98000 }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    if (newCustomer.name) {
      const customer = {
        id: Date.now(),
        ...newCustomer,
        points: 0,
        totalPurchases: 0
      };
      setCustomers([...customers, customer]);
      setNewCustomer({ name: '', phone: '', email: '' });
      setShowAddModal(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Gestion des Clients</h1>

      {/* Barre de recherche et ajout */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '15px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Rechercher client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <UserPlus size={20} />
          Nouveau Client
        </button>
      </div>

      {/* Tableau des clients */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Contact</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Points Fidélité</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Total Achats</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '500' }}>{customer.name}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
                    {customer.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={14} /> {customer.phone}
                    </div>}
                    {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={14} /> {customer.email}
                    </div>}
                  </div>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#fef3c7',
                    color: '#d97706',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Award size={14} /> {customer.points}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                  {customer.totalPurchases.toLocaleString()} FCFA
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button
                    style={{
                      padding: '6px 10px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nouveau Client */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '400px'
          }}>
            <h2>Nouveau Client</h2>
            
            <input
              type="text"
              placeholder="Nom complet"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '15px'
              }}
            />
            
            <input
              type="tel"
              placeholder="Téléphone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '15px'
              }}
            />
            
            <input
              type="email"
              placeholder="Email (optionnel)"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAddCustomer}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}