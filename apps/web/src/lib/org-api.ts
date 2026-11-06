import type {
  InviteCreatedDto,
  InvitePreviewDto,
  InvitationDto,
  OrgOverviewDto,
  OrgSettingsDto,
  UpdateOrgSettingsRequest,
} from '@elevatesde/shared-types';
import { api } from './api';

export async function fetchOrgOverview(): Promise<OrgOverviewDto> {
  const response = await api.get<OrgOverviewDto>('/api/v1/org/overview');
  return response.data;
}

export async function updateOrgSettings(request: UpdateOrgSettingsRequest): Promise<OrgSettingsDto> {
  const response = await api.patch<OrgSettingsDto>('/api/v1/org/settings', request);
  return response.data;
}

export async function createInvitation(email: string): Promise<InviteCreatedDto> {
  const response = await api.post<InviteCreatedDto>('/api/v1/org/invitations', { email });
  return response.data;
}

export async function revokeInvitation(id: string): Promise<void> {
  await api.delete(`/api/v1/org/invitations/${id}`);
}

export async function previewInvite(token: string): Promise<InvitePreviewDto> {
  const response = await api.get<InvitePreviewDto>(`/api/v1/org/invitations/preview/${token}`);
  return response.data;
}

export async function acceptInvite(token: string): Promise<InvitationDto> {
  const response = await api.post<InvitationDto>(`/api/v1/org/invitations/accept/${token}`);
  return response.data;
}
