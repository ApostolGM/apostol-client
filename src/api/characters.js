// api/characters.js
import { request } from './index.js';

export const characters = {
  create: (data) => request('/characters', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/characters/${id}`),
  updateParams: (id, params) =>
    request(`/characters/${id}/params`, { method: 'PUT', body: JSON.stringify(params) }),
  delete: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  getWeight: (id) => request(`/characters/${id}/weight`),
  addSkill: (charId, skillId, modifier) =>
    request(`/characters/${charId}/skills`, { method: 'POST', body: JSON.stringify({ skill_id: skillId, modifier }) }),
  updateSkill: (charId, skillId, modifier) =>
    request(`/characters/${charId}/skills/${skillId}`, { method: 'PUT', body: JSON.stringify({ modifier }) }),
  deleteSkill: (charId, skillId) =>
    request(`/characters/${charId}/skills/${skillId}`, { method: 'DELETE' }),
  getCampaignCharacters: (campaignId) => request(`/campaigns/${campaignId}/characters`),
  getStatuses: () => request('/character-statuses/global'),
};
