import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Download, FileText, Server } from 'lucide-react';
import { generateWorkOrder } from '../services/api';

export default function WorkOrderModal({ segment, onClose }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('maximo');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!segment) return;
    generateWorkOrder(segment.segment_id, segment.chainage_km, "Verified by autonomous radar/cab cross-correlation.")
      .then(setData)
      .catch(console.error);
  }, [segment]);

  const copyPayload = () => {
    if (!data) return;
    const content = activeTab === 'maximo'
      ? JSON.stringify(data.ibm_maximo_payload, null, 2)
      : JSON.stringify(data.sap_pm_payload, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!data) return;
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.work_order_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-tertiary)'
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              DISPATCH PREVENTIVE WORK ORDER
            </h2>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
              {data.work_order_id} | {data.chainage_window}
            </p>
          </div>
          <button className="btn btn-outline" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Diagnosis Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-accent)',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              CROSS-MODAL ROOT CAUSE DIAGNOSIS:
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#f1f5f9' }}>{data.diagnosis}</p>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '8px', marginBottom: '4px' }}>
              SPECIFIED INTERVENTION REMEDIATION:
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>{data.recommended_remediation}</p>
          </div>

          {/* Export Selector */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                className="btn"
                style={{
                  background: activeTab === 'maximo' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: activeTab === 'maximo' ? '#041017' : 'var(--text-main)',
                  border: '1px solid var(--border-color)'
                }}
                onClick={() => setActiveTab('maximo')}
              >
                <Server size={14} /> IBM Maximo Integration (REST JSON)
              </button>
              <button
                className="btn"
                style={{
                  background: activeTab === 'sap' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: activeTab === 'sap' ? '#041017' : 'var(--text-main)',
                  border: '1px solid var(--border-color)'
                }}
                onClick={() => setActiveTab('sap')}
              >
                <FileText size={14} /> SAP Plant Maintenance (BAPI PM02)
              </button>
            </div>

            <pre className="mono" style={{
              background: '#070a10',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '14px',
              fontSize: '0.75rem',
              color: '#38bdf8',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {activeTab === 'maximo'
                ? JSON.stringify(data.ibm_maximo_payload, null, 2)
                : JSON.stringify(data.sap_pm_payload, null, 2)
              }
            </pre>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Compliance: ISO 55001 Asset Management Validated
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={copyPayload}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard' : 'Copy Payload'}
            </button>
            <button className="btn btn-primary" onClick={downloadJson}>
              <Download size={14} />
              Download Dispatch Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
