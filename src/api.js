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
  // Утилиты
  fetch: (path, options = {}) => request(path, options),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),

  // ===== AUTH =====
  register: (u, p) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  login: (u, p) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  me: () => request('/auth/me'),

  // ===== CAMPAIGNS =====
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (title) => request('/campaigns', { method: 'POST', body: JSON.stringify({ title }) }),
  joinCampaign: (code) => request(`/campaigns/join/${code}`, { method: 'POST' }),
  updateCampaignTime: (campaignId, data) => request(`/campaigns/${campaignId}/time`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (campaignId, userId) => request(`/campaigns/${campaignId}/members/${userId}`, { method: 'DELETE' }),

  // ===== CHAT =====
  getChatMessages: (campaignId) => request(`/chat/${campaignId}`),
  sendChatMessage: (campaignId, text, isRoll) => request(`/chat/${campaignId}`, { method: 'POST', body: JSON.stringify({ text, is_roll: isRoll || false }) }),

  // ===== DICE =====
  diceAuto: (characterId, skillName) => request('/dice/auto', { method: 'POST', body: JSON.stringify({ character_id: characterId, skill_name: skillName }) }),

  // ===== PROFESSIONS / PERKS / SKILLS =====
  getProfessions: () => request('/professions'),
  getPerks: () => request('/perks'),
  getSkills: () => request('/skills'),

  // ===== CHARACTERISTICS =====
  getCharacteristics: () => request('/characteristics'),
  createCharacteristic: (data) => request('/characteristics', { method: 'POST', body: JSON.stringify(data) }),
  updateCharacteristic: (id, data) => request(`/characteristics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCharacteristic: (id) => request(`/characteristics/${id}`, { method: 'DELETE' }),

  // ===== CHARACTERS =====
  createCharacter: (data) => request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (id) => request(`/characters/${id}`),
  updateCharacterParams: (id, params) => request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),
  deleteCharacter: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  getCharacterWeight: (id) => request(`/characters/${id}/weight`),

  // ===== MASTER CHARACTERS =====
  getCampaignCharacters: (campaignId) => request(`/campaigns/${campaignId}/characters`),
  addCharacterSkill: (charId, skillId, modifier) => request(`/characters/${charId}/skills`, { method: 'POST', body: JSON.stringify({ skill_id: skillId, modifier }) }),
  updateCharacterSkill: (charId, skillId, modifier) => request(`/characters/${charId}/skills/${skillId}`, { method: 'PUT', body: JSON.stringify({ modifier }) }),
  deleteCharacterSkill: (charId, skillId) => request(`/characters/${charId}/skills/${skillId}`, { method: 'DELETE' }),

  // ===== NPC =====
  getNPCs: (campaignId) => request(`/npcs?campaign_id=${campaignId}`),
  getTemplates: () => request('/npcs?is_template=true'),
  createNPC: (data) => request('/npcs', { method: 'POST', body: JSON.stringify(data) }),
  updateNPC: (id, data) => request(`/npcs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNPC: (id) => request(`/npcs/${id}`, { method: 'DELETE' }),
  cloneNPC: (id, name) => request(`/npcs/${id}/clone`, { method: 'POST', body: JSON.stringify({ name }) }),
  rollNPC: (id, skillName) => request(`/npcs/${id}/roll`, { method: 'POST', body: JSON.stringify({ skill_name: skillName }) }),

  // ===== ITEMS =====
  getItems: () => request('/items'),
  createItem: (data) => request('/items', { method: 'POST', body: JSON.stringify(data) }),

  // ===== INVENTORY =====
  addItem: (characterId, itemId, quantity, slotType) => request('/inventory/add', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType }) }),
  removeItem: (slotId, quantity) => request('/inventory/remove', { method: 'POST', body: JSON.stringify({ slot_id: slotId, quantity }) }),
  equipItem: (slotId) => request('/inventory/equip', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  unequipItem: (slotId) => request('/inventory/unequip', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  useItem: (slotId) => request('/inventory/use', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  reloadWeapon: (slotId, ammoTypeId) => request('/inventory/reload', { method: 'POST', body: JSON.stringify({ slot_id: slotId, ammo_type_id: ammoTypeId }) }),

  // ===== MASTER INVENTORY =====
  updateInventorySlot: (slotId, data) => request(`/inventory/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  masterAddItem: (characterId, itemId, quantity, slotType) => request('/master/inventory/add', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType }) }),

  // ===== MODIFICATIONS =====
  addMod: (slotId, modItemId) => request(`/inventory/${slotId}/mod`, { method: 'POST', body: JSON.stringify({ mod_item_id: modItemId }) }),
  removeMod: (slotId, modItemId) => request(`/inventory/${slotId}/mod/${modItemId}`, { method: 'DELETE' }),

  // ===== BASE INVENTORY =====
  getBaseInventory: (campaignId) => request(`/campaigns/${campaignId}/base`),
  depositToBase: (campaignId, slotId, quantity) => request(`/campaigns/${campaignId}/base/deposit`, { method: 'POST', body: JSON.stringify({ slot_id: slotId, quantity }) }),
  withdrawFromBase: (campaignId, baseItemId, quantity) => request(`/campaigns/${campaignId}/base/withdraw`, { method: 'POST', body: JSON.stringify({ base_item_id: baseItemId, quantity }) }),
  setBaseAccess: (campaignId, baseAccess) => request(`/campaigns/${campaignId}/base/access`, { method: 'PUT', body: JSON.stringify({ base_access: baseAccess }) }),

  // ===== LOOT =====
  getLootPools: (campaignId) => request(`/campaigns/${campaignId}/loot`),
  createLootPool: (campaignId, name, items) => request(`/campaigns/${campaignId}/loot`, { method: 'POST', body: JSON.stringify({ name, items }) }),
  updateLootPool: (id, data) => request(`/loot/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLootPool: (id) => request(`/loot/${id}`, { method: 'DELETE' }),
  giveLoot: (poolId, characterId) => request(`/loot/${poolId}/give/${characterId}`, { method: 'POST' }),

  // ===== SCENES =====
  getScenes: (campaignId, type) => request(`/scenes/${campaignId}?type=${type || 'local'}`),
  updateScene: (campaignId, data) => request(`/scenes/${campaignId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ===== BACKGROUNDS =====
  uploadBackground: (campaignId, name, url, isGlobal) => request('/upload/background', { method: 'POST', body: JSON.stringify({ campaign_id: campaignId, name, url, is_global: isGlobal }) }),
  uploadFile: (image, name, campaignId) => request('/upload/file', { method: 'POST', body: JSON.stringify({ image, name, campaign_id: campaignId }) }),
  getBackgrounds: (campaignId) => request(`/backgrounds/${campaignId}`),

  // ===== SOUNDS =====
  getSounds: (campaignId) => request(`/sounds/${campaignId}`),
  createSound: (data) => request('/sounds', { method: 'POST', body: JSON.stringify(data) }),
  deleteSound: (id) => request(`/sounds/${id}`, { method: 'DELETE' }),
  uploadSound: (soundData, name, campaignId, isGlobal) => request('/upload/sound', { method: 'POST', body: JSON.stringify({ sound_data: soundData, name, campaign_id: campaignId, is_global: isGlobal }) }),

  // ===== NOTES =====
  getNotes: (campaignId) => request(`/notes/${campaignId}`),
  createNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // ===== HANDOUTS =====
  getHandouts: (campaignId) => request(`/handouts/${campaignId}`),
  createHandout: (data) => request('/handouts', { method: 'POST', body: JSON.stringify(data) }),
  updateHandout: (id, data) => request(`/handouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHandout: (id) => request(`/handouts/${id}`, { method: 'DELETE' }),

  // ===== SHOP =====
  getShop: () => request('/shop'),
  getShopPresets: () => request('/shop/presets'),
  createShopPreset: (data) => request('/shop/presets', { method: 'POST', body: JSON.stringify(data) }),
  updateShopPreset: (id, data) => request(`/shop/presets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShopPreset: (id) => request(`/shop/presets/${id}`, { method: 'DELETE' }),
  buyItem: (characterId, itemId, quantity) => request('/shop/buy', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity }) }),

  // ===== AMMO TYPES =====
  getAmmoTypes: () => request('/ammo-types'),
  createAmmoType: (name) => request('/ammo-types', { method: 'POST', body: JSON.stringify({ name }) }),
  updateAmmoType: (id, name) => request(`/ammo-types/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteAmmoType: (id) => request(`/ammo-types/${id}`, { method: 'DELETE' }),

  // ===== CURRENCIES =====
  getCurrencies: () => request('/currencies'),
  createCurrency: (data) => request('/currencies', { method: 'POST', body: JSON.stringify(data) }),
  deleteCurrency: (id) => request(`/currencies/${id}`, { method: 'DELETE' }),

  // ===== PLAYLISTS =====
  getPlaylists: () => request('/playlists'),
  createPlaylist: (name) => request('/playlists', { method: 'POST', body: JSON.stringify({ name }) }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),

  // ===== SUBCATEGORIES =====
  getSubcategories: () => request('/subcategories'),
  createSubcategory: (slot, name) => request('/subcategories', { method: 'POST', body: JSON.stringify({ slot, name }) }),
  deleteSubcategory: (id) => request(`/subcategories/${id}`, { method: 'DELETE' }),

  // ===== ADMIN =====
  getAdminItems: () => request('/admin/items'),
  createAdminItem: (data) => request('/admin/items', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminItem: (id, data) => request(`/admin/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminItem: (id) => request(`/admin/items/${id}`, { method: 'DELETE' }),
  getAdminPerks: () => request('/admin/perks'),
  updateAdminPerk: (id, data) => request(`/admin/perks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminProfessions: () => request('/admin/professions'),
  updateAdminProfession: (id, data) => request(`/admin/professions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminSkills: () => request('/admin/skills'),
  updateAdminSkill: (id, data) => request(`/admin/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminUsers: () => request('/admin/users'),
  updateAdminUser: (id, role) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminBackgrounds: () => request('/admin/backgrounds'),
  deleteAdminBackground: (id) => request(`/admin/backgrounds/${id}`, { method: 'DELETE' }),
  getAdminSounds: () => request('/admin/sounds'),
  deleteAdminSound: (id) => request(`/admin/sounds/${id}`, { method: 'DELETE' }),
  getAdminCampaigns: () => request('/admin/campaigns'),
  deleteAdminCampaign: (id) => request(`/admin/campaigns/${id}`, { method: 'DELETE' }),
};
