import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Play, Pause, Gauge, AlertCircle, Layers } from 'lucide-react';

export default function CabVisionPlayer({ segment }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const frameRef = useRef(0);

  // Procedural Cab-Vision Rail Simulation with Dynamic Segmentation Overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      if (isPlaying) {
        frameRef.current += 1.5 * playbackSpeed;
      }
      const t = frameRef.current;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Sky & Horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.45);

      // 2. Mountain Embankments (Rhine Gorge)
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      ctx.lineTo(width * 0.35, height * 0.28);
      ctx.lineTo(width * 0.65, height * 0.32);
      ctx.lineTo(width, height * 0.45);
      ctx.closePath();
      ctx.fill();

      // 3. Ground / Ballast Trackbed Perspective
      const groundGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
      groundGrad.addColorStop(0, '#334155');
      groundGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      // Vanishing point coordinates
      const vpX = width * 0.5;
      const vpY = height * 0.45;

      // 4. Moving Ballast Ties (Sleepers)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      const numTies = 14;
      for (let i = 0; i < numTies; i++) {
        const offset = ((i / numTies) + (t * 0.02)) % 1.0;
        const tieY = vpY + (Math.pow(offset, 2.2) * (height - vpY));
        const tieHalfWidth = offset * width * 0.45;

        ctx.beginPath();
        ctx.moveTo(vpX - tieHalfWidth, tieY);
        ctx.lineTo(vpX + tieHalfWidth, tieY);
        ctx.stroke();
      }

      // 5. Rails (Left and Right steel rails)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(vpX - 8, vpY);
      ctx.lineTo(width * 0.22, height);
      ctx.moveTo(vpX + 8, vpY);
      ctx.lineTo(width * 0.78, height);
      ctx.stroke();

      // 6. Catenary Wire Gantry Arches
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let p = 0; p < 3; p++) {
        const pOffset = ((p / 3) + (t * 0.008)) % 1.0;
        const poleY = vpY + (Math.pow(pOffset, 2.0) * (height - vpY));
        const poleX1 = vpX - (pOffset * width * 0.55);
        const poleX2 = vpX + (pOffset * width * 0.55);
        const poleTop = poleY - (pOffset * 180);

        ctx.beginPath();
        ctx.moveTo(poleX1, poleY);
        ctx.lineTo(poleX1, poleTop);
        ctx.lineTo(poleX2, poleTop);
        ctx.lineTo(poleX2, poleY);
        ctx.stroke();
      }

      // 7. REAL-TIME AI SEMANTIC SEGMENTATION OVERLAY
      if (showOverlay && segment) {
        const isCritical = segment.risk_level === 'CRITICAL';
        const isWarning = segment.risk_level === 'WARNING';

        if (isCritical || isWarning) {
          // A. Fouled Ballast / Mud Pumping Slurry (Magenta Mask)
          ctx.save();
          ctx.fillStyle = 'rgba(236, 72, 153, 0.42)'; // Neon Magenta
          ctx.beginPath();
          const mudY = height * 0.65;
          ctx.ellipse(width * 0.42, mudY, width * 0.16, height * 0.12, 0.1, 0, 2 * Math.PI);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ec4899';
          ctx.stroke();
          ctx.restore();

          // Mud Pumping Bounding Box Label
          ctx.fillStyle = '#ec4899';
          ctx.font = '600 11px JetBrains Mono';
          ctx.fillText(`[MUD_PUMPING: ${Math.round(segment.vision_evidence.fouled_ballast_ratio * 100)}%]`, width * 0.28, mudY - 30);

          // B. Standing Ditch Water Accumulation (Cyan Mask)
          if (segment.vision_evidence.standing_water_ratio > 0.08) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.45)'; // Cyan
            ctx.beginPath();
            const waterY = height * 0.78;
            ctx.ellipse(width * 0.72, waterY, width * 0.12, height * 0.09, -0.2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#06b6d4';
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#06b6d4';
            ctx.font = '600 11px JetBrains Mono';
            ctx.fillText(`[PONDING_WATER: ${Math.round(segment.vision_evidence.standing_water_ratio * 100)}%]`, width * 0.64, waterY - 24);
          }
        }
      }

      // 8. Driver HUD Telemetry
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(12, 12, 260, 72);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(12, 12, 260, 72);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 12px JetBrains Mono';
      ctx.fillText(`CAB_CAM_01: FORWARD_MAIN`, 20, 30);

      ctx.font = '500 11px JetBrains Mono';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`CHAINAGE: KM ${segment ? segment.chainage_km.toFixed(3) : '42.700'}`, 20, 48);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`SEGF_B2 INFERENCE: 24.8 FPS | mIoU: 0.742`, 20, 66);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, showOverlay, playbackSpeed, segment]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', flex: 1, background: '#000', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Video Control Bar Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          background: 'rgba(10, 13, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px' }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              className="btn btn-outline"
              style={{
                padding: '4px 8px',
                borderColor: showOverlay ? 'var(--accent-cyan)' : 'var(--border-color)',
                color: showOverlay ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}
              onClick={() => setShowOverlay(!showOverlay)}
            >
              {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
              <span style={{ fontSize: '0.75rem' }}>AI Segmentation Mask</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                className="mono"
                style={{
                  background: playbackSpeed === spd ? 'var(--accent-cyan)' : 'transparent',
                  color: playbackSpeed === spd ? '#041017' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
                onClick={() => setPlaybackSpeed(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optical Evidence Metrics Footer */}
      <div style={{
        padding: '12px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        fontSize: '0.75rem'
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Fouled Ballast Ratio:</div>
          <div className="mono" style={{
            fontWeight: 700,
            color: segment?.vision_evidence.fouled_ballast_ratio > 0.15 ? '#ec4899' : '#10b981'
          }}>
            {segment ? (segment.vision_evidence.fouled_ballast_ratio * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Water Ponding Ratio:</div>
          <div className="mono" style={{
            fontWeight: 700,
            color: segment?.vision_evidence.standing_water_ratio > 0.10 ? '#06b6d4' : '#10b981'
          }}>
            {segment ? (segment.vision_evidence.standing_water_ratio * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>SegFormer Validation:</div>
          <div className="mono" style={{ fontWeight: 700, color: '#f1f5f9' }}>
            mIoU: 0.742 (RailSem19)
          </div>
        </div>
      </div>
    </div>
  );
}
