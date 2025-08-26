import React, { useRef, useEffect } from 'react';

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

    groups[key] = (groups[key] || 0) + (sale.total || 0);
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

  const data = labels.map(label => groups[label] || 0);

  return { labels, data };
};

/**
 * Affiche un graphique simple en utilisant la balise canvas
 * représentant les ventes pour la période sélectionnée.
 */
const SalesChart = ({ salesHistory, selectedPeriod }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { labels, data } = groupSalesByPeriod(salesHistory, selectedPeriod);
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;

    ctx.clearRect(0, 0, width, height);

    // Axes
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const max = Math.max(...data, 1);
    const stepX = (width - padding * 2) / (data.length - 1 || 1);
    const chartHeight = height - padding * 2;

    // Ligne des données
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (val / max) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    ctx.fillStyle = '#3b82f6';
    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (val / max) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [salesHistory, selectedPeriod]);

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <canvas ref={canvasRef} width={800} height={300} style={{ width: '100%' }} />
    </div>
  );
};

export default SalesChart;

