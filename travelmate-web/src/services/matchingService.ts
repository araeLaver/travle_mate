import { apiClient } from './apiClient';
import {
  MatchRecommendation,
  MatchRequestResponse,
  MatchHistoryResponse,
  SendMatchRequest,
  RespondMatchRequest,
  MatchPendingCount,
  PaginatedResponse,
} from '../types';

// ===== 추천 =====

export const getMatchRecommendations = async (limit = 10): Promise<MatchRecommendation[]> => {
  return apiClient.get<MatchRecommendation[]>(`/matching/recommendations?limit=${limit}`);
};

// ===== 매칭 요청 =====

export const sendMatchRequest = async (data: SendMatchRequest): Promise<MatchRequestResponse> => {
  return apiClient.post<MatchRequestResponse, SendMatchRequest>('/matching/requests', data);
};

export const respondToMatchRequest = async (
  requestId: number,
  data: RespondMatchRequest
): Promise<MatchRequestResponse> => {
  return apiClient.put<MatchRequestResponse, RespondMatchRequest>(
    `/matching/requests/${requestId}/respond`,
    data
  );
};

export const cancelMatchRequest = async (requestId: number): Promise<void> => {
  await apiClient.delete(`/matching/requests/${requestId}`);
};

// ===== 요청 목록 =====

export const getReceivedRequests = async (
  page = 0,
  size = 10
): Promise<PaginatedResponse<MatchRequestResponse>> => {
  return apiClient.get<PaginatedResponse<MatchRequestResponse>>(
    `/matching/requests/received?page=${page}&size=${size}`
  );
};

export const getSentRequests = async (
  page = 0,
  size = 10
): Promise<PaginatedResponse<MatchRequestResponse>> => {
  return apiClient.get<PaginatedResponse<MatchRequestResponse>>(
    `/matching/requests/sent?page=${page}&size=${size}`
  );
};

// ===== 히스토리 & 카운트 =====

export const getMatchHistory = async (): Promise<MatchHistoryResponse[]> => {
  return apiClient.get<MatchHistoryResponse[]>('/matching/history');
};

export const getPendingMatchCount = async (): Promise<MatchPendingCount> => {
  return apiClient.get<MatchPendingCount>('/matching/requests/pending/count');
};
