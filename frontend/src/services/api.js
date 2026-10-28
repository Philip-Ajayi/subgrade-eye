const API_BASE = '/api/v1';

export async function fetchCorridorSummary() {
  const res = await fetch(`${API_BASE}/corridor/summary`);
  if (!res.ok) throw new Error('Failed to load corridor geodetic data');
  return res.json();
}

export async function fetchSegment(chainageKm) {
  const res = await fetch(`${API_BASE}/corridor/segment/${chainageKm}`);
  if (!res.ok) throw new Error('Failed to fetch segment chainage');
  return res.json();
}

export async function simulatePrecipitation(chainageKm, excessRainMm) {
  const res = await fetch(`${API_BASE}/simulation/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainage_km: chainageKm,
      excess_precipitation_mm: excessRainMm,
      days_forecast: 90
    })
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function generateWorkOrder(segmentId, chainageKm, notes) {
  const res = await fetch(`${API_BASE}/workorder/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segment_id: segmentId,
      chainage_km: chainageKm,
      inspector_notes: notes
    })
  });
  if (!res.ok) throw new Error('Work order export failed');
  return res.json();
}
