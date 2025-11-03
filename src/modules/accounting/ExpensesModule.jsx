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
  Calendar
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
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approuvée' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Payée' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejetée' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Dépenses</h1>
          <p className="text-gray-600">{currentStore?.name}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nouvelle Dépense
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Dépenses (Approuvées)</p>
          <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">En attente d'approbation</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingExpenses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Dépenses</p>
          <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border rounded-lg"
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
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Liste des dépenses */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune dépense trouvée
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
                    >
                      {expense.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{expense.description}</div>
                    {expense.supplier && (
                      <div className="text-xs text-gray-500">Fournisseur: {expense.supplier}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {expense.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(expense)}
                          className="text-green-600 hover:text-green-800"
                          title="Approuver"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {expense.status === 'approved' && (
                        <button
                          onClick={() => handleMarkAsPaid(expense)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Marquer comme payée"
                        >
                          <Receipt size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-red-600 hover:text-red-800"
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
        )}
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de facture
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="card">Carte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
