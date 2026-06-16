// api/shop.js
import { request } from './index.js';

export const shop = {
  getAll: () => request('/shop'),
  getPresets: () => request('/shop/presets'),
  createPreset: (data) =>
    request('/shop/presets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePreset: (id, data) =>
    request(`/shop/presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePreset: (id) => request(`/shop/presets/${id}`, { method: 'DELETE' }),
  buy: (characterId, itemId, quantity) =>
    request('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity })
    }),
};
