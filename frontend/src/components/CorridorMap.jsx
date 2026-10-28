import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

export default function CorridorMap({ segments, selectedSegment, onSelectSegment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map centered around Boppard/Rhine Valley Line
      const map = L.map(mapContainerRef.current, {
        center: [50.18, 7.61],
        zoom: 12,
        zoomControl: true
      });

      // CartoDB Dark Matter free raster tiles (High-contrast GIS rail map)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Update segments and markers
  useEffect(() => {
    if (!mapInstanceRef.current || !segments || segments.length === 0) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const polylineCoords = [];

    segments.forEach((seg) => {
      const coord = [seg.latitude, seg.longitude];
      polylineCoords.push(coord);

      let color = '#10b981'; // Green
      let radius = 4;

      if (seg.risk_level === 'CRITICAL') {
        color = '#ef4444'; // Red
        radius = 8;
      } else if (seg.risk_level === 'WARNING') {
        color = '#f59e0b'; // Amber
        radius = 6;
      }

      const marker = L.circleMarker(coord, {
        radius: seg.segment_id === selectedSegment?.segment_id ? radius + 4 : radius,
        fillColor: color,
        color: seg.segment_id === selectedSegment?.segment_id ? '#ffffff' : color,
        weight: seg.segment_id === selectedSegment?.segment_id ? 2 : 1,
        opacity: 0.9,
        fillOpacity: 0.85
      });

      marker.on('click', () => {
        onSelectSegment(seg);
      });

      marker.bindTooltip(
        `<div style="font-family:'JetBrains Mono'; font-size:11px;">
          <strong>KM ${seg.chainage_km.toFixed(3)}</strong><br/>
          InSAR Vert: ${seg.insar_point.v_vert_mm_year} mm/yr<br/>
          SFI Index: ${seg.sfi_score} / 10
        </div>`,
        { className: 'leaflet-dark-tooltip' }
      );

      layer.addLayer(marker);
    });

    // Draw rail corridor track centerline
    if (polylineCoords.length > 0) {
      L.polyline(polylineCoords, {
        color: '#38bdf8',
        weight: 2,
        opacity: 0.4,
        dashArray: '4, 4'
      }).addTo(layer);
    }
  }, [segments, selectedSegment, onSelectSegment]);

  // Pan to selected segment
  useEffect(() => {
    if (mapInstanceRef.current && selectedSegment) {
      mapInstanceRef.current.panTo([selectedSegment.latitude, selectedSegment.longitude], {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedSegment]);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#0a0d14' }} />

      {/* Floating Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(16, 22, 35, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '10px 14px',
        zIndex: 1000,
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          InSAR Ground Motion Risk
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <span>Critical Subsidence (SFI &ge; 7.0 | &lt; -10 mm/yr)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <span>Warning Settlement (SFI 4.0 - 6.9 | &lt; -5 mm/yr)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span>Nominal Geotechnical Baseline</span>
        </div>
      </div>
    </div>
  );
}
