import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Edit2, Trash2, Download, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountingModule() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [stores, setStores] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Charger les magasins pour avoir un storeId valide
  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      console.log('Magasins chargés:', data);
      setStores(data);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    loadCategories();
    if (activeTab === 'dashboard' || activeTab === 'reports') {
      loadReport();
    }
    if (activeTab === 'expenses') {
      loadExpenses();
    }
  }, [activeTab, period, currentPage, selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/accounting/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/report?period=${period}`);
      const data = await res.json();

      // Vérifier si l'API a retourné une erreur
      if (data.error) {
        console.error('Erreur API:', data.error, data.details);
        toast.error('Erreur lors du chargement du rapport: ' + (data.details || data.error));
        setReportData(null);
        return;
      }

      setReportData(data);
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      toast.error('Erreur lors du chargement du rapport');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(searchTerm && { search: searchTerm })
      });

      const res = await fetch(`/api/accounting/expenses?${params}`);
      const data = await res.json();

      // Vérifier si l'API a retourné une erreur
      if (data.error) {
        console.error('Erreur API:', data.error, data.details);
        toast.error('Erreur lors du chargement des dépenses: ' + (data.details || data.error));
        setExpenses([]);
        return;
      }

      setExpenses(data.data || data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erreur chargement dépenses:', error);
      toast.error('Erreur lors du chargement des dépenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Dépense supprimée');
        loadExpenses();
        if (activeTab === 'dashboard') loadReport();
      } else {
        throw new Error('Erreur suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      console.log('=== DEBUG CRÉATION DÉPENSE ===');
      console.log('currentUser:', currentUser);
      console.log('stores:', stores);
      console.log('expenseData:', expenseData);

      // Trouver un storeId valide
      let storeId = null;

      // Option 1: Utiliser le storeId du currentUser s'il ressemble à un CUID
      if (currentUser?.storeId && currentUser.storeId.length > 10) {
        storeId = currentUser.storeId;
        console.log('Option 1: Utilisation de currentUser.storeId:', storeId);
      }

      // Option 2: Si currentUser.storeId est un code, trouver le store correspondant
      if (!storeId && currentUser?.storeId) {
        const store = stores.find(s => s.code === currentUser.storeId || s.id === currentUser.storeId);
        storeId = store?.id;
        console.log('Option 2: Recherche par code, store trouvé:', store, 'storeId:', storeId);
      }

      // Option 3: Utiliser le premier magasin disponible
      if (!storeId && stores.length > 0) {
        storeId = stores[0].id;
        console.log('Option 3: Premier magasin, storeId:', storeId);
      }

      if (!storeId) {
        console.error('ERREUR: Aucun storeId trouvé!');
        toast.error('Aucun magasin disponible. Veuillez contacter l\'administrateur.');
        return;
      }

      // Ajouter les informations de l'utilisateur et du magasin
      const dataToSend = {
        ...expenseData,
        storeId,
        createdBy: currentUser?.fullName || currentUser?.email || 'Utilisateur'
      };

      console.log('Données envoyées:', JSON.stringify(dataToSend, null, 2));

      const url = selectedExpense
        ? `/api/expenses/${selectedExpense.id}`
        : '/api/accounting/expenses';

      const method = selectedExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        toast.success(selectedExpense ? 'Dépense modifiée' : 'Dépense créée');
        setShowExpenseModal(false);
        setSelectedExpense(null);
        loadExpenses();
        if (activeTab === 'dashboard') loadReport();
      } else {
        const errorData = await res.json();
        console.error('Erreur API complète:', errorData);
        const errorMessage = errorData.details || errorData.error || 'Erreur inconnue';
        toast.error(`Erreur: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      // Le toast est déjà affiché ci-dessus si c'est une erreur API
      if (!error.message || error.message === 'Failed to fetch') {
        toast.error('Erreur de connexion au serveur');
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          Comptabilité
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Gestion financière et rapports
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        {[
          { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
          { id: 'expenses', label: 'Dépenses', icon: DollarSign },
          { id: 'reports', label: 'Rapports', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <DashboardView
          reportData={reportData}
          loading={loading}
          period={period}
          setPeriod={setPeriod}
          categories={categories}
        />
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <ExpensesView
          expenses={expenses}
          categories={categories}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onEdit={(expense) => {
            setSelectedExpense(expense);
            setShowExpenseModal(true);
          }}
          onDelete={handleDeleteExpense}
          onAdd={() => {
            setSelectedExpense(null);
            setShowExpenseModal(true);
          }}
          onRefresh={loadExpenses}
        />
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <ReportsView
          reportData={reportData}
          loading={loading}
          period={period}
          setPeriod={setPeriod}
          categories={categories}
        />
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          expense={selectedExpense}
          categories={categories}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedExpense(null);
          }}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  );
}

// Dashboard View Component
function DashboardView({ reportData, loading, period, setPeriod, categories }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Chargement...</div>;
  }

  if (!reportData || reportData.error) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
      Aucune donnée disponible{reportData?.error ? ': ' + reportData.error : ''}
    </div>;
  }

  const {
    revenue = 0,
    expenses = 0,
    netProfit = 0,
    profitMargin = 0,
    salesCount = 0,
    expensesByCategory = []
  } = reportData;

  return (
    <div>
      {/* Period Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        {[
          { value: 'week', label: 'Semaine' },
          { value: 'month', label: 'Mois' },
          { value: 'year', label: 'Année' }
        ].map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '8px 16px',
              background: period === p.value ? '#667eea' : 'white',
              color: period === p.value ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <MetricCard
          title="Chiffre d'affaires"
          value={`${revenue?.toLocaleString() || 0} FCFA`}
          icon={TrendingUp}
          color="#10b981"
          trend={`${salesCount || 0} ventes`}
        />
        <MetricCard
          title="Dépenses totales"
          value={`${expenses?.toLocaleString() || 0} FCFA`}
          icon={TrendingDown}
          color="#ef4444"
          trend={`${expensesByCategory?.length || 0} catégories`}
        />
        <MetricCard
          title="Bénéfice net"
          value={`${netProfit?.toLocaleString() || 0} FCFA`}
          icon={DollarSign}
          color={netProfit >= 0 ? '#10b981' : '#ef4444'}
          trend={`Marge: ${profitMargin?.toFixed(1) || 0}%`}
        />
      </div>

      {/* Expenses by Category */}
      {expensesByCategory && expensesByCategory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Dépenses par catégorie
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expensesByCategory.map(cat => {
              const category = categories.find(c => c.id === cat.categoryId);
              const percentage = expenses > 0 ? (cat.total / expenses * 100) : 0;

              return (
                <div key={cat.categoryId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: '500' }}>{category?.name || 'Inconnu'}</span>
                    <span style={{ color: '#6b7280' }}>{cat.total.toLocaleString()} FCFA ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: category?.color || '#6366f1',
                      borderRadius: '4px',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{title}</span>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
        {trend}
      </div>
    </div>
  );
}

// Expenses View Component
function ExpensesView({
  expenses,
  categories,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onEdit,
  onDelete,
  onAdd,
  onRefresh
}) {
  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onAdd}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Plus size={18} />
          Nouvelle dépense
        </button>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Chargement...</div>
      ) : expenses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: '12px',
          color: '#6b7280'
        }}>
          Aucune dépense trouvée
        </div>
      ) : (
        <>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Catégorie</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Montant</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => {
                  const category = categories.find(c => c.id === expense.categoryId);
                  return (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        {expense.description}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${category?.color}20`,
                          color: category?.color || '#6366f1',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {category?.name || 'Inconnu'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right' }}>
                        {expense.amount.toLocaleString()} FCFA
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => onEdit(expense)}
                            style={{
                              padding: '6px 12px',
                              background: '#f3f4f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#667eea',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px'
                            }}
                          >
                            <Edit2 size={14} />
                            Modifier
                          </button>
                          <button
                            onClick={() => onDelete(expense.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px'
                            }}
                          >
                            <Trash2 size={14} />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? '#f3f4f6' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: currentPage === 1 ? '#9ca3af' : '#374151'
                }}
              >
                Précédent
              </button>
              <span style={{ padding: '8px 16px', fontSize: '14px', color: '#6b7280' }}>
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? '#f3f4f6' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151'
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Reports View (similar to Dashboard but with more details)
function ReportsView({ reportData, loading, period, setPeriod, categories }) {
  return <DashboardView reportData={reportData} loading={loading} period={period} setPeriod={setPeriod} categories={categories} />;
}

// Expense Modal Component
function ExpenseModal({ expense, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    categoryId: expense?.categoryId || '',
    amount: expense?.amount || '',
    description: expense?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.amount || !formData.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
          {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Catégorie *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Montant (FCFA) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {expense ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
