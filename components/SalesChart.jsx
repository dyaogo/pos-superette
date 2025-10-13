import { useEffect, useRef } from 'react';

export default function SalesChart({ data, type = 'bar', title }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Trouver le maximum pour l'échelle
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = chartWidth / data.length - 10;

    // Dessiner les axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Dessiner les barres
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + 10) + 5;
      const y = height - padding - barHeight;

      // Barre avec gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#60a5fa');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label sous la barre
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - padding + 20);

      // Valeur au-dessus de la barre
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(item.value.toLocaleString(), x + barWidth / 2, y - 5);
    });

  }, [data, type]);

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      padding: '20px', 
      borderRadius: '12px',
      border: '1px solid var(--color-border)'
    }}>
      {title && (
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={300}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}