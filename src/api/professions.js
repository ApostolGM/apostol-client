// api/professions.js
import { request } from './index.js';

export const professions = {
  getAll: () => request('/professions'),
  getPerks: () => request('/perks'),
  getSkills: () => request('/skills'),
};
