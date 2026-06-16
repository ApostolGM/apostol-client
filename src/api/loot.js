// api/loot.js
import { request } from './index.js';

export const loot = {
  getPools: (campaignId) => request(`/campaigns/${campaignId}/loot`),
  createPool: (campaignId, name, items) =>
    request(`/campaigns/${campaignId}/loot`, {
      method: 'POST',
      body: JSON.stringify({ name, items })
    }),
  updatePool: (id, data) =>
    request(`/loot/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePool: (id) => request(`/loot/${id}`, { method: 'DELETE' }),
  giveLoot: (poolId, characterId) =>
    request(`/loot/${poolId}/give/${characterId}`, { method: 'POST' }),
};
