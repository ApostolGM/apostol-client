// api/chat.js
import { request } from './index.js';

export const chat = {
  getMessages: (campaignId) => request(`/chat/${campaignId}`),
  sendMessage: (campaignId, text, isRoll) =>
    request(`/chat/${campaignId}`, {
      method: 'POST',
      body: JSON.stringify({ text, is_roll: isRoll || false })
    }),
};
