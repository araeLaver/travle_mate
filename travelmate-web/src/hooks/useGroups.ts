import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService, TravelGroup, CreateGroupRequest } from '../services/groupService';

// Query Keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters?: any) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  myGroups: () => [...groupKeys.all, 'my'] as const,
  recommended: () => [...groupKeys.all, 'recommended'] as const,
};

// Hooks
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: () => groupService.getAllGroups(),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => groupService.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: () => groupService.getMyGroups(),
  });
}

export function useRecommendedGroups() {
  return useQuery({
    queryKey: groupKeys.recommended(),
    queryFn: () => groupService.getRecommendedGroups(),
    staleTime: 1000 * 60 * 10, // 10분 (추천은 자주 변경되지 않음)
  });
}

export function useSearchGroups(query: string, filters?: any) {
  return useQuery({
    queryKey: groupKeys.list({ query, ...filters }),
    queryFn: () => groupService.searchGroups(query, filters),
    enabled: query.trim().length > 0,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateGroupRequest) => groupService.createGroup(request),
    onSuccess: () => {
      // 그룹 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupService.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      // 특정 그룹 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupService.leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}
