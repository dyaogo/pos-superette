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
  ArrowRight
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
        <div className="text-center py-12">Chargement du compte de résultat...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>
      </div>
    );
  }

  const profitColor = data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = data.netProfit.amount >= 0 ? TrendingUp : TrendingDown;
  const ProfitIcon = profitIcon;

  return (
    <div className="p-6 space-y-6">
      {/* Header avec sélection de dates */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compte de Résultat</h1>
          <p className="text-gray-600">{currentStore?.name || 'Tous les magasins'}</p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <ArrowRight size={20} />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Revenus</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenue.total)}</p>
          <p className="text-xs text-gray-500 mt-1">{data.metrics.transactionCount} transactions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Marge Brute</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.grossProfit.amount)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatPercent(data.grossProfit.margin)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Receipt size={24} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Dépenses</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses.total)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatPercent(data.metrics.expenseRatio)} du CA</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${data.netProfit.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <ProfitIcon size={24} className={profitColor} />
            </div>
            <p className="text-sm text-gray-600">Résultat Net</p>
          </div>
          <p className={`text-2xl font-bold ${profitColor}`}>{formatCurrency(data.netProfit.amount)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatPercent(data.netProfit.margin)}</p>
        </div>
      </div>

      {/* Compte de résultat détaillé */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Détail du Compte de Résultat</h2>

          <div className="space-y-4">
            {/* REVENUS */}
            <div>
              <div className="flex justify-between items-center py-2 border-b-2 border-blue-600">
                <span className="font-bold text-gray-900">REVENUS</span>
                <span className="font-bold text-gray-900">{formatCurrency(data.revenue.total)}</span>
              </div>
              <div className="pl-4 space-y-2 mt-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Chiffre d'affaires HT</span>
                  <span className="text-gray-900">{formatCurrency(data.revenue.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">TVA collectée</span>
                  <span className="text-gray-900">{formatCurrency(data.revenue.taxCollected)}</span>
                </div>
                {data.revenue.returns > 0 && (
                  <div className="flex justify-between items-center py-1 text-red-600">
                    <span>Retours</span>
                    <span>- {formatCurrency(data.revenue.returns)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* COÛT DES MARCHANDISES VENDUES */}
            <div>
              <div className="flex justify-between items-center py-2 border-b-2 border-orange-600">
                <span className="font-bold text-gray-900">COÛT DES MARCHANDISES VENDUES</span>
                <span className="font-bold text-red-600">({formatCurrency(data.cogs.total)})</span>
              </div>
            </div>

            {/* MARGE BRUTE */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">MARGE BRUTE</span>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(data.grossProfit.amount)}</p>
                  <p className="text-xs text-gray-600">{formatPercent(data.grossProfit.margin)}</p>
                </div>
              </div>
            </div>

            {/* DÉPENSES OPÉRATIONNELLES */}
            <div>
              <div className="flex justify-between items-center py-2 border-b-2 border-red-600">
                <span className="font-bold text-gray-900">DÉPENSES OPÉRATIONNELLES</span>
                <span className="font-bold text-red-600">({formatCurrency(data.expenses.total)})</span>
              </div>
              <div className="pl-4 space-y-2 mt-2">
                {data.expenses.byCategory.map((cat) => (
                  <div key={cat.categoryId} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-600">{cat.name}</span>
                      <span className="text-xs text-gray-400">({cat.count})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900">{formatCurrency(cat.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatPercent(cat.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RÉSULTAT NET */}
            <div className={`p-4 rounded-lg ${data.netProfit.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">RÉSULTAT NET</span>
                <div className="text-right">
                  <p className={`font-bold text-2xl ${profitColor}`}>
                    {formatCurrency(data.netProfit.amount)}
                  </p>
                  <p className="text-sm text-gray-600">Marge nette: {formatPercent(data.netProfit.margin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails des produits vendus */}
      {data.cogs.byProduct.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Produits par Profit</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Coût</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenu</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.cogs.byProduct
                    .sort((a, b) => b.profit - a.profit)
                    .slice(0, 10)
                    .map((product) => (
                      <tr key={product.productId}>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">{product.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">
                          {formatCurrency(product.totalCost)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
