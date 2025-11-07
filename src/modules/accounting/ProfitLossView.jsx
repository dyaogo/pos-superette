import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfitLossView = ({ currentStore }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (currentStore) {
      loadProfitLoss();
    }
  }, [currentStore, period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    endDate = now.toISOString();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { startDate, endDate };
  };

  const loadProfitLoss = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const storeId = currentStore?.id || 'all';

      const res = await fetch(
        `/api/accounting/profit-loss?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!res.ok) throw new Error('Failed to fetch profit/loss data');

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error loading profit/loss:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Cette semaine';
      case 'month':
        return 'Ce mois';
      case 'year':
        return 'Cette année';
      default:
        return 'Période';
    }
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
      {/* Header avec sélection de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compte de Résultat</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre performance</p>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'week', label: 'Semaine' },
            { id: 'month', label: 'Mois' },
            { id: 'year', label: 'Année' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${period === p.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenus */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp size={24} />
                </div>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {getPeriodLabel()}
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1 opacity-90">Revenus Totaux</h3>
              <p className="text-3xl font-bold">{formatCurrency(data.revenue.total)}</p>
              <p className="text-sm mt-2 opacity-75">{data.salesCount} vente(s)</p>
            </div>

            {/* Dépenses */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingDown size={24} />
                </div>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {getPeriodLabel()}
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1 opacity-90">Dépenses Totales</h3>
              <p className="text-3xl font-bold">{formatCurrency(data.expenses.total)}</p>
              <p className="text-sm mt-2 opacity-75">{data.expensesCount} dépense(s)</p>
            </div>

            {/* Bénéfice Net */}
            <div
              className={`rounded-xl p-6 text-white shadow-lg ${
                data.netProfit >= 0
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {data.profitMargin.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1 opacity-90">Bénéfice Net</h3>
              <p className="text-3xl font-bold">{formatCurrency(data.netProfit)}</p>
              <p className="text-sm mt-2 opacity-75">
                {data.netProfit >= 0 ? 'Profit' : 'Perte'}
              </p>
            </div>
          </div>

          {/* Détail des revenus */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Détail des Revenus</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">{formatCurrency(data.revenue.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">TVA/Taxes</span>
                <span className="font-semibold">{formatCurrency(data.revenue.tax)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-900 font-semibold">Total Revenus</span>
                <span className="font-bold text-green-600">{formatCurrency(data.revenue.total)}</span>
              </div>
            </div>
          </div>

          {/* Dépenses par catégorie */}
          {data.expenses.byCategory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Dépenses par Catégorie</h3>
              <div className="space-y-3">
                {data.expenses.byCategory.map((category, index) => {
                  const percentage = data.expenses.total > 0
                    ? (category.total / data.expenses.total) * 100
                    : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: category.color + '20',
                            color: category.color,
                          }}
                        >
                          {category.name}
                        </span>
                        <span className="font-semibold">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color,
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {percentage.toFixed(1)}% du total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Résumé final */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Résultat {getPeriodLabel()}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatCurrency(data.revenue.total)} - {formatCurrency(data.expenses.total)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.netProfit >= 0 ? '+' : ''}{formatCurrency(data.netProfit)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Marge: {data.profitMargin.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Aucune donnée disponible pour cette période
        </div>
      )}
    </div>
  );
};

export default ProfitLossView;
