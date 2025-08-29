import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

// Map for day and month names used in labels
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Regroupe l'historique des ventes selon la période sélectionnée
 * et retourne les labels et les totaux correspondants.
 */
export const groupSalesByPeriod = (salesHistory = [], selectedPeriod = 'today', now = new Date()) => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const periods = {
    today: { start: startOfToday },
    week: { start: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) }, // 7 derniers jours
    month: { start: new Date(now.getFullYear(), now.getMonth(), 1) },
    year: { start: new Date(now.getFullYear(), 0, 1) }
  };

  const { start } = periods[selectedPeriod] || periods.today;
  const groups = {};

  salesHistory.forEach(sale => {
    const date = new Date(sale.date);
    if (isNaN(date) || date < start || date > now) return;

    let key;
    switch (selectedPeriod) {
      case 'today':
        key = `${date.getHours()}h`;
        break;
      case 'week':
        key = `${DAY_NAMES[date.getDay()]} ${date.getDate()}`;
        break;
      case 'month':
        key = `W${Math.floor((date.getDate() - 1) / 7) + 1}`;
        break;
      case 'year':
      default:
        key = MONTH_NAMES[date.getMonth()];
        break;
    }

    if (!groups[key]) {
      groups[key] = { revenue: 0, margin: 0 };
    }

    groups[key].revenue += sale.total || 0;
    (sale.items || []).forEach(item => {
      groups[key].margin += item.quantity * (item.price - item.costPrice);
    });
  });

  let labels = [];

  switch (selectedPeriod) {
    case 'today':
      labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
      break;
    case 'week':
      // Les 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(`${DAY_NAMES[d.getDay()]} ${d.getDate()}`);
      }
      break;
    case 'month':
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weekCount = Math.ceil(lastDay / 7);
      for (let i = 1; i <= weekCount; i++) {
        labels.push(`W${i}`);
      }
      break;
    case 'year':
    default:
      labels = MONTH_NAMES;
      break;
  }

  return labels.map(label => ({
    label,
    revenue: groups[label]?.revenue ?? 0,
    margin: groups[label]?.margin ?? 0,
  }));
};

const X_AXIS_LABELS = {
  today: 'Heure',
  week: 'Jour',
  month: 'Semaine',
  year: 'Mois'
};

/**
 * Affiche un graphique en barres représentant les ventes
 * pour la période sélectionnée.
 */
const SalesChart = ({ salesHistory, selectedPeriod }) => {
  const chartData = groupSalesByPeriod(salesHistory, selectedPeriod);

  return (
    <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="label" label={{ value: X_AXIS_LABELS[selectedPeriod], position: 'insideBottomRight', offset: -5 }} />
          <YAxis label={{ value: 'Total des ventes', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => value} />
          <Bar dataKey="revenue" fill="#3b82f6">
            <LabelList dataKey="revenue" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;

