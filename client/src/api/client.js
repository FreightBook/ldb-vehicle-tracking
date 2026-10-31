const API_BASE = '/api';

export function getStoredAccessCode() {
  return localStorage.getItem('fastag_access_code') || '';
}

export function setStoredAccessCode(code) {
  if (code) {
    localStorage.setItem('fastag_access_code', code);
  } else {
    localStorage.removeItem('fastag_access_code');
  }
}

function getHeaders(custom = {}) {
  const code = getStoredAccessCode();
  return {
    ...custom,
    ...(code ? { 'x-access-code': code } : {}),
  };
}

export async function verifyAccessCode(code) {
  const res = await fetch(`${API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid passcode');
  }
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to connect to backend server');
  return res.json();
}

export async function fetchTrips(status = 'ACTIVE', search = '') {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/trips?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch trips');
  }
  return res.json();
}

export async function fetchTripDetails(id) {
  const res = await fetch(`${API_BASE}/trips/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch trip details');
  }
  return res.json();
}

export async function createTrip(data) {
  const res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create trip');
  }
  return res.json();
}

export async function manualPollTrip(id) {
  const res = await fetch(`${API_BASE}/trips/${id}/poll`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to poll toll updates');
  }
  return res.json();
}

export async function endTrip(id) {
  const res = await fetch(`${API_BASE}/trips/${id}/end`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to stop tracking');
  }
  return res.json();
}

export async function deleteTrip(id) {
  const res = await fetch(`${API_BASE}/trips/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete trip');
  }
  return res.json();
}

export function getTripPdfUrl(id) {
  const code = getStoredAccessCode();
  return `${API_BASE}/trips/${id}/pdf${code ? `?code=${encodeURIComponent(code)}` : ''}`;
}
