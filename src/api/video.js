// API helper dla wideo-wizyt
const API_URL = import.meta.env.VITE_API_URL || '';

export async function createVideoSession({ providerId, orderId, scheduledAt, price }) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      providerId,
      orderId,
      scheduledAt,
      price
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia sesji wideo');
  }

  return res.json();
}

export async function getVideoSessionToken(sessionId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/${sessionId}/token`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd pobierania tokena');
  }

  return res.json();
}

export async function getVideoSessions(status = null) {
  const token = localStorage.getItem('token');
  const url = status 
    ? `${API_URL}/api/video/sessions?status=${status}`
    : `${API_URL}/api/video/sessions`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd pobierania sesji');
  }

  return res.json();
}

export async function updateVideoSessionStatus(sessionId, status) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/${sessionId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd aktualizacji statusu');
  }

  return res.json();
}

export async function getVideoRecordings(sessionId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/${sessionId}/recordings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd pobierania nagrań');
  }

  return res.json();
}

export async function createVideoPaymentIntent({ providerId, orderId, price }) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      providerId,
      orderId,
      price
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia płatności');
  }

  return res.json();
}

export async function getVideoSessionByOrder(orderId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/video/sessions/by-order/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd pobierania sesji wideo');
  }

  return res.json();
}
