import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTravelReview,
  getReviewsForUser,
  getReviewsForMatch,
  CreateTravelReviewRequest,
  TravelReviewResponse,
} from '../services/travelReviewService';

// ===== Query Keys =====

export const travelReviewKeys = {
  all: ['travelReviews'] as const,
  forUser: (userId: number) => [...travelReviewKeys.all, 'user', userId] as const,
  forMatch: (matchId: number) => [...travelReviewKeys.all, 'match', matchId] as const,
};

// ===== Queries =====

export function useReviewsForUser(userId: number) {
  return useQuery<TravelReviewResponse[]>({
    queryKey: travelReviewKeys.forUser(userId),
    queryFn: () => getReviewsForUser(userId),
    enabled: !!userId,
  });
}

export function useReviewsForMatch(matchId: number) {
  return useQuery<TravelReviewResponse[]>({
    queryKey: travelReviewKeys.forMatch(matchId),
    queryFn: () => getReviewsForMatch(matchId),
    enabled: !!matchId,
  });
}

// ===== Mutations =====

export function useCreateTravelReview() {
  const queryClient = useQueryClient();

  return useMutation<TravelReviewResponse, Error, CreateTravelReviewRequest>({
    mutationFn: createTravelReview,
    onSuccess: (data, variables) => {
      // 리뷰이 목록 및 해당 매칭 리뷰 목록 갱신
      queryClient.invalidateQueries({
        queryKey: travelReviewKeys.forUser(variables.revieweeId),
      });
      queryClient.invalidateQueries({
        queryKey: travelReviewKeys.forMatch(variables.matchRequestId),
      });
    },
  });
}
