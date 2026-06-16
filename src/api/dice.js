// api/dice.js
import { request } from './index.js';

export const dice = {
  auto: (characterId, skillName) =>
    request('/dice/auto', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, skill_name: skillName })
    }),
};
