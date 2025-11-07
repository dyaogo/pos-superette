import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Receipt,
  Download,
  Calendar,
  ArrowRight,
  BarChart3,
  AlertCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfitLossStatement = ({ currentStore }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadProfitLoss();
  }, [currentStore, dateRange]);

  const loadProfitLoss = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentStore?.id) {
        params.append('storeId', currentStore.id);
      }

      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);

      const res = await fetch(`/api/accounting/profit-loss?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        toast.error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error loading P&L:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString() + ' FCFA';
  };

  const formatPercent = (value) => {
    return value.toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">Chargement du compte de résultat...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={64} className="text-gray-400 mb-4" />
          <p className="text-center text-xl font-semibold text-gray-500">Aucune donnée disponible</p>
          <p className="text-center text-sm text-gray-400 mt-2">Vérifiez la période sélectionnée</p>
        </div>
      </div>
    );
  }

  const profitColor = data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = data.netProfit.amount >= 0 ? TrendingUp : TrendingDown;
  const ProfitIcon = profitIcon;

  return (
    <div className="p-6 space-y-6">
      {/* Header avec sélection de dates moderne */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Compte de Résultat
            </h1>
            <p className="text-gray-600 mt-1 font-medium">{currentStore?.name || 'Tous les magasins'}</p>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
            <Calendar size={22} className="text-blue-600" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <ArrowRight size={22} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPIs principaux avec gradients ultra-modernes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Revenus */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 rounded-2xl shadow-2xl text-white transform hover:scale-105 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ShoppingCart size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">Revenus</p>
              <p className="text-xs text-white/70">{data.metrics.transactionCount} transactions</p>
            </div>
          </div>
          <p className="text-3xl font-black mb-1">{formatCurrency(data.revenue.total)}</p>
        </div>

        {/* Marge Brute */}
        <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-6 rounded-2xl shadow-2xl text-white transform hover:scale-105 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <TrendingUp size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">Marge Brute</p>
              <p className="text-xs text-white/70">{formatPercent(data.grossProfit.margin)}</p>
            </div>
          </div>
          <p className="text-3xl font-black mb-1">{formatCurrency(data.grossProfit.amount)}</p>
        </div>

        {/* Dépenses */}
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6 rounded-2xl shadow-2xl text-white transform hover:scale-105 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Receipt size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">Dépenses</p>
              <p className="text-xs text-white/70">{formatPercent(data.metrics.expenseRatio)} du CA</p>
            </div>
          </div>
          <p className="text-3xl font-black mb-1">{formatCurrency(data.expenses.total)}</p>
        </div>

        {/* Résultat Net */}
        <div className={`bg-gradient-to-br ${data.netProfit.amount >= 0 ? 'from-green-500 via-emerald-600 to-teal-600' : 'from-red-500 via-pink-600 to-rose-600'} p-6 rounded-2xl shadow-2xl text-white transform hover:scale-105 hover:shadow-3xl transition-all duration-300`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ProfitIcon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">Résultat Net</p>
              <p className="text-xs text-white/70">{formatPercent(data.netProfit.margin)}</p>
            </div>
          </div>
          <p className="text-3xl font-black mb-1">{formatCurrency(data.netProfit.amount)}</p>
        </div>
      </div>

      {/* Message informatif si pas de ventes */}
      {data.revenue.total === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-md">
          <div className="flex items-start gap-4">
            <Info size={28} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-blue-900 text-lg mb-2">Aucune vente trouvée</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Créez des ventes via la page Caisse pour voir le compte de résultat complet avec revenus et rentabilité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compte de résultat détaillé avec design moderne */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Détail du Compte de Résultat</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* REVENUS */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-lg text-blue-900">REVENUS</span>
                <span className="font-extrabold text-lg text-blue-900">{formatCurrency(data.revenue.total)}</span>
              </div>
              <div className="pl-4 space-y-3">
                <div className="flex justify-between items-center py-2 bg-white/50 px-3 rounded-lg">
                  <span className="text-gray-700 font-medium">Chiffre d'affaires HT</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(data.revenue.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-white/50 px-3 rounded-lg">
                  <span className="text-gray-700 font-medium">TVA collectée</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(data.revenue.taxCollected)}</span>
                </div>
                {data.revenue.returns > 0 && (
                  <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded-lg border border-red-200">
                    <span className="text-red-700 font-medium">Retours</span>
                    <span className="text-red-900 font-semibold">- {formatCurrency(data.revenue.returns)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* COÛT DES MARCHANDISES VENDUES */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-xl border-l-4 border-orange-500 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-lg text-orange-900">COÛT DES MARCHANDISES VENDUES</span>
                <span className="font-extrabold text-lg text-red-700">({formatCurrency(data.cogs.total)})</span>
              </div>
            </div>

            {/* MARGE BRUTE */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xl text-green-900">MARGE BRUTE</span>
                <div className="text-right">
                  <p className="font-extrabold text-2xl text-green-600">{formatCurrency(data.grossProfit.amount)}</p>
                  <p className="text-sm font-semibold text-green-700 mt-1">{formatPercent(data.grossProfit.margin)}</p>
                </div>
              </div>
            </div>

            {/* DÉPENSES OPÉRATIONNELLES */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-lg text-purple-900">DÉPENSES OPÉRATIONNELLES</span>
                <span className="font-extrabold text-lg text-red-700">({formatCurrency(data.expenses.total)})</span>
              </div>
              <div className="pl-4 space-y-3">
                {data.expenses.byCategory.map((cat) => (
                  <div key={cat.categoryId} className="flex justify-between items-center py-2 bg-white/50 px-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-700 font-medium">{cat.name}</span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cat.count} dépense{cat.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900 font-semibold">{formatCurrency(cat.amount)}</span>
                      <span className="text-xs font-medium text-gray-500 ml-3">({formatPercent(cat.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RÉSULTAT NET */}
            <div className={`p-6 rounded-xl border-2 shadow-xl ${data.netProfit.amount >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ProfitIcon size={32} className={profitColor} />
                  <span className="font-extrabold text-2xl text-gray-900">RÉSULTAT NET</span>
                </div>
                <div className="text-right">
                  <p className={`font-extrabold text-3xl ${profitColor}`}>
                    {formatCurrency(data.netProfit.amount)}
                  </p>
                  <p className="text-sm font-semibold text-gray-600 mt-1">Marge nette: {formatPercent(data.netProfit.margin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails des produits vendus avec design moderne */}
      {data.cogs.byProduct.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Top Produits par Profit</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Qté</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Coût</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Revenu</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.cogs.byProduct
                    .sort((a, b) => b.profit - a.profit)
                    .slice(0, 10)
                    .map((product, index) => (
                      <tr
                        key={product.productId}
                        className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-xs">
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-700 font-medium">
                          {formatCurrency(product.totalCost)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-bold ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(product.profit)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossStatement;
