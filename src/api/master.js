// api/master.js
import { request } from './index.js';

export const master = {
  addItem: (characterId, itemId, quantity, slotType) =>
    request('/master/inventory/add', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType })
    }),
};
