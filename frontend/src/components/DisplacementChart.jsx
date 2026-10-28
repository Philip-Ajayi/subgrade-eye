import React, { useRef, useEffect } from 'react';

export default function DisplacementChart({ segment }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !segment) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const values = segment.insar_point.historical_displacement_mm;
    const timestamps = segment.insar_point.timestamps;

    if (!values || values.length === 0) return;

    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minVal = -30.0;
    const maxVal = 5.0;

    const getY = (val) => padding.top + chartH * (1 - (val - minVal) / (maxVal - minVal));
    const getX = (idx) => padding.left + (idx / (values.length - 1)) * chartW;

    // Grid lines & Y-Labels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';

    [-25, -20, -15, -10, -5, 0].forEach((yTick) => {
      const y = getY(yTick);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${yTick}mm`, 10, y + 3);
    });

    // Slow Order Critical Threshold (-25mm)
    const critY = getY(-25.0);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, critY);
    ctx.lineTo(width - padding.right, critY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('CRITICAL TSR LIMIT (-25mm)', width - 180, critY - 6);

    // Fill under settlement curve
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(0));
    values.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(getX(values.length - 1), getY(minVal));
    ctx.lineTo(getX(0), getY(minVal));
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, padding.top, 0, height);
    fillGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(getX(i), getY(v));
      else ctx.lineTo(getX(i), getY(v));
    });
    ctx.stroke();

    // Data Points
    values.forEach((v, i) => {
      const x = getX(i);
      const y = getY(v);
      ctx.fillStyle = v <= -15.0 ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // X-Axis Labels (first, middle, last)
    ctx.fillStyle = '#64748b';
    ctx.fillText(timestamps[0], getX(0), height - 10);
    ctx.fillText(timestamps[Math.floor(timestamps.length / 2)], getX(Math.floor(timestamps.length / 2)) - 25, height - 10);
    ctx.fillText(timestamps[timestamps.length - 1], getX(values.length - 1) - 50, height - 10);
  }, [segment]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: '170px' }}>
        <canvas
          ref={canvasRef}
          width={540}
          height={180}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 16px',
        fontSize: '0.75rem',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Velocity (V_vert): </span>
          <span className="mono" style={{
            fontWeight: 700,
            color: segment?.insar_point.v_vert_mm_year <= -10 ? '#ef4444' : '#06b6d4'
          }}>
            {segment ? segment.insar_point.v_vert_mm_year : 0} mm/year
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Radar Coherence (γ): </span>
          <span className="mono" style={{ fontWeight: 700, color: '#10b981' }}>
            {segment ? segment.insar_point.coherence : 0}
          </span>
        </div>
      </div>
    </div>
  );
}
