import type {
  AddStudyGroupMembersRequest,
  CreateStudyGroupRequest,
  StudyGroupActivityItemDto,
  StudyGroupDetailDto,
  StudyGroupGoalInput,
  StudyGroupLeaderboardDto,
  StudyGroupLeaderboardWindow,
  StudyGroupListDto,
  StudyGroupRole,
  StudyGroupRosterCandidateDto,
  UpdateStudyGroupRequest,
} from '@elevatesde/shared-types';
import { api } from './api';

const ENDPOINT = '/api/v1/study-groups';

export async function fetchStudyGroups(): Promise<StudyGroupListDto> {
  const response = await api.get<StudyGroupListDto>(ENDPOINT);
  return response.data;
}

export async function createStudyGroup(
  request: CreateStudyGroupRequest,
): Promise<StudyGroupDetailDto> {
  const response = await api.post<StudyGroupDetailDto>(ENDPOINT, request);
  return response.data;
}

export async function fetchStudyGroup(id: string): Promise<StudyGroupDetailDto> {
  const response = await api.get<StudyGroupDetailDto>(`${ENDPOINT}/${id}`);
  return response.data;
}

export async function updateStudyGroup(
  id: string,
  request: UpdateStudyGroupRequest,
): Promise<StudyGroupDetailDto> {
  const response = await api.patch<StudyGroupDetailDto>(`${ENDPOINT}/${id}`, request);
  return response.data;
}

export async function archiveStudyGroup(id: string): Promise<void> {
  await api.delete(`${ENDPOINT}/${id}`);
}

export async function joinStudyGroup(id: string): Promise<StudyGroupDetailDto> {
  const response = await api.post<StudyGroupDetailDto>(`${ENDPOINT}/${id}/join`);
  return response.data;
}

export async function leaveStudyGroup(id: string): Promise<void> {
  await api.post(`${ENDPOINT}/${id}/leave`);
}

export async function searchRosterCandidates(
  id: string,
  query: string,
): Promise<StudyGroupRosterCandidateDto[]> {
  const response = await api.get<StudyGroupRosterCandidateDto[]>(
    `${ENDPOINT}/${id}/roster-candidates`,
    { params: { q: query } },
  );
  return response.data;
}

export async function addStudyGroupMembers(
  id: string,
  request: AddStudyGroupMembersRequest,
): Promise<StudyGroupDetailDto> {
  const response = await api.post<StudyGroupDetailDto>(`${ENDPOINT}/${id}/members`, request);
  return response.data;
}

export async function updateStudyGroupMember(
  id: string,
  userId: string,
  role: StudyGroupRole,
): Promise<StudyGroupDetailDto> {
  const response = await api.patch<StudyGroupDetailDto>(
    `${ENDPOINT}/${id}/members/${userId}`,
    { role },
  );
  return response.data;
}

export async function removeStudyGroupMember(
  id: string,
  userId: string,
): Promise<StudyGroupDetailDto> {
  const response = await api.delete<StudyGroupDetailDto>(`${ENDPOINT}/${id}/members/${userId}`);
  return response.data;
}

export async function createStudyGroupGoal(
  id: string,
  input: StudyGroupGoalInput,
): Promise<StudyGroupDetailDto> {
  const response = await api.post<StudyGroupDetailDto>(`${ENDPOINT}/${id}/goals`, input);
  return response.data;
}

export async function updateStudyGroupGoal(
  id: string,
  goalId: string,
  input: StudyGroupGoalInput,
): Promise<StudyGroupDetailDto> {
  const response = await api.patch<StudyGroupDetailDto>(
    `${ENDPOINT}/${id}/goals/${goalId}`,
    input,
  );
  return response.data;
}

export async function deleteStudyGroupGoal(
  id: string,
  goalId: string,
): Promise<StudyGroupDetailDto> {
  const response = await api.delete<StudyGroupDetailDto>(`${ENDPOINT}/${id}/goals/${goalId}`);
  return response.data;
}

export async function fetchStudyGroupLeaderboard(
  id: string,
  window: StudyGroupLeaderboardWindow,
): Promise<StudyGroupLeaderboardDto> {
  const response = await api.get<StudyGroupLeaderboardDto>(`${ENDPOINT}/${id}/leaderboard`, {
    params: { window },
  });
  return response.data;
}

export async function fetchStudyGroupActivity(id: string): Promise<StudyGroupActivityItemDto[]> {
  const response = await api.get<StudyGroupActivityItemDto[]>(`${ENDPOINT}/${id}/activity`);
  return response.data;
}
