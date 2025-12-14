import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../src/contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { TrendingUp, Receipt, Plus, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountingPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();
  const [currentStore, setCurrentStore] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [period, setPeriod] = useState('week');

  // Data states
  const [report, setReport] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (currentUser && !hasPermission('view_accounting')) {
      router.push('/unauthorized');
      return;
    }
    loadStores();
  }, [currentUser]);

  useEffect(() => {
    if (currentStore) {
      loadData();
    }
  }, [currentStore, period]);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();

      if (currentUser?.storeId) {
        const userStore = data.find((s) => s.id === currentUser.storeId);
        setCurrentStore(userStore || data[0]);
      } else {
        setCurrentStore(data[0]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const storeId = currentStore?.id || 'all';

      // Load report
      const reportRes = await fetch(`/api/accounting/report?storeId=${storeId}&period=${period}`);
      const reportData = await reportRes.json();
      setReport(reportData);

      // Load expenses
      const expensesRes = await fetch(`/api/accounting/expenses?storeId=${storeId}`);
      const expensesData = await expensesRes.json();
      // 🔥 PAGINATION: Extraire le tableau .data si présent
      setExpenses(expensesData.data || expensesData);

      // Load categories
      const categoriesRes = await fetch('/api/accounting/categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentStore) {
      toast.error('Veuillez sélectionner un magasin');
      return;
    }

    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeId: currentStore.id,
          createdBy: currentUser?.fullName || 'Utilisateur',
        }),
      });

      if (!res.ok) throw new Error('Failed to create expense');

      toast.success('Dépense ajoutée avec succès');
      setShowForm(false);
      setFormData({
        categoryId: '',
        amount: '',
        description: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Erreur lors de l\'ajout de la dépense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette dépense ?')) return;

    try {
      await fetch(`/api/accounting/expenses?id=${id}`, { method: 'DELETE' });
      toast.success('Dépense supprimée');
      loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
      default: return 'Période';
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 min-h-screen">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Comptabilité
                </h1>
                <p className="text-gray-500 font-medium">Gérez vos finances simplement</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => setActiveTab('report')}
              className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'report'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-xl shadow-purple-500/40'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200'
              }`}
            >
              {activeTab === 'report' && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-700 opacity-30 blur-xl rounded-2xl"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <TrendingUp size={20} />
                Compte de Résultat
              </span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-xl shadow-blue-500/40'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200'
              }`}
            >
              {activeTab === 'expenses' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-700 opacity-30 blur-xl rounded-2xl"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Receipt size={20} />
                Dépenses
              </span>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600"></div>
            </div>
          ) : activeTab === 'report' && report ? (
            <div className="space-y-8">
              {/* Period Selector */}
              <div className="flex gap-3">
                {['week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                      period === p
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/80 text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    {p === 'week' ? '📅 Semaine' : p === 'month' ? '📊 Mois' : '📈 Année'}
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <TrendingUp size={32} className="mb-4" />
                    <h3 className="text-sm font-semibold uppercase mb-2 opacity-90">Revenus</h3>
                    <p className="text-4xl font-black">{formatCurrency(report.revenue.total)}</p>
                    <p className="text-sm mt-2 opacity-80">{report.salesCount} vente(s)</p>
                  </div>
                </div>

                {/* Expenses */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <Receipt size={32} className="mb-4" />
                    <h3 className="text-sm font-semibold uppercase mb-2 opacity-90">Dépenses</h3>
                    <p className="text-4xl font-black">{formatCurrency(report.expenses.total)}</p>
                    <p className="text-sm mt-2 opacity-80">{report.expenses.count} dépense(s)</p>
                  </div>
                </div>

                {/* Profit */}
                <div className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl ${
                  report.netProfit >= 0
                    ? 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600'
                    : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600'
                }`}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="text-4xl mb-4">{report.netProfit >= 0 ? '💰' : '⚠️'}</div>
                    <h3 className="text-sm font-semibold uppercase mb-2 opacity-90">Bénéfice Net</h3>
                    <p className="text-4xl font-black">{formatCurrency(report.netProfit)}</p>
                    <p className="text-sm mt-2 opacity-80">{report.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {report.expenses.byCategory.length > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-6">
                    📊 Dépenses par Catégorie
                  </h3>
                  <div className="space-y-4">
                    {report.expenses.byCategory.map((cat, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold" style={{ color: cat.color }}>{cat.name}</span>
                          <span className="text-xl font-black">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(cat.total / report.expenses.total) * 100}%`,
                              backgroundColor: cat.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Add Button */}
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} className="inline mr-2" />
                Nouvelle Dépense
              </button>

              {/* Form */}
              {showForm && (
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-2">Catégorie</label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                          required
                        >
                          <option value="">Sélectionner</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Montant (FCFA)</label>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Expenses List */}
              <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                  💰 Dépenses récentes
                </h3>
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-5 rounded-2xl bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="font-bold">{formatDate(expense.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Catégorie</p>
                            <span
                              className="px-3 py-1 rounded-xl text-sm font-bold"
                              style={{
                                backgroundColor: expense.category.color + '20',
                                color: expense.category.color,
                              }}
                            >
                              {expense.category.name}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="font-semibold">{expense.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Montant</p>
                              <p className="text-2xl font-black text-purple-600">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
