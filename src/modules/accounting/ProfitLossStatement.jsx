import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, AlertCircle, Calendar, Info, Download,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

const ProfitLossStatement = ({ currentStore }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const loadProfitLoss = async () => {
    setLoading(true);
    try {
      const url = `/api/accounting/profit-loss?storeId=${currentStore.id}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Erreur chargement compte de résultat:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentStore) {
      loadProfitLoss();
    }
  }, [currentStore, dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatPercent = (value) => {
    return value.toFixed(2) + '%';
  };

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

  // Périodes prédéfinies
  const setPeriod = (period) => {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = now;
        break;
      case 'week':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = now;
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      default:
        return;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Chargement du compte de résultat...</p>
          <p className="text-gray-600 mt-2">Analyse des données en cours</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Erreur de chargement</p>
              <p className="text-sm text-red-700">Impossible de charger le compte de résultat</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = data.revenue.total > 0 || data.expenses.total > 0;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header modernisé */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compte de Résultat</h1>
          <p className="text-gray-600 mt-1">Analyse financière de {currentStore.name}</p>
        </div>

        {/* Boutons de période rapide */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPeriod('today')}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('week')}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriod('month')}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
          >
            Ce mois
          </button>
          <button
            onClick={() => setPeriod('year')}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
          >
            Cette année
          </button>
        </div>
      </div>

      {/* Sélecteur de dates personnalisé */}
      <div className="bg-white p-5 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Calendar size={20} />
            <span>Période personnalisée:</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            <span className="text-gray-500 font-medium">→</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Message si pas de données */}
      {!hasData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Info size={28} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-blue-900 text-lg">Aucune donnée pour cette période</p>
              <p className="text-blue-700 mt-2">
                Créez des ventes via la page <span className="font-semibold">Caisse</span> et des dépenses 
                via l'onglet <span className="font-semibold">Dépenses</span> pour voir le compte de résultat complet.
              </p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => window.location.href = '/pos'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-semibold"
                >
                  Aller à la Caisse
                </button>
                <button 
                  onClick={() => setPeriod('month')}
                  className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-200 text-sm font-semibold"
                >
                  Voir ce mois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards modernisées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenus */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign size={28} strokeWidth={2.5} />
            </div>
            <TrendingUp size={24} className="opacity-60" />
          </div>
          <p className="text-sm opacity-90 font-medium">Revenus</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(data.revenue.total)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">CA HT: {formatCurrency(data.revenue.subtotal)}</p>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <ShoppingCart size={28} strokeWidth={2.5} />
            </div>
            <TrendingDown size={24} className="opacity-60" />
          </div>
          <p className="text-sm opacity-90 font-medium">Dépenses</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(data.expenses.total)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">
              {data.expenses.byCategory.length} catégorie{data.expenses.byCategory.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Marge Brute */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BarChart3 size={28} strokeWidth={2.5} />
            </div>
            <TrendingUp size={24} className="opacity-60" />
          </div>
          <p className="text-sm opacity-90 font-medium">Marge Brute</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(data.grossProfit.amount)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">Taux: {formatPercent(data.grossProfit.margin)}</p>
          </div>
        </div>

        {/* Résultat Net */}
        <div className={`bg-gradient-to-br ${
          data.netProfit.amount >= 0 
            ? 'from-purple-500 to-purple-600' 
            : 'from-orange-500 to-red-600'
        } p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <PieChartIcon size={28} strokeWidth={2.5} />
            </div>
            {data.netProfit.amount >= 0 ? (
              <TrendingUp size={24} className="opacity-60" />
            ) : (
              <TrendingDown size={24} className="opacity-60" />
            )}
          </div>
          <p className="text-sm opacity-90 font-medium">Résultat Net</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(data.netProfit.amount)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">Marge: {formatPercent(data.netProfit.margin)}</p>
          </div>
        </div>
      </div>

      {/* Détail du Compte de Résultat */}
      {hasData && (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Détail du Compte de Résultat</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Download size={18} />
              Exporter PDF
            </button>
          </div>

          <div className="space-y-6">
            {/* REVENUS */}
            <div>
              <div className="flex justify-between items-center py-3 border-b-2 border-blue-600">
                <span className="font-bold text-gray-900 text-lg">REVENUS</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.revenue.total)}</span>
              </div>
              <div className="pl-6 space-y-2 mt-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Chiffre d'affaires HT</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(data.revenue.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">TVA collectée</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(data.revenue.taxCollected)}</span>
                </div>
                {data.revenue.returns > 0 && (
                  <div className="flex justify-between items-center py-2 text-red-600">
                    <span>Retours</span>
                    <span>- {formatCurrency(data.revenue.returns)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* COÛT DES MARCHANDISES VENDUES */}
            <div>
              <div className="flex justify-between items-center py-3 border-b-2 border-orange-600">
                <span className="font-bold text-gray-900 text-lg">COÛT DES MARCHANDISES VENDUES (COGS)</span>
                <span className="font-bold text-red-600 text-lg">({formatCurrency(data.cogs.total)})</span>
              </div>
            </div>

            {/* MARGE BRUTE */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 text-lg">MARGE BRUTE</span>
                  <p className="text-sm text-gray-600 mt-1">Revenus - COGS</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-2xl">{formatCurrency(data.grossProfit.amount)}</p>
                  <p className="text-sm text-gray-600 mt-1">Taux: {formatPercent(data.grossProfit.margin)}</p>
                </div>
              </div>
            </div>

            {/* DÉPENSES OPÉRATIONNELLES */}
            <div>
              <div className="flex justify-between items-center py-3 border-b-2 border-red-600">
                <span className="font-bold text-gray-900 text-lg">DÉPENSES OPÉRATIONNELLES</span>
                <span className="font-bold text-red-600 text-lg">({formatCurrency(data.expenses.total)})</span>
              </div>
              <div className="pl-6 space-y-3 mt-4">
                {data.expenses.byCategory.map((cat) => (
                  <div key={cat.categoryId} className="flex justify-between items-center py-2 hover:bg-gray-50 rounded-lg px-3 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-700 font-medium">{cat.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {cat.count} dépense{cat.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900 font-semibold">{formatCurrency(cat.amount)}</span>
                      <span className="text-xs text-gray-500 ml-3">({formatPercent(cat.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RÉSULTAT NET */}
            <div className={`p-6 rounded-xl border-l-4 ${
              data.netProfit.amount >= 0 
                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-500' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-500'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 text-xl">RÉSULTAT NET</span>
                  <p className="text-sm text-gray-600 mt-1">Marge Brute - Dépenses</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-3xl ${
                    data.netProfit.amount >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.netProfit.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Marge: {formatPercent(data.netProfit.margin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Produits par Profit */}
      {hasData && data.cogs.byProduct && data.cogs.byProduct.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🏆 Top 10 Produits par Profit</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Produit</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Quantité</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Revenus</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Coût</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Profit</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.cogs.byProduct.slice(0, 10).map((product, idx) => {
                  const revenue = product.quantity * product.price;
                  const cost = product.totalCost;
                  const profit = revenue - cost;
                  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                  return (
                    <tr 
                      key={product.productId} 
                      className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.productName}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">{product.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(revenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        {formatCurrency(cost)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                        {formatCurrency(profit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          margin >= 50 ? 'bg-green-100 text-green-800' :
                          margin >= 30 ? 'bg-blue-100 text-blue-800' :
                          margin >= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercent(margin)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossStatement;