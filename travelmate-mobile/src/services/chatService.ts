/**
 * Chat Service for TravelMate Mobile
 * Handles group chat and messaging functionality
 */

import { apiClient } from './apiClient';

// Types
export interface TravelGroup {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  createdAt: string;
  ownerId: number;
  ownerNickname: string;
  isMember: boolean;
  isOwner: boolean;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface GroupMember {
  id: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string | null;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM';
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  createdAt: string;
  isRead: boolean;
  isMine: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  isPublic: boolean;
  maxMembers: number;
}

export interface SendMessageRequest {
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION';
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

class ChatService {
  // ===== Group Management =====

  /**
   * Get list of groups user belongs to
   */
  async getMyGroups(): Promise<TravelGroup[]> {
    return apiClient.get<TravelGroup[]>('/groups/my');
  }

  /**
   * Get public groups with optional search
   */
  async getPublicGroups(search?: string, page: number = 0): Promise<PaginatedResponse<TravelGroup>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('size', '20');

    return apiClient.get<PaginatedResponse<TravelGroup>>(`/groups/public?${params.toString()}`);
  }

  /**
   * Get group details
   */
  async getGroup(groupId: number): Promise<TravelGroup> {
    return apiClient.get<TravelGroup>(`/groups/${groupId}`);
  }

  /**
   * Create new group
   */
  async createGroup(request: CreateGroupRequest): Promise<TravelGroup> {
    return apiClient.post<TravelGroup, CreateGroupRequest>('/groups', request);
  }

  /**
   * Join a group
   */
  async joinGroup(groupId: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/groups/${groupId}/join`);
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: number): Promise<void> {
    return apiClient.delete<void>(`/groups/${groupId}/leave`);
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
  }

  // ===== Chat Messages =====

  /**
   * Get messages for a group
   */
  async getMessages(groupId: number, page: number = 0, size: number = 50): Promise<PaginatedResponse<ChatMessage>> {
    return apiClient.get<PaginatedResponse<ChatMessage>>(
      `/groups/${groupId}/messages?page=${page}&size=${size}`
    );
  }

  /**
   * Send a message to a group
   */
  async sendMessage(groupId: number, request: SendMessageRequest): Promise<ChatMessage> {
    return apiClient.post<ChatMessage, SendMessageRequest>(`/groups/${groupId}/messages`, request);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(groupId: number): Promise<void> {
    return apiClient.post<void>(`/groups/${groupId}/messages/read`);
  }

  /**
   * Get unread count for all groups
   */
  async getUnreadCounts(): Promise<Record<number, number>> {
    return apiClient.get<Record<number, number>>('/groups/unread-counts');
  }

  // ===== Utility Functions =====

  /**
   * Format message time for display
   */
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format full date time
   */
  formatFullDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Group messages by date
   */
  groupMessagesByDate(messages: ChatMessage[]): Map<string, ChatMessage[]> {
    const grouped = new Map<string, ChatMessage[]>();

    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(message);
    });

    return grouped;
  }
}

export const chatService = new ChatService();
export default chatService;
