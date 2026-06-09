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
  register: (u, p) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  login: (u, p) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  me: () => request('/auth/me'),
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (title) => request('/campaigns', { method: 'POST', body: JSON.stringify({ title }) }),
  joinCampaign: (code) => request(`/campaigns/join/${code}`, { method: 'POST' }),
  getProfessions: () => request('/professions'),
  getPerks: () => request('/perks'),
  getSkills: () => request('/skills'),
  createCharacter: (data) => request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (id) => request(`/characters/${id}`),
  updateCharacterParams: (id, params) => request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),
  diceAuto: (characterId, skillName) => request('/dice/auto', { method: 'POST', body: JSON.stringify({ character_id: characterId, skill_name: skillName }) }),

  // NPC
  getNPCs: (campaignId) => request(`/npcs?campaign_id=${campaignId}`),
  getTemplates: () => request('/npcs?is_template=true'),
  createNPC: (data) => request('/npcs', { method: 'POST', body: JSON.stringify(data) }),
  updateNPC: (id, data) => request(`/npcs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNPC: (id) => request(`/npcs/${id}`, { method: 'DELETE' }),
  cloneNPC: (id, name) => request(`/npcs/${id}/clone`, { method: 'POST', body: JSON.stringify({ name }) }),
  rollNPC: (id, skillName) => request(`/npcs/${id}/roll`, { method: 'POST', body: JSON.stringify({ skill_name: skillName }) }),

  getItems: () => request('/items'),
  createItem: (data) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
  // Inventory
  addItem: (characterId, itemId, quantity, slotType) =>
    request('/inventory/add', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType }) }),
  removeItem: (slotId, quantity) =>
    request('/inventory/remove', { method: 'POST', body: JSON.stringify({ slot_id: slotId, quantity }) }),
  equipItem: (slotId) =>
    request('/inventory/equip', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  unequipItem: (slotId) =>
    request('/inventory/unequip', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  reloadWeapon: (weaponSlotId) =>
    request('/inventory/reload', { method: 'POST', body: JSON.stringify({ weapon_slot_id: weaponSlotId }) }),
    shootWeapon: (slotId) => request('/inventory/shoot', { method: 'POST', body: JSON.stringify({ weapon_slot_id: slotId }) }),
  consumeItem: (slotId) => request('/inventory/consume', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  moveItem: (slotId, newSlot) => request('/inventory/move', { method: 'POST', body: JSON.stringify({ slot_id: slotId, new_slot_type: newSlot }) }),
};
