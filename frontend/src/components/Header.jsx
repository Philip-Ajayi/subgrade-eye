import React from 'react';
import { Radar, TrainTrack, ShieldCheck, Database } from 'lucide-react';

export default function Header({ corridor, selectedSegment }) {
  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0891b2, #0284c7)',
          padding: '8px',
          borderRadius: '8px'
        }}>
          <Radar size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>
              SUBGRADE-EYE
            </h1>
            <span style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid #0891b2',
              color: '#38bdf8',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              LIVE OPS CONSOLE v1.0
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            European Ground Motion Service (InSAR) ⊗ RailSem19 Cab-Vision Fusion
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
          <TrainTrack size={16} color="#06b6d4" />
          <span style={{ color: 'var(--text-muted)' }}>Corridor:</span>
          <span style={{ fontWeight: 600 }}>{corridor ? corridor.corridor_name : 'Loading...'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
          <Database size={16} color="#10b981" />
          <span style={{ color: 'var(--text-muted)' }}>Sentinel-1 PS Points:</span>
          <span className="mono" style={{ fontWeight: 700, color: '#10b981' }}>
            {corridor ? corridor.total_segments : 0}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: selectedSegment?.risk_level === 'CRITICAL' ? 'var(--danger-glow)' : 'var(--bg-tertiary)',
          border: `1px solid ${selectedSegment?.risk_level === 'CRITICAL' ? 'var(--danger-red)' : 'var(--border-accent)'}`,
          padding: '6px 12px',
          borderRadius: '6px'
        }}>
          <ShieldCheck size={16} color={selectedSegment?.risk_level === 'CRITICAL' ? '#ef4444' : '#10b981'} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            CURRENT SNAP: KM {selectedSegment ? selectedSegment.chainage_km.toFixed(3) : '---'}
          </span>
        </div>
      </div>
    </header>
  );
}
