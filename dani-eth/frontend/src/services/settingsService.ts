import { apiClient } from '@/lib/api';

const BASE = '/api/v1';

export interface UserSettings {
  language: 'en' | 'es' | 'fr';
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
}

export const settingsService = {
  // Lee las preferencias del usuario logueado
  get: () =>
    apiClient
      .get<UserSettings>(`${BASE}/settings`)
      .then(r => r.data),

  // Actualiza solo los campos que se manden (los demás no cambian)
  update: (settings: Partial<UserSettings>) =>
    apiClient
      .put<UserSettings>(`${BASE}/settings`, settings)
      .then(r => r.data),
};