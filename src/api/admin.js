// api/admin.js
import { request } from './index.js';

export const admin = {
  // Items
  getItems: () => request('/admin/items'),
  createItem: (data) =>
    request('/admin/items', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateItem: (id, data) =>
    request(`/admin/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteItem: (id) => request(`/admin/items/${id}`, { method: 'DELETE' }),
  batchDeleteItems: (ids) =>
    request('/admin/items/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),
  batchPriceItems: (ids, trade_price) =>
    request('/admin/items/batch-price', {
      method: 'PUT',
      body: JSON.stringify({ ids, trade_price })
    }),

  // Perks
  getPerks: () => request('/admin/perks'),
  updatePerk: (id, data) =>
    request(`/admin/perks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Professions
  getProfessions: () => request('/admin/professions'),
  updateProfession: (id, data) =>
    request(`/admin/professions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Skills
  getSkills: () => request('/admin/skills'),
  updateSkill: (id, data) =>
    request(`/admin/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Users
  getUsers: () => request('/admin/users'),
  updateUser: (id, role) =>
    request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
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
