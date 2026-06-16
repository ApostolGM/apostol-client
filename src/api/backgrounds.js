// api/backgrounds.js
import { request } from './index.js';

export const backgrounds = {
  getByCampaign: (campaignId) => request(`/backgrounds/${campaignId}`),
};
