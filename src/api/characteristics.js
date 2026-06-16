// api/characteristics.js
import { request } from './index.js';

export const characteristics = {
  getAll: () => request('/characteristics'),
  create: (data) =>
    request('/characteristics', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/characteristics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/characteristics/${id}`, { method: 'DELETE' }),
};
