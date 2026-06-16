// api/upload.js
import { request } from './index.js';

export const upload = {
  file: (image, name, campaignId) =>
    request('/upload/file', {
      method: 'POST',
      body: JSON.stringify({ image, name, campaign_id: campaignId })
    }),
  sound: (soundData, name, campaignId, isGlobal) =>
    request('/upload/sound', {
      method: 'POST',
      body: JSON.stringify({ sound_data: soundData, name, campaign_id: campaignId, is_global: isGlobal })
    }),
  background: (campaignId, name, url, isGlobal) =>
    request('/upload/background', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId, name, url, is_global: isGlobal })
    }),
};
