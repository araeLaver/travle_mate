import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, UserProfile, UpdateProfileRequest } from '../services/profileService';

// Query Keys
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId?: string) => [...profileKeys.all, userId || 'me'] as const,
};

// Hooks
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileService.getProfile(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateProfileRequest) => profileService.updateProfile(updates),
    onSuccess: (updatedProfile) => {
      // 내 프로필 캐시 업데이트
      queryClient.setQueryData(profileKeys.detail(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.updateProfileImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

export function useUpdateCoverImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.updateCoverImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}
