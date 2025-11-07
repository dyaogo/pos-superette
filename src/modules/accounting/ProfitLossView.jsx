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
      {/* Header ultra-moderne avec sélection de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Compte de Résultat
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Analysez vos performances financières</p>
        </div>

        <div className="flex gap-3">
          {[
            { id: 'week', label: 'Semaine', icon: '📅' },
            { id: 'month', label: 'Mois', icon: '📊' },
            { id: 'year', label: 'Année', icon: '📈' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`
                group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105
                ${period === p.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/40'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                }
              `}
            >
              {period === p.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-700 opacity-30 blur-xl rounded-xl"></div>
              )}
              <span className="relative z-10">{p.icon} {p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600"></div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Cartes de résumé ultra-modernes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenus */}
            <div className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 transition-all duration-500 transform hover:scale-105">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={32} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    {getPeriodLabel()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wider">Revenus Totaux</h3>
                <p className="text-4xl font-black mb-3">{formatCurrency(data.revenue.total)}</p>
                <p className="text-sm opacity-80 font-medium">✅ {data.salesCount} vente(s)</p>
              </div>
            </div>

            {/* Dépenses */}
            <div className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 text-white shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-500 transform hover:scale-105">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingDown size={32} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    {getPeriodLabel()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wider">Dépenses Totales</h3>
                <p className="text-4xl font-black mb-3">{formatCurrency(data.expenses.total)}</p>
                <p className="text-sm opacity-80 font-medium">📝 {data.expensesCount} dépense(s)</p>
              </div>
            </div>

            {/* Bénéfice Net */}
            <div
              className={`group relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl transition-all duration-500 transform hover:scale-105 ${
                data.netProfit >= 0
                  ? 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 shadow-purple-500/40 hover:shadow-purple-500/60'
                  : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600 shadow-orange-500/40 hover:shadow-orange-500/60'
              }`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign size={32} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    {data.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wider">Bénéfice Net</h3>
                <p className="text-4xl font-black mb-3">{formatCurrency(data.netProfit)}</p>
                <p className="text-sm opacity-80 font-medium">
                  {data.netProfit >= 0 ? '💰 Profit' : '⚠️ Perte'}
                </p>
              </div>
            </div>
          </div>

          {/* Détail des revenus moderne */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
            <h3 className="relative text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-6">
              💵 Détail des Revenus
            </h3>
            <div className="relative space-y-4">
              <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-2xl">
                <span className="text-gray-700 font-semibold">Sous-total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(data.revenue.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl">
                <span className="text-gray-700 font-semibold">TVA/Taxes</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(data.revenue.tax)}</span>
              </div>
              <div className="flex justify-between items-center py-5 px-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-lg">
                <span className="text-white font-bold text-lg">Total Revenus</span>
                <span className="text-2xl font-black text-white">{formatCurrency(data.revenue.total)}</span>
              </div>
            </div>
          </div>

          {/* Dépenses par catégorie moderne */}
          {data.expenses.byCategory.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white shadow-2xl p-8">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
              <h3 className="relative text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-6">
                📊 Dépenses par Catégorie
              </h3>
              <div className="relative space-y-5">
                {data.expenses.byCategory.map((category, index) => {
                  const percentage = data.expenses.total > 0
                    ? (category.total / data.expenses.total) * 100
                    : 0;

                  return (
                    <div key={index} className="group p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <span
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-sm"
                          style={{
                            backgroundColor: category.color + '20',
                            color: category.color,
                          }}
                        >
                          {category.name}
                        </span>
                        <span className="text-xl font-black text-gray-900">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color,
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-600 font-semibold mt-2">
                        {percentage.toFixed(1)}% du total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Résumé final ultra-moderne */}
          <div className={`relative overflow-hidden rounded-3xl p-10 shadow-2xl border-2 ${
            data.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 border-green-400 shadow-green-500/50'
              : 'bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 border-orange-400 shadow-red-500/50'
          }`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <div className="text-6xl mb-4">
                    {data.netProfit >= 0 ? '🎉' : '⚠️'}
                  </div>
                  <h3 className="text-3xl font-black mb-3">
                    Résultat {getPeriodLabel()}
                  </h3>
                  <p className="text-lg font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl inline-block">
                    {formatCurrency(data.revenue.total)} - {formatCurrency(data.expenses.total)}
                  </p>
                </div>
                <div className="text-right text-white">
                  <p className="text-6xl font-black mb-3 drop-shadow-2xl">
                    {data.netProfit >= 0 ? '+' : ''}{formatCurrency(data.netProfit)}
                  </p>
                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-xl font-bold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
                      Marge: {data.profitMargin.toFixed(2)}%
                    </span>
                    <span className="text-2xl font-black bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
                      {data.netProfit >= 0 ? '📈 PROFIT' : '📉 PERTE'}
                    </span>
                  </div>
                </div>
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
