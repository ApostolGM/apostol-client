// api/inventory.js
import { request } from './index.js';

export const inventory = {
  addItem: (characterId, itemId, quantity, slotType) =>
    request('/inventory/add', { method: 'POST', body: JSON.stringify({ character_id: characterId, item_id: itemId, quantity, slot_type: slotType }) }),
  removeItem: (slotId, quantity) =>
    request('/inventory/remove', { method: 'POST', body: JSON.stringify({ slot_id: slotId, quantity }) }),
  equipItem: (slotId, cellId) =>
    request('/inventory/equip', { method: 'POST', body: JSON.stringify({ slot_id: slotId, cell_id: cellId }) }),
  unequipItem: (slotId) =>
    request('/inventory/unequip', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
  useItem: (slotId, shotsCount) =>
    request('/inventory/use', { method: 'POST', body: JSON.stringify({ slot_id: slotId, shots_count: shotsCount }) }),
  reloadWeapon: (slotId, ammoTypeId) =>
    request('/inventory/reload', { method: 'POST', body: JSON.stringify({ slot_id: slotId, ammo_type_id: ammoTypeId }) }),
  updateSlot: (slotId, data) =>
    request(`/inventory/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  addMod: (slotId, modItemId) =>
    request(`/inventory/${slotId}/mod`, { method: 'POST', body: JSON.stringify({ mod_item_id: modItemId }) }),
  removeMod: (slotId, modItemId) =>
    request(`/inventory/${slotId}/mod/${modItemId}`, { method: 'DELETE' }),
  takeFromContainer: (slotId, childSlotId, quantity) =>
    request('/inventory/container/take', { method: 'POST', body: JSON.stringify({ slot_id: slotId, child_slot_id: childSlotId, quantity }) }),
  useFromContainer: (slotId, childSlotId) =>
    request('/inventory/container/use', { method: 'POST', body: JSON.stringify({ slot_id: slotId, child_slot_id: childSlotId }) }),
};
