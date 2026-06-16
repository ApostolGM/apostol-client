// api/items.js
import { request } from './index.js';

export const items = {
  getAll: () => request('/items'),
  create: (data) =>
    request('/items', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
};
