// api/playlists.js
import { request } from './index.js';

export const playlists = {
  getAll: () => request('/playlists'),
  create: (name) =>
    request('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  delete: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
};
