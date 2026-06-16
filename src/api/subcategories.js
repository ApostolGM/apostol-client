// api/subcategories.js
import { request } from './index.js';

export const subcategories = {
  getAll: () => request('/subcategories'),
  create: (slot, name) =>
    request('/subcategories', {
      method: 'POST',
      body: JSON.stringify({ slot, name })
    }),
  delete: (id) => request(`/subcategories/${id}`, { method: 'DELETE' }),
};
