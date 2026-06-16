// api/ammo.js
import { request } from './index.js';

export const ammo = {
  getAll: () => request('/ammo-types'),
  create: (name) =>
    request('/ammo-types', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  update: (id, name) =>
    request(`/ammo-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    }),
  delete: (id) => request(`/ammo-types/${id}`, { method: 'DELETE' }),
};
