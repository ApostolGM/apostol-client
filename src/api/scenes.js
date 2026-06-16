// api/scenes.js
import { request } from './index.js';

export const scenes = {
  get: (campaignId, type) => request(`/scenes/${campaignId}?type=${type || 'local'}`),
  update: (campaignId, data) =>
    request(`/scenes/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
};
