const API_URL = 'https://apostol-api.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  // Auth
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),

  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (title) =>
    request('/campaigns', { method: 'POST', body: JSON.stringify({ title }) }),
  joinCampaign: (code) =>
    request(`/campaigns/join/${code}`, { method: 'POST' }),

  // Professions
  getProfessions: () => request('/professions'),

  // Perks
  getPerks: () => request('/perks'),

  // Skills
  getSkills: () => request('/skills'),

  // Characters
  createCharacter: (data) =>
    request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (id) => request(`/characters/${id}`),
  updateCharacterParams: (id, params) =>
    request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),

  // Items
  getItems: () => request('/items'),
  createItem: (data) =>
    request('/items', { method: 'POST', body: JSON.stringify(data) }),
};
