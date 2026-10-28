import React, { useState, useEffect } from 'react';
import { CloudRain, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { simulatePrecipitation } from '../services/api';

export default function RiskSimulator({ segment, onWorkOrderClick }) {
  const [rainMm, setRainMm] = useState(0);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!segment) return;
    let isMounted = true;
    setLoading(true);

    simulatePrecipitation(segment.chainage_km, rainMm)
      .then((data) => {
        if (isMounted) {
          setSimResult(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [segment, rainMm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
      {/* Precipitation Scenario Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CloudRain size={16} color="#38bdf8" />
            Seasonal Rainfall Stress Scenario:
          </label>
          <span className="mono" style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: rainMm > 40 ? '#f59e0b' : '#38bdf8'
          }}>
            +{rainMm} mm excess saturation
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="120"
          step="5"
          value={rainMm}
          onChange={(e) => setRainMm(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent-cyan)',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          <span>Dry Season (+0 mm)</span>
          <span>Moderate Rainfall (+50 mm)</span>
          <span>Severe Storm Event (+120 mm)</span>
        </div>
      </div>

      {/* Cross-Modal Failure Acceleration Card */}
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subgrade Failure Index</div>
          <div className="mono" style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: simResult?.projected_sfi >= 7.0 ? '#ef4444' : (simResult?.projected_sfi >= 4.0 ? '#f59e0b' : '#10b981')
          }}>
            {simResult ? simResult.projected_sfi.toFixed(1) : '---'}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / 10</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pore Acceleration</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
            {simResult ? `${simResult.settlement_acceleration_factor}x` : '1.0x'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Time-to-Slow-Order</div>
          <div className="mono" style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: simResult?.projected_time_to_tsr_days <= 30 ? '#ef4444' : '#f59e0b'
          }}>
            {simResult ? `${simResult.projected_time_to_tsr_days}d` : '---'}
          </div>
        </div>
      </div>

      {/* Action Dispatch Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#f59e0b" />
          Pre-fault window detected before track geometry warp.
        </div>
        <button
          className="btn btn-danger"
          onClick={onWorkOrderClick}
        >
          Approve Preventive Intervention
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
