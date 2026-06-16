// api/notes.js
import { request } from './index.js';

export const notes = {
  getAll: (campaignId) => request(`/notes/${campaignId}`),
  create: (data) =>
    request('/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
};
