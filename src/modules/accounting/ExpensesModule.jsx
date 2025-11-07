import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExpensesModule = ({ currentStore, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    categoryId: 'all',
  });

  // État du formulaire
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

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, [currentStore, filters]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/expense-categories?active=true');
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const data = await res.json();
      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Categories data is not an array:', data);
        setCategories([]);
        toast.error('Format de données invalide');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
      setCategories([]); // Garder un tableau vide en cas d'erreur
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentStore?.id) {
        params.append('storeId', currentStore.id);
      }

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.categoryId !== 'all') {
        params.append('categoryId', filters.categoryId);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des dépenses');
      }
      const data = await res.json();
      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        console.error('Expenses data is not an array:', data);
        setExpenses([]);
        toast.error('Format de données invalide');
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Erreur lors du chargement des dépenses');
      setExpenses([]); // Garder un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.amount || !formData.description) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const payload = {
        ...formData,
        storeId: currentStore.id,
        createdBy: currentUser?.fullName || currentUser?.username || 'Admin',
      };

      const url = selectedExpense
        ? `/api/expenses/${selectedExpense.id}`
        : '/api/expenses';

      const method = selectedExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(selectedExpense ? 'Dépense mise à jour' : 'Dépense créée');
        resetForm();
        loadExpenses();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleApprove = async (expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: currentUser?.fullName || currentUser?.username || 'Admin',
        }),
      });

      if (res.ok) {
        toast.success('Dépense approuvée');
        loadExpenses();
      } else {
        toast.error('Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Erreur');
    }
  };

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
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Erreur');
    }
  };

  const handleDelete = async (expense) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Dépense supprimée');
        loadExpenses();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur');
    }
  };

  const resetForm = () => {
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
    setSelectedExpense(null);
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-300',
        icon: Clock,
        label: 'En attente'
      },
      approved: {
        color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300',
        icon: CheckCircle,
        label: 'Approuvée'
      },
      paid: {
        color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300',
        icon: CheckCircle,
        label: 'Payée'
      },
      rejected: {
        color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-300',
        icon: XCircle,
        label: 'Rejetée'
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const totalExpenses = expenses
    .filter(e => ['approved', 'paid'].includes(e.status))
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header avec gradient */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestion des Dépenses
          </h1>
          <p className="text-gray-600 mt-1 font-medium">{currentStore?.name}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus size={22} strokeWidth={2.5} />
          <span className="font-bold">Nouvelle Dépense</span>
        </button>
      </div>

      {/* Statistiques avec gradients modernes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Dépenses */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium">Total Dépenses</p>
              <p className="text-sm text-white/70">(Approuvées & Payées)</p>
            </div>
          </div>
          <p className="text-3xl font-black">{totalExpenses.toLocaleString()} FCFA</p>
        </div>

        {/* En attente */}
        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Clock size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium">En attente</p>
              <p className="text-sm text-white/70">Approbation requise</p>
            </div>
          </div>
          <p className="text-3xl font-black">{pendingExpenses}</p>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium">Total Dépenses</p>
              <p className="text-sm text-white/70">Tous statuts</p>
            </div>
          </div>
          <p className="text-3xl font-black">{expenses.length}</p>
        </div>
      </div>

      {/* Filtres modernes */}
      <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-bold text-gray-800">Filtres</h3>
        </div>
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="paid">Payées</option>
            <option value="rejected">Rejetées</option>
          </select>

          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="all">Toutes les catégories</option>
            {Array.isArray(categories) && categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des dépenses avec design moderne */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Aucune dépense trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Ajoutez votre première dépense pour commencer</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(expenses) && expenses.map((expense, index) => (
                <tr
                  key={expense.id}
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                      style={{ backgroundColor: expense.category.color + '20', color: expense.category.color, border: `2px solid ${expense.category.color}40` }}
                    >
                      {expense.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{expense.description}</div>
                    {expense.supplier && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold">Fournisseur:</span> {expense.supplier}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {expense.amount.toLocaleString()} <span className="text-xs text-gray-500">FCFA</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {expense.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(expense)}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 transition-all duration-200 shadow-sm"
                          title="Approuver"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      {expense.status === 'approved' && (
                        <button
                          onClick={() => handleMarkAsPaid(expense)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm"
                          title="Marquer comme payée"
                        >
                          <Receipt size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm"
                        title="Supprimer"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Formulaire avec design moderne */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {selectedExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows="3"
                  required
                  placeholder="Décrivez la dépense..."
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Numéro de facture
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="FAC-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Nom du fournisseur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="card">Carte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows="2"
                  placeholder="Notes additionnelles..."
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
                >
                  {selectedExpense ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesModule;
