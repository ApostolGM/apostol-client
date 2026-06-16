// api/sounds.js
import { request } from './index.js';

export const sounds = {
  getAll: (campaignId) => request(`/sounds/${campaignId}`),
  create: (data) =>
    request('/sounds', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/sounds/${id}`, { method: 'DELETE' }),
};
