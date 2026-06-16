// api/handouts.js
import { request } from './index.js';

export const handouts = {
  getAll: (campaignId) => request(`/handouts/${campaignId}`),
  create: (data) =>
    request('/handouts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/handouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/handouts/${id}`, { method: 'DELETE' }),
};
