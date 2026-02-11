import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MatchRecommendation,
  MatchRequestResponse,
  MatchHistoryResponse,
  MatchPendingCount,
  PaginatedResponse,
} from '../types';
import {
  getMatchRecommendations,
  sendMatchRequest,
  respondToMatchRequest,
  cancelMatchRequest,
  getReceivedRequests,
  getSentRequests,
  getMatchHistory,
  getPendingMatchCount,
} from '../services/matchingService';

// Query Keys
export const matchingKeys = {
  all: ['matching'] as const,
  recommendations: (limit: number) => [...matchingKeys.all, 'recommendations', limit] as const,
  receivedRequests: (page: number) => [...matchingKeys.all, 'received', page] as const,
  sentRequests: (page: number) => [...matchingKeys.all, 'sent', page] as const,
  history: () => [...matchingKeys.all, 'history'] as const,
  pendingCount: () => [...matchingKeys.all, 'pendingCount'] as const,
};

export function useMatchRecommendations(limit = 10) {
  return useQuery<MatchRecommendation[]>({
    queryKey: matchingKeys.recommendations(limit),
    queryFn: () => getMatchRecommendations(limit),
  });
}

export function useSendMatchRequest() {
  const queryClient = useQueryClient();

  return useMutation<MatchRequestResponse, Error, { receiverId: number; message?: string }>({
    mutationFn: ({ receiverId, message }) => sendMatchRequest({ receiverId, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
}

export function useRespondToMatchRequest() {
  const queryClient = useQueryClient();

  return useMutation<MatchRequestResponse, Error, { requestId: number; accept: boolean }>({
    mutationFn: ({ requestId, accept }) => respondToMatchRequest(requestId, { accept }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
}

export function useCancelMatchRequest() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (requestId) => cancelMatchRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
}

export function useReceivedMatchRequests(page = 0) {
  return useQuery<PaginatedResponse<MatchRequestResponse>>({
    queryKey: matchingKeys.receivedRequests(page),
    queryFn: () => getReceivedRequests(page),
  });
}

export function useSentMatchRequests(page = 0) {
  return useQuery<PaginatedResponse<MatchRequestResponse>>({
    queryKey: matchingKeys.sentRequests(page),
    queryFn: () => getSentRequests(page),
  });
}

export function useMatchHistory() {
  return useQuery<MatchHistoryResponse[]>({
    queryKey: matchingKeys.history(),
    queryFn: getMatchHistory,
  });
}

export function usePendingMatchCount() {
  return useQuery<MatchPendingCount>({
    queryKey: matchingKeys.pendingCount(),
    queryFn: getPendingMatchCount,
    refetchInterval: 30000, // 30초마다 갱신
  });
}
