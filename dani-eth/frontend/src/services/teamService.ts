// src/services/teamService.ts
import { apiClient } from '@/lib/api';
import type {
  Team, TeamCreate, TeamUpdate,
  TeamMember, TeamMemberCreate, TeamMemberUpdate,
  Asset, AssetCreate, AssetUpdate,
  TeamStats,
} from '@/types/team';

const BASE = '/api/v1';

export const teamService = {
  getStats: () =>
    apiClient.get<TeamStats>(`${BASE}/teams/stats/summary`).then(r => r.data),

  listTeams: () =>
    apiClient.get<Team[]>(`${BASE}/teams`).then(r => r.data),

  getTeam: (teamId: string) =>
    apiClient.get<Team>(`${BASE}/teams/${teamId}`).then(r => r.data),

  createTeam: (body: TeamCreate) =>
    apiClient.post<Team>(`${BASE}/teams`, body).then(r => r.data),

  updateTeam: (teamId: string, body: TeamUpdate) =>
    apiClient.patch<Team>(`${BASE}/teams/${teamId}`, body).then(r => r.data),

  deleteTeam: (teamId: string) =>
    apiClient.delete(`${BASE}/teams/${teamId}`),

  listMembers: (teamId: string) =>
    apiClient.get<TeamMember[]>(`${BASE}/teams/${teamId}/members`).then(r => r.data),

  getMember: (memberId: string) =>
    apiClient.get<TeamMember>(`${BASE}/teams/members/${memberId}`).then(r => r.data),

  createMember: (teamId: string, body: TeamMemberCreate) =>
    apiClient.post<TeamMember>(`${BASE}/teams/${teamId}/members`, body).then(r => r.data),

  updateMember: (memberId: string, body: TeamMemberUpdate) =>
    apiClient.patch<TeamMember>(`${BASE}/teams/members/${memberId}`, body).then(r => r.data),

  deleteMember: (memberId: string) =>
    apiClient.delete(`${BASE}/teams/members/${memberId}`),
};

export interface AssetFilters {
  status?: string;
  asset_type?: string;
  environment?: string;
  team_id?: string;
}

export const assetService = {
  listAssets: (filters?: AssetFilters) =>
    apiClient.get<Asset[]>(`${BASE}/assets`, { params: filters }).then(r => r.data),

  getAsset: (assetId: string) =>
    apiClient.get<Asset>(`${BASE}/assets/${assetId}`).then(r => r.data),

  createAsset: (body: AssetCreate) =>
    apiClient.post<Asset>(`${BASE}/assets`, body).then(r => r.data),

  updateAsset: (assetId: string, body: AssetUpdate) =>
    apiClient.patch<Asset>(`${BASE}/assets/${assetId}`, body).then(r => r.data),

  deleteAsset: (assetId: string) =>
    apiClient.delete(`${BASE}/assets/${assetId}`),
};