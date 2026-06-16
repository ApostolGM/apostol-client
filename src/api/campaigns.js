// api/campaigns.js
import { request } from './index.js';

export const campaigns = {
  getAll: () => request('/campaigns'),
  get: (id) => request(`/campaigns/${id}`),
  create: (title) =>
    request('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ title })
    }),
  join: (code) => request(`/campaigns/join/${code}`, { method: 'POST' }),
  updateTime: (campaignId, data) =>
    request(`/campaigns/${campaignId}/time`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteMember: (campaignId, userId) =>
    request(`/campaigns/${campaignId}/members/${userId}`, { method: 'DELETE' }),
};
