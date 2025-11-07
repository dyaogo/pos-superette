import React, { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpensesView = ({ currentStore, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, [currentStore]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/expense-categories?active=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const storeId = currentStore?.id || 'all';
      const res = await fetch(`/api/expenses?storeId=${storeId}`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Erreur lors du chargement des dépenses');
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
      const res = await fetch('/api/expenses', {
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
        expenseDate: new Date().toISOString().split('T')[0],
      });
      loadExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Erreur lors de l\'ajout de la dépense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete expense');

      toast.success('Dépense supprimée');
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">Veuillez sélectionner un magasin</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header moderne */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Gestion des Dépenses
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Enregistrez et suivez toutes vos dépenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10">Nouvelle Dépense</span>
        </button>
      </div>

      {/* Formulaire moderne glassmorphism */}
      {showForm && (
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <h3 className="relative text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            ✨ Ajouter une dépense
          </h3>
          <form onSubmit={handleSubmit} className="relative space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50"
                  placeholder="0"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50"
                  placeholder="Description de la dépense"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all font-bold"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des dépenses moderne */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative p-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            💰 Dépenses récentes
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">Aucune dépense enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-5 border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"
                       style={{ backgroundColor: expense.category.color + '20' }}></div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                             style={{ backgroundColor: expense.category.color + '20' }}>
                          <Calendar size={20} style={{ color: expense.category.color }} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Date</p>
                          <p className="font-bold text-gray-900">{formatDate(expense.expenseDate)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Catégorie</p>
                        <span
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
                          style={{
                            backgroundColor: expense.category.color + '20',
                            color: expense.category.color,
                          }}
                        >
                          {expense.category.name}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                        <p className="font-semibold text-gray-900">{expense.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Montant</p>
                          <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {formatCurrency(expense.amount)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="ml-4 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          title="Supprimer"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;
