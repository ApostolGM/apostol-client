// api/base.js
import { request } from './index.js';

export const base = {
  getInventory: (campaignId) => request(`/campaigns/${campaignId}/base`),
  deposit: (campaignId, slotId, quantity) =>
    request(`/campaigns/${campaignId}/base/deposit`, {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId, quantity })
    }),
  withdraw: (campaignId, baseItemId, quantity) =>
    request(`/campaigns/${campaignId}/base/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ base_item_id: baseItemId, quantity })
    }),
  setAccess: (campaignId, baseAccess) =>
    request(`/campaigns/${campaignId}/base/access`, {
      method: 'PUT',
      body: JSON.stringify({ base_access: baseAccess })
    }),
};
