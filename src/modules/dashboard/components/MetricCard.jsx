import React from 'react';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';

const FormattedNumber = ({ value, style, minimumFractionDigits = 0 }) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  });
  const formatted = formatter.format(style === 'percent' ? value / 100 : value);
  return <>{formatted}</>;
};
const MetricCard = ({ title, value, change, marginPct, icon: Icon, color, format = 'number', isDark, currency }) => {
  const safeToLocaleString = (val) => (val || 0).toLocaleString();
  const formatValue = (val) => {
    if (format === 'currency') {
      return `${safeToLocaleString(val)} ${currency || 'FCFA'}`;
    }
    return safeToLocaleString(val);
  };

  const changeColor = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';
  const ChangeIcon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Activity;

  return (
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {Icon && <Icon size={24} color={color} />}
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748', margin: 0 }}>
          {title}
        </h3>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748', marginBottom: '4px' }}>
          {formatValue(value)}
        </div>
        {typeof marginPct === 'number' && (
          <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#4a5568' }}>
            (<FormattedNumber value={marginPct} style="percent" minimumFractionDigits={1} /> du CA)
          </div>
        )}
      </div>

      {change !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: changeColor }}>
          <ChangeIcon size={16} />
          <span>{Math.abs(change)}% vs période précédente</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
