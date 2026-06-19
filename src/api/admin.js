// api/admin.js
import { request } from './index.js';

export const admin = {
  // Items
  getItems: () => request('/admin/items'),
  createItem: (data) => request('/admin/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id, data) => request(`/admin/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateItemSlot: (id, data) => request(`/admin/item-slots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id) => request(`/admin/items/${id}`, { method: 'DELETE' }),
  batchDeleteItems: (ids) => request('/admin/items/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchPriceItems: (ids, trade_price) =>
    request('/admin/items/batch-price', { method: 'PUT', body: JSON.stringify({ ids, trade_price }) }),
  // Icons
getIcons: () => request('/admin/icons'),
createIcon: (data) => request('/admin/icons', { method: 'POST', body: JSON.stringify(data) }),
deleteIcon: (id) => request(`/admin/icons/${id}`, { method: 'DELETE' }),

  // Perks
  getPerks: () => request('/admin/perks'),
  updatePerk: (id, data) => request(`/admin/perks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Professions
  getProfessions: () => request('/admin/professions'),
  updateProfession: (id, data) => request(`/admin/professions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Skills
  getSkills: () => request('/admin/skills'),
  updateSkill: (id, data) => request(`/admin/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Skill Links
  getSkillLinks: () => request('/admin/skill-links'),
  createSkillLink: (data) => request('/admin/skill-links', { method: 'POST', body: JSON.stringify(data) }),
  deleteSkillLink: (id) => request(`/admin/skill-links/${id}`, { method: 'DELETE' }),

  // Item Slots
  getItemSlots: () => request('/admin/item-slots'),
  createItemSlot: (name, description) => request('/admin/item-slots', { method: 'POST', body: JSON.stringify({ name, description }) }),
  deleteItemSlot: (id) => request(`/admin/item-slots/${id}`, { method: 'DELETE' }),

  // Inventory Cells
  getInventoryCells: () => request('/admin/inventory-cells'),
  createInventoryCell: (data) => request('/admin/inventory-cells', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryCell: (id, data) => request(`/admin/inventory-cells/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryCell: (id) => request(`/admin/inventory-cells/${id}`, { method: 'DELETE' }),

  // Character Statuses
  getCharacterStatuses: () => request('/admin/character-statuses'),
  createCharacterStatus: (data) => request('/admin/character-statuses', { method: 'POST', body: JSON.stringify(data) }),
  deleteCharacterStatus: (id) => request(`/admin/character-statuses/${id}`, { method: 'DELETE' }),

  // Craft
  getCraftStations: () => request('/admin/craft-stations'),
  createCraftStation: (data) => request('/admin/craft-stations', { method: 'POST', body: JSON.stringify(data) }),
  deleteCraftStation: (id) => request(`/admin/craft-stations/${id}`, { method: 'DELETE' }),

  getCraftRecipes: () => request('/admin/craft-recipes'),
  createCraftRecipe: (data) => request('/admin/craft-recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateCraftRecipe: (id, data) => request(`/admin/craft-recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCraftRecipe: (id) => request(`/admin/craft-recipes/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request('/admin/users'),
  updateUser: (id, role) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Backgrounds
  getBackgrounds: () => request('/admin/backgrounds'),
  deleteBackground: (id) => request(`/admin/backgrounds/${id}`, { method: 'DELETE' }),

  // Sounds
  getSounds: () => request('/admin/sounds'),
  deleteSound: (id) => request(`/admin/sounds/${id}`, { method: 'DELETE' }),

  // Campaigns
  getCampaigns: () => request('/admin/campaigns'),
  deleteCampaign: (id) => request(`/admin/campaigns/${id}`, { method: 'DELETE' }),
};
