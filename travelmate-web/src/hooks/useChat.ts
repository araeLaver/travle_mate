import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatRestService, ChatRoom, CreateChatRoomRequest } from '../services/chatRestService';

// Query Keys
export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  room: (roomId: string) => [...chatKeys.all, 'room', roomId] as const,
  messages: (roomId: string) => [...chatKeys.all, 'messages', roomId] as const,
  unreadCount: (roomId: string) => [...chatKeys.all, 'unread', roomId] as const,
};

// Hooks
export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: () => chatRestService.getChatRooms(),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}

export function useChatRoom(roomId: string) {
  return useQuery({
    queryKey: chatKeys.room(roomId),
    queryFn: () => chatRestService.getChatRoom(roomId),
    enabled: !!roomId,
  });
}

export function useChatMessages(roomId: string, page = 0, size = 50) {
  return useQuery({
    queryKey: [...chatKeys.messages(roomId), page, size],
    queryFn: () => chatRestService.getMessages(roomId, page, size),
    enabled: !!roomId,
  });
}

export function useUnreadCount(roomId: string) {
  return useQuery({
    queryKey: chatKeys.unreadCount(roomId),
    queryFn: () => chatRestService.getUnreadCount(roomId),
    enabled: !!roomId,
    refetchInterval: 10000, // 10초마다 갱신
  });
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateChatRoomRequest) => chatRestService.createChatRoom(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => chatRestService.markAsRead(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount(roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatRestService.deleteMessage(messageId),
    onSuccess: () => {
      // 모든 메시지 캐시 무효화 (어느 방의 메시지인지 알 수 없으므로)
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
