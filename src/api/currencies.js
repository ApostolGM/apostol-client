// api/currencies.js
import { request } from './index.js';

export const currencies = {
  getAll: () => request('/currencies'),
  create: (data) =>
    request('/currencies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  delete: (id) => request(`/currencies/${id}`, { method: 'DELETE' }),
};
