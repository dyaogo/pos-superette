import React, { useState, useEffect } from 'react';
import { 
  Plus, DollarSign, TrendingUp, AlertCircle, 
  CheckCircle, Receipt, Trash2, X, Clock,
  Filter, Search, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExpensesModule = ({ currentStore, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    categoryId: 'all',
  });

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    invoiceNumber: '',
    supplier: '',
    paymentMethod: 'cash',
    dueDate: '',
    notes: '',
  });

  // Charger les catégories
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/expense-categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data.filter(c => c.isActive) : []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setCategories([]);
    }
  };

  // Charger les dépenses
  const loadExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?storeId=${currentStore.id}`;
      if (filters.status !== 'all') url += `&status=${filters.status}`;
      if (filters.categoryId !== 'all') url += `&categoryId=${filters.categoryId}`;

      const res = await fetch(url);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement dépenses:', error);
      setExpenses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentStore) {
      loadCategories();
      loadExpenses();
    }
  }, [currentStore, filters]);

  // Calculer les statistiques
  const stats = {
    total: expenses.reduce((sum, e) => sum + (e.status !== 'rejected' ? e.amount : 0), 0),
    pending: expenses.filter(e => e.status === 'pending').length,
    paid: expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
    thisMonth: expenses.filter(e => {
      const date = new Date(e.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + (e.status !== 'rejected' ? e.amount : 0), 0),
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      storeId: currentStore.id,
      createdBy: currentUser.name,
    };

    try {
      const url = selectedExpense ? `/api/expenses/${selectedExpense.id}` : '/api/expenses';
      const method = selectedExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(selectedExpense ? 'Dépense modifiée' : 'Dépense créée');
        setShowForm(false);
        setSelectedExpense(null);
        setFormData({
          categoryId: '',
          amount: '',
          description: '',
          invoiceNumber: '',
          supplier: '',
          paymentMethod: 'cash',
          dueDate: '',
          notes: '',
        });
        loadExpenses();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur: ' + error.message);
    }
  };

  // Approuver une dépense
  const handleApprove = async (expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: currentUser.name,
        }),
      });

      if (res.ok) {
        toast.success('Dépense approuvée');
        loadExpenses();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  // Marquer comme payée
  const handleMarkAsPaid = async (expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidDate: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success('Dépense marquée comme payée');
        loadExpenses();
      }
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  // Supprimer une dépense
  const handleDelete = async (expense) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Dépense supprimée');
        loadExpenses();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Badge de statut modernisé
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'En attente' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Approuvée' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Payée' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Rejetée' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} shadow-sm transition-all duration-200 hover:scale-105`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  // Filtrer les dépenses par recherche
  const filteredExpenses = expenses.filter(expense => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(search) ||
      expense.supplier?.toLowerCase().includes(search) ||
      expense.invoiceNumber?.toLowerCase().includes(search) ||
      expense.category.name.toLowerCase().includes(search)
    );
  });

  // Vérification si currentStore est chargé
  if (!currentStore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Chargement du magasin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header modernisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
          <p className="text-gray-600 mt-1">Gérez les dépenses de {currentStore.name}</p>
        </div>
        <button
          onClick={() => {
            setSelectedExpense(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus size={20} />
          Nouvelle Dépense
        </button>
      </div>

      {/* Cartes statistiques modernisées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Dépenses */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Total Dépenses</p>
              <p className="text-3xl font-bold mt-2">{stats.total.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <DollarSign size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* En Attente */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">En Attente</p>
              <p className="text-3xl font-bold mt-2">{stats.pending}</p>
              <p className="text-xs opacity-75 mt-1">Dépenses</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <Clock size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Payées */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Payées</p>
              <p className="text-3xl font-bold mt-2">{stats.paid.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <CheckCircle size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Ce Mois */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 font-medium">Ce Mois</p>
              <p className="text-3xl font-bold mt-2">{stats.thisMonth.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-1">FCFA</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <TrendingUp size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres modernisés */}
      <div className="bg-white p-5 rounded-2xl shadow-lg">
        <div className="flex flex-wrap gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>

          {/* Filtre Statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none bg-white cursor-pointer transition-all duration-200 min-w-[180px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="paid">Payées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>

          {/* Filtre Catégorie */}
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none bg-white cursor-pointer transition-all duration-200 min-w-[200px]"
          >
            <option value="all">Toutes les catégories</option>
            {Array.isArray(categories) && categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des dépenses modernisée */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement des dépenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <AlertCircle size={48} className="text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900">Aucune dépense trouvée</p>
            <p className="text-gray-600 mt-2">Créez votre première dépense pour commencer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((expense, idx) => (
                  <tr 
                    key={expense.id} 
                    className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                        style={{ 
                          backgroundColor: expense.category.color + '20', 
                          color: expense.category.color 
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: expense.category.color }}
                        />
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        {expense.supplier && (
                          <div className="text-xs text-gray-500 mt-1">
                            Fournisseur: <span className="font-medium">{expense.supplier}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-gray-900">{expense.amount.toLocaleString()} FCFA</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(expense)}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 transition-all duration-200 shadow-sm"
                            title="Approuver"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {expense.status === 'approved' && (
                          <button
                            onClick={() => handleMarkAsPaid(expense)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm"
                            title="Marquer comme payée"
                          >
                            <Receipt size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulaire modernisé */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp">
            {/* Header du modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {selectedExpense ? '✏️ Modifier la Dépense' : '➕ Nouvelle Dépense'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedExpense(null);
                  }}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenu du formulaire */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Catégorie et Montant */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Montant (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows="3"
                  required
                />
              </div>

              {/* Fournisseur et Facture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    N° Facture
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Mode de paiement et Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="card">Carte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows="2"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedExpense(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {selectedExpense ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles pour animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExpensesModule;