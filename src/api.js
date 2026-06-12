// src/api.js
const API_URL = 'https://apostol-api.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Сетевая ошибка. Проверьте подключение.', 0);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Ошибка обработки ответа сервера', res.status);
  }

  if (!res.ok) throw new ApiError(data.error || 'Ошибка запроса', res.status);
  return data;
}

export { ApiError };
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
  updateCampaignTime: (campaignId, data) => request(`/campaigns/${campaignId}/time`, { method: 'PUT', body: JSON.stringify(data) }),

  // Chat
  getChatMessages: (campaignId) => request(`/chat/${campaignId}`),
  sendChatMessage: (campaignId, text, isRoll) => request(`/chat/${campaignId}`, { method: 'POST', body: JSON.stringify({ text, is_roll: isRoll || false }) }),

  // Professions
  getProfessions: () => request('/professions'),
  getPerks: () => request('/perks'),
  getSkills: () => request('/skills'),

  // Characters
  createCharacter: (data) => request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (id) => request(`/characters/${id}`),
  updateCharacterParams: (id, params) => request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),
  deleteCharacter: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  getCharacterWeight: (charId) => request(`/characters/${charId}/weight`),
  getCampaignCharacters: (campaignId) => request(`/campaigns/${campaignId}/characters`),

  // Character skills
  addCharacterSkill: (charId, skillId, modifier) => request(`/characters/${charId}/skills`, { method: 'POST', body: JSON.stringify({ skill_id: skillId, modifier }) }),
  updateCharacterSkill: (charId, skillId, modifier) => request(`/characters/${charId}/skills/${skillId}`, { method: 'PUT', body: JSON.stringify({ modifier }) }),
  deleteCharacterSkill: (charId, skillId) => request(`/characters/${charId}/skills/${skillId}`, { method: 'DELETE' }),

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
  reloadWeapon: (slotId, ammoTypeId) =>
    request('/inventory/reload', { method: 'POST', body: JSON.stringify({ slot_id: slotId, ammo_type_id: ammoTypeId }) }),

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
  getBackgrounds: (campaignId) => request(`/backgrounds/${campaignId}`),
  uploadBackground: (data) => request('/upload/background', { method: 'POST', body: JSON.stringify(data) }),
  uploadFile: (image, name, campaignId) => request('/upload/file', { method: 'POST', body: JSON.stringify({ image, name, campaign_id: campaignId }) }),

  // Notes
  getNotes: (campaignId) => request(`/notes/${campaignId}`),
  createNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Handouts
  getHandouts: (campaignId) => request(`/handouts/${campaignId}`),
  createHandout: (data) => request('/handouts', { method: 'POST', body: JSON.stringify(data) }),
  updateHandout: (id, data) => request(`/handouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHandout: (id) => request(`/handouts/${id}`, { method: 'DELETE' }),

  // Sounds
  getSounds: (campaignId) => request(`/sounds/${campaignId}`),
  createSound: (data) => request('/sounds', { method: 'POST', body: JSON.stringify(data) }),
  deleteSound: (id) => request(`/sounds/${id}`, { method: 'DELETE' }),

  // Shop
  getShop: () => request('/shop'),
  getShopPresets: () => request('/shop/presets'),
  createShopPreset: (data) => request('/shop/presets', { method: 'POST', body: JSON.stringify(data) }),
  updateShopPreset: (id, data) => request(`/shop/presets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShopPreset: (id) => request(`/shop/presets/${id}`, { method: 'DELETE' }),
  buyItem: (characterId, itemId, quantity) => request('/shop/buy', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity }) }),

  // Ammo types
  getAmmoTypes: () => request('/ammo-types'),
  createAmmoType: (data) => request('/ammo-types', { method: 'POST', body: JSON.stringify(data) }),
  updateAmmoType: (id, data) => request(`/ammo-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAmmoType: (id) => request(`/ammo-types/${id}`, { method: 'DELETE' }),

  // Currencies
  getCurrencies: () => request('/currencies'),
  createCurrency: (data) => request('/currencies', { method: 'POST', body: JSON.stringify(data) }),
  deleteCurrency: (id) => request(`/currencies/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminItems: () => request('/admin/items'),
  createAdminItem: (data) => request('/admin/items', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminItem: (id, data) => request(`/admin/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminItem: (id) => request(`/admin/items/${id}`, { method: 'DELETE' }),
  batchDeleteItems: (ids) => request('/admin/items/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchUpdatePrice: (ids, trade_price) => request('/admin/items/batch-price', { method: 'PUT', body: JSON.stringify({ ids, trade_price }) }),

  getAdminPerks: () => request('/admin/perks'),
  createAdminPerk: (data) => request('/admin/perks', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminPerk: (id, data) => request(`/admin/perks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminPerk: (id) => request(`/admin/perks/${id}`, { method: 'DELETE' }),

  getAdminProfessions: () => request('/admin/professions'),
  createAdminProfession: (data) => request('/admin/professions', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminProfession: (id, data) => request(`/admin/professions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminProfession: (id) => request(`/admin/professions/${id}`, { method: 'DELETE' }),

  getAdminSkills: () => request('/admin/skills'),
  createAdminSkill: (data) => request('/admin/skills', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminSkill: (id, data) => request(`/admin/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminSkill: (id) => request(`/admin/skills/${id}`, { method: 'DELETE' }),

  getAdminUsers: () => request('/admin/users'),
  updateAdminUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminBackgrounds: () => request('/admin/backgrounds'),
  deleteAdminBackground: (id) => request(`/admin/backgrounds/${id}`, { method: 'DELETE' }),
  getAdminSounds: () => request('/admin/sounds'),
  deleteAdminSound: (id) => request(`/admin/sounds/${id}`, { method: 'DELETE' }),
};
