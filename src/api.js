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
  register: (u, p) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  login: (u, p) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  me: () => request('/auth/me'),

  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (title) => request('/campaigns', { method: 'POST', body: JSON.stringify({ title }) }),
  joinCampaign: (code) => request(`/campaigns/join/${code}`, { method: 'POST' }),

  // Chat  ← ВОТ СЮДА
  getChatMessages: (campaignId) => request(`/chat/${campaignId}`),
  sendChatMessage: (campaignId, text, isRoll) => request(`/chat/${campaignId}`, { method: 'POST', body: JSON.stringify({ text, is_roll: isRoll || false }) }),

  
  // Professions
  getProfessions: () => request('/professions'),

  // Perks
  getPerks: () => request('/perks'),

  // Skills
  getSkills: () => request('/skills'),

  // Characters
  createCharacter: (data) => request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (id) => request(`/characters/${id}`),
  updateCharacterParams: (id, params) => request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),
  deleteCharacter: (id) => request(`/characters/${id}`, { method: 'DELETE' }),

  // Master characters
  getCampaignCharacters: (campaignId) => request(`/campaigns/${campaignId}/characters`),

  // Dice
  diceAuto: (characterId, skillName) => request('/dice/auto', { method: 'POST', body: JSON.stringify({ character_id: characterId, skill_name: skillName }) }),

  // NPC
  getNPCs: (campaignId) => request(`/npcs?campaign_id=${campaignId}`),
  getTemplates: () => request('/npcs?is_template=true'),
  createNPC: (data) => request('/npcs', { method: 'POST', body: JSON.stringify(data) }),
  updateNPC: (id, data) => request(`/npcs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNPC: (id) => request(`/npcs/${id}`, { method: 'DELETE' }),
  cloneNPC: (id, name) => request(`/npcs/${id}/clone`, { method: 'POST', body: JSON.stringify({ name }) }),
  rollNPC: (id, skillName) => request(`/npcs/${id}/roll`, { method: 'POST', body: JSON.stringify({ skill_name: skillName }) }),

  // Items
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
  useItem: (slotId) =>
    request('/inventory/use', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  reloadWeapon: (slotId) =>
    request('/inventory/reload', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),

  // Master inventory
  updateInventorySlot: (slotId, data) => request(`/inventory/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  masterAddItem: (characterId, itemId, quantity, slotType) =>
    request('/master/inventory/add', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType }) }),

  // Modifications
  addMod: (slotId, modItemId) => request(`/inventory/${slotId}/mod`, { method: 'POST', body: JSON.stringify({ mod_item_id: modItemId }) }),
  removeMod: (slotId, modItemId) => request(`/inventory/${slotId}/mod/${modItemId}`, { method: 'DELETE' }),

  // Scenes
  getScenes: (campaignId, type) => request(`/scenes/${campaignId}?type=${type || 'local'}`),
  updateScene: (campaignId, data) => request(`/scenes/${campaignId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Backgrounds
  uploadBackground: (campaignId, name, url) => request('/upload/background', { method: 'POST', body: JSON.stringify({ campaign_id: campaignId, name, url }) }),
  getBackgrounds: (campaignId) => request(`/backgrounds/${campaignId}`),
};
