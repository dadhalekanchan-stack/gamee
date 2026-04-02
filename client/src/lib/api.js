const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

async function callApi(endpoint, options = {}) {
  const mergedHeaders = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const registerPlayer = (username, password) =>
  callApi('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })

export const loginPlayer = (username, password) =>
  callApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const getPlayer = (player_id) =>
  callApi(`/player/${player_id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('academia_token')}`,
    },
  })

export const syncPosition = (player_id, map_x, map_y) =>
  callApi('/player/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('academia_token')}`,
    },
    body: JSON.stringify({ player_id, map_x, map_y }),
  })

export const getBadges = (player_id) =>
  callApi(`/badges/${player_id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('academia_token')}`,
    },
  })
