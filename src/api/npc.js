// api/npc.js
import { request } from './index.js';

export const npc = {
  getAll: (campaignId) => request(`/npcs?campaign_id=${campaignId}`),
  getTemplates: () => request('/npcs?is_template=true'),
  create: (data) =>
    request('/npcs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/npcs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/npcs/${id}`, { method: 'DELETE' }),
  clone: (id, name) =>
    request(`/npcs/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  roll: (id, skillName) =>
    request(`/npcs/${id}/roll`, {
      method: 'POST',
      body: JSON.stringify({ skill_name: skillName })
    }),
};
