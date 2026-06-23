import { apiClient } from '@/lib/api';
import type { Target, TargetCreate, TargetUpdate } from '@/types/target';

const BASE = '/api/v1';

export const targetService = {
  list: () =>
    apiClient.get<Target[]>(`${BASE}/targets`).then(r => r.data),

  create: (body: TargetCreate) =>
    apiClient.post<Target>(`${BASE}/targets`, body).then(r => r.data),

  update: (targetId: string, body: TargetUpdate) =>
    apiClient.put<Target>(`${BASE}/targets/${targetId}`, body).then(r => r.data),

  delete: (targetId: string) =>
    apiClient.delete(`${BASE}/targets/${targetId}`),
};