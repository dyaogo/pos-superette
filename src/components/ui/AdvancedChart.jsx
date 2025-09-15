// 📁 OPTIONNEL : src/components/ui/AdvancedChart.jsx
// Ce composant peut remplacer SimpleChart pour une version plus sophistiquée

import React, { useState } from 'react';
import { TrendingUp, BarChart3, LineChart, Eye, EyeOff } from 'lucide-react';

const AdvancedChart = ({ data, title, subtitle, isDark = false }) => {
  const [showMargins, setShowMargins] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' ou 'line'

  const maxValue = Math.max(
    ...data.map(d => Math.max(
      showSales ? d.ventes : 0,
      showMargins ? d.marges : 0
    ))
  );

  const totalSales = data.reduce((sum, d) => sum + d.ventes, 0);
  const totalMargins = data.reduce((sum, d) => sum + d.marges, 0);

  // Composant BarChart
  const BarChart = () => (
    <div style={{
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-around',
      height: '250px',
      padding: '0 20px',
      position: 'relative'
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}>
        {[0, 25, 50, 75, 100].map(percent => (
          <div
            key={percent}
            style={{
              position: 'absolute',
              top: `${100 - percent}%`,
              left: 0,
              right: 0,
              height: '1px',
              background: isDark ? '#374151' : '#f1f5f9',
              opacity: 0.5
            }}
          />
        ))}
      </div>

      {data.map((item, index) => {
        const salesHeight = showSales ? (item.ventes / maxValue) * 220 : 0;
        const marginsHeight = showMargins ? (item.marges / maxValue) * 220 : 0;

        return (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            maxWidth: '80px',
            position: 'relative'
          }}>
            {/* Tooltip au survol */}
            <div style={{
              display: 'flex',
              alignItems: 'end',
              gap: '4px',
              height: '230px',
              position: 'relative',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              // Créer tooltip
              const tooltip = document.createElement('div');
              tooltip.innerHTML = `
                <div style="
                  background: ${isDark ? '#1f2937' : 'white'};
                  border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
                  border-radius: 8px;
                  padding: 12px;
                  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                  font-size: 12px;
                  color: ${isDark ? '#f9fafb' : '#1f2937'};
                  z-index: 1000;
                  position: absolute;
                  top: -60px;
                  left: 50%;
                  transform: translateX(-50%);
                  white-space: nowrap;
                ">
                  <div><strong>${item.label}</strong></div>
                  ${showSales ? `<div style="color: #3b82f6;">🔵 Ventes: ${item.ventes.toLocaleString()} FCFA</div>` : ''}
                  ${showMargins ? `<div style="color: #10b981;">🟢 Marges: ${item.marges.toLocaleString()} FCFA</div>` : ''}
                </div>
              `;
              e.currentTarget.appendChild(tooltip);
            }}
            onMouseLeave={(e) => {
              const tooltip = e.currentTarget.querySelector('div:last-child');
              if (tooltip) tooltip.remove();
            }}
            >
              {/* Barre des ventes */}
              {showSales && (
                <div style={{
                  width: '20px',
                  height: `${salesHeight}px`,
                  background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '2px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scaleY(1.05)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scaleY(1)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
                />
              )}
              
              {/* Barre des marges */}
              {showMargins && (
                <div style={{
                  width: '20px',
                  height: `${marginsHeight}px`,
                  background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '2px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scaleY(1.05)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scaleY(1)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
                />
              )}
            </div>

            {/* Label */}
            <span style={{
              fontSize: '11px',
              color: isDark ? '#9ca3af' : '#6b7280',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Composant LineChart (courbes)
  const LineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const salesY = showSales ? 100 - (item.ventes / maxValue) * 80 : 50;
      const marginsY = showMargins ? 100 - (item.marges / maxValue) * 80 : 50;
      return { x, salesY, marginsY, ...item };
    });

    const createPath = (points, yKey) => {
      return points.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point[yKey]}`
      ).join(' ');
    };

    return (
      <div style={{
        height: '250px',
        position: 'relative',
        padding: '20px'
      }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100"
          style={{ overflow: 'visible' }}
        >
          {/* Grille */}
          {[20, 40, 60, 80].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke={isDark ? '#374151' : '#f1f5f9'}
              strokeWidth="0.2"
              opacity="0.5"
            />
          ))}

          {/* Courbe des ventes */}
          {showSales && (
            <>
              <path
                d={createPath(points, 'salesY')}
                stroke="#3b82f6"
                strokeWidth="0.8"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                }}
              />
              {points.map((point, index) => (
                <circle
                  key={`sales-${index}`}
                  cx={point.x}
                  cy={point.salesY}
                  r="1"
                  fill="#3b82f6"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${point.label}: ${point.ventes.toLocaleString()} FCFA`}</title>
                </circle>
              ))}
            </>
          )}

          {/* Courbe des marges */}
          {showMargins && (
            <>
              <path
                d={createPath(points, 'marginsY')}
                stroke="#10b981"
                strokeWidth="0.8"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
                }}
              />
              {points.map((point, index) => (
                <circle
                  key={`margins-${index}`}
                  cx={point.x}
                  cy={point.marginsY}
                  r="1"
                  fill="#10b981"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${point.label}: ${point.marges.toLocaleString()} FCFA`}</title>
                </circle>
              ))}
            </>
          )}
        </svg>

        {/* Labels X */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {data.map((item, index) => (
            <span
              key={index}
              style={{
                fontSize: '10px',
                color: isDark ? '#9ca3af' : '#6b7280',
                fontWeight: '500'
              }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: isDark ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
    }}>
      {/* En-tête avec contrôles */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: isDark ? '#f9fafb' : '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#9ca3af' : '#6b7280',
            margin: 0
          }}>
            {subtitle}
          </p>
        </div>

        {/* Contrôles */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* Sélecteur type graphique */}
          <div style={{
            display: 'flex',
            background: isDark ? '#374151' : '#f3f4f6',
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '6px',
                background: chartType === 'bar' ? (isDark ? '#4b5563' : 'white') : 'transparent',
                color: isDark ? '#f9fafb' : '#1f2937',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={14} />
            </button>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '6px',
                background: chartType === 'line' ? (isDark ? '#4b5563' : 'white') : 'transparent',
                color: isDark ? '#f9fafb' : '#1f2937',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              <LineChart size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: isDark ? '#374151' : '#f8fafc',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#3b82f6',
            borderRadius: '50%'
          }} />
          <span style={{
            fontSize: '12px',
            color: isDark ? '#d1d5db' : '#4b5563',
            fontWeight: '500'
          }}>
            Total Ventes: {totalSales.toLocaleString()} FCFA
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: isDark ? '#374151' : '#f8fafc',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%'
          }} />
          <span style={{
            fontSize: '12px',
            color: isDark ? '#d1d5db' : '#4b5563',
            fontWeight: '500'
          }}>
            Total Marges: {totalMargins.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      {/* Contrôles de visibilité */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setShowSales(!showSales)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: showSales ? '#3b82f615' : 'transparent',
            color: showSales ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280'),
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          {showSales ? <Eye size={12} /> : <EyeOff size={12} />}
          Ventes
        </button>
        
        <button
          onClick={() => setShowMargins(!showMargins)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: showMargins ? '#10b98115' : 'transparent',
            color: showMargins ? '#10b981' : (isDark ? '#9ca3af' : '#6b7280'),
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          {showMargins ? <Eye size={12} /> : <EyeOff size={12} />}
          Marges Brutes
        </button>
      </div>

      {/* Graphique */}
      <div style={{ position: 'relative' }}>
        {chartType === 'bar' ? <BarChart /> : <LineChart />}
      </div>
    </div>
  );
};

export default AdvancedChart;
