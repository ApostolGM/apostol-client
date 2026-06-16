// api/inventory.js
import { request } from './index.js';

export const inventory = {
  addItem: (characterId, itemId, quantity, slotType) =>
    request('/inventory/add', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType })
    }),
  removeItem: (slotId, quantity) =>
    request('/inventory/remove', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId, quantity })
    }),
  equipItem: (slotId) =>
    request('/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId })
    }),
  unequipItem: (slotId) =>
    request('/inventory/unequip', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId })
    }),
  useItem: (slotId) =>
    request('/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId })
    }),
  reloadWeapon: (slotId, ammoTypeId) =>
    request('/inventory/reload', {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId, ammo_type_id: ammoTypeId })
    }),
  updateSlot: (slotId, data) =>
    request(`/inventory/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  addMod: (slotId, modItemId) =>
    request(`/inventory/${slotId}/mod`, {
      method: 'POST',
      body: JSON.stringify({ mod_item_id: modItemId })
    }),
  removeMod: (slotId, modItemId) =>
    request(`/inventory/${slotId}/mod/${modItemId}`, { method: 'DELETE' }),
};
