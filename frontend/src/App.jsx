import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CorridorMap from './components/CorridorMap';
import CabVisionPlayer from './components/CabVisionPlayer';
import DisplacementChart from './components/DisplacementChart';
import RiskSimulator from './components/RiskSimulator';
import WorkOrderModal from './components/WorkOrderModal';
import { fetchCorridorSummary } from './services/api';
import { Map, Video, Activity, Sliders, AlertOctagon } from 'lucide-react';
import './App.css';

export default function App() {
  const [corridor, setCorridor] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWorkOrder, setShowWorkOrder] = useState(false);

  useEffect(() => {
    fetchCorridorSummary()
      .then((data) => {
        setCorridor(data);
        // Default select the critical anomaly at KM 42.700
        const criticalSeg = data.segments.find((s) => s.chainage_km === 42.700) || data.segments[0];
        setSelectedSegment(criticalSeg);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to reach SubGrade-Eye backend service. Verify Docker or API status.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: '#0a0d14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: '#38bdf8',
        fontFamily: 'JetBrains Mono'
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #0891b2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>INITIALIZING GEODETIC FUSION ENGINE...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ padding: '24px', maxWidth: '500px', borderColor: '#ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px' }}>
            <AlertOctagon size={24} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Connection Error</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header corridor={corridor} selectedSegment={selectedSegment} />

      <main className="main-content">
        <div className="grid-dual-pane">
          {/* LEFT PANE: InSAR Regional Corridor Map */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Map size={16} color="#06b6d4" />
                Regional InSAR Displacement Field (Sentinel-1 / EGMS)
              </div>
              <span className={`badge ${selectedSegment?.risk_level === 'CRITICAL' ? 'badge-critical' : 'badge-normal'}`}>
                {selectedSegment?.risk_level} SUBSIDENCE
              </span>
            </div>
            <div style={{ flex: 1, minHeight: '300px' }}>
              <CorridorMap
                segments={corridor.segments}
                selectedSegment={selectedSegment}
                onSelectSegment={setSelectedSegment}
              />
            </div>
          </div>

          {/* RIGHT PANE: Cab-Vision & Cross-Modal Analytics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            {/* Top Right: Synchronized Cab-Cam Semantic Segmentation Player */}
            <div className="card" style={{ flex: 1.1 }}>
              <div className="card-header">
                <div className="card-title">
                  <Video size={16} color="#06b6d4" />
                  Cab-Perspective Visual Forensics (SegFormer-B2)
                </div>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  SNAP: KM {selectedSegment?.chainage_km.toFixed(3)}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <CabVisionPlayer segment={selectedSegment} />
              </div>
            </div>

            {/* Bottom Right: InSAR Time Series + Rainfall Simulator */}
            <div className="card" style={{ flex: 0.9 }}>
              <div className="card-header">
                <div className="card-title">
                  <Activity size={16} color="#06b6d4" />
                  InSAR Displacement Trajectory & Failure Forecasting
                </div>
                <div className="card-title" style={{ fontSize: '0.75rem' }}>
                  <Sliders size={14} color="#f59e0b" />
                  Dynamic Simulation
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                <div style={{ borderRight: '1px solid var(--border-color)' }}>
                  <DisplacementChart segment={selectedSegment} />
                </div>
                <div>
                  <RiskSimulator
                    segment={selectedSegment}
                    onWorkOrderClick={() => setShowWorkOrder(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enterprise Maximo / SAP Work Order Export Modal */}
      {showWorkOrder && selectedSegment && (
        <WorkOrderModal
          segment={selectedSegment}
          onClose={() => setShowWorkOrder(false)}
        />
      )}
    </div>
  );
}
