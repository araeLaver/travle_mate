import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService, CreateReviewDto, ReviewSummaryDto } from '../services/reviewService';

// -----------------------------------------------------------------------
// Query Keys
// -----------------------------------------------------------------------

export const reviewKeys = {
  all: ['reviews'] as const,
  userSummary: (userId: number) => [...reviewKeys.all, 'user', userId] as const,
};

// -----------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------

/**
 * 동행 후기 작성 mutation
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreateReviewDto>({
    mutationFn: (data: CreateReviewDto) => reviewService.create(data),
    onSuccess: (_data, variables) => {
      // 대상 유저의 리뷰 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userSummary(variables.targetUserId),
      });
    },
  });
}

/**
 * 특정 유저의 동행 평점 요약 조회
 */
export function useUserReviews(userId: number) {
  return useQuery<ReviewSummaryDto, Error>({
    queryKey: reviewKeys.userSummary(userId),
    queryFn: () => reviewService.getUserReviews(userId),
    enabled: userId > 0,
  });
}
