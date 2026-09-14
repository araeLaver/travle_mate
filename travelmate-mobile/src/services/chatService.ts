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
  destination: string;
  startDate: string;
  endDate: string;
  purpose: 'LEISURE' | 'BUSINESS' | 'EDUCATION' | 'MEDICAL' | 'FAMILY' | 'OTHER';
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

interface BackendTravelGroup {
  id: number;
  title: string;
  description?: string;
  destination?: string;
  maxMembers?: number;
  currentMembers?: number;
  currentMemberCount?: number;
  groupImageUrl?: string;
  creator?: {
    id: number;
    nickname: string;
  };
  status?: string;
  createdAt: string;
  isJoinedByCurrentUser?: boolean;
}

interface BackendGroupMember {
  id: number;
  user?: {
    id: number;
    nickname: string;
    profileImageUrl?: string;
  };
  role?: 'CREATOR' | 'OWNER' | 'ADMIN' | 'MEMBER' | string;
  joinedAt: string;
  isCreator?: boolean;
}

interface BackendChatRoom {
  id: number;
  roomName: string;
  travelGroupId?: number;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

interface BackendChatMessage {
  id: number;
  chatRoomId: number;
  sender?: {
    id: number;
    nickname: string;
    profileImageUrl?: string;
  };
  content: string;
  messageType: ChatMessage['messageType'];
  imageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  sentAt: string;
  isDeleted?: boolean;
}

class ChatService {
  // ===== Group Management =====

  /**
   * Get list of groups user belongs to
   */
  async getMyGroups(): Promise<TravelGroup[]> {
    const groups = await apiClient.get<BackendTravelGroup[]>('/groups/my-groups');
    return groups.map(group => this.toTravelGroup(group, true));
  }

  /**
   * Get public groups with optional search
   */
  async getPublicGroups(search?: string, page: number = 0): Promise<PaginatedResponse<TravelGroup>> {
    const groups = await apiClient.get<BackendTravelGroup[]>('/groups');
    const normalizedSearch = search?.trim().toLowerCase();
    const filtered = normalizedSearch
      ? groups.filter(group =>
          [group.title, group.description, group.destination]
            .filter(Boolean)
            .some(value => value!.toLowerCase().includes(normalizedSearch))
        )
      : groups;

    return this.toPaginatedResponse(
      filtered.map(group => this.toTravelGroup(group, group.isJoinedByCurrentUser || false)),
      page,
      20,
      true
    );
  }

  /**
   * Get group details
   */
  async getGroup(groupId: number): Promise<TravelGroup> {
    const group = await apiClient.get<BackendTravelGroup>(`/groups/${groupId}`);
    return this.toTravelGroup(group, group.isJoinedByCurrentUser || false);
  }

  /**
   * Create new group
   */
  async createGroup(request: CreateGroupRequest): Promise<TravelGroup> {
    const group = await apiClient.post<BackendTravelGroup, Record<string, unknown>>('/groups', {
      title: request.name,
      description: request.description,
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      purpose: request.purpose,
      maxMembers: request.maxMembers,
    });
    try {
      await this.createTravelGroupChatRoom(group.id, request.name);
    } catch (error) {
      console.warn('Failed to create group chat room after group creation:', error);
    }
    return this.toTravelGroup(group, true);
  }

  /**
   * Join a group
   */
  async joinGroup(groupId: number): Promise<{ message: string }> {
    await apiClient.post<void>(`/groups/${groupId}/join`);
    return { message: '그룹에 참여했습니다.' };
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: number): Promise<void> {
    return apiClient.post<void>(`/groups/${groupId}/leave`);
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const members = await apiClient.get<BackendGroupMember[]>(`/groups/${groupId}/members`);
    return members.map(member => ({
      id: member.id,
      userId: member.user?.id || 0,
      nickname: member.user?.nickname || '알 수 없음',
      profileImageUrl: member.user?.profileImageUrl || null,
      role: this.toGroupMemberRole(member),
      joinedAt: member.joinedAt,
      isOnline: false,
    }));
  }

  // ===== Chat Messages =====

  /**
   * Get messages for a group
   */
  async getMessages(groupId: number, page: number = 0, size: number = 50): Promise<PaginatedResponse<ChatMessage>> {
    const roomId = await this.resolveChatRoomId(groupId);
    const messages = await apiClient.get<BackendChatMessage[]>(
      `/chat/rooms/${roomId}/messages?page=${page}&size=${size}`
    );
    return this.toPaginatedResponse(messages.map(message => this.toChatMessage(message)), page, size);
  }

  /**
   * Send a message to a group
   */
  async sendMessage(groupId: number, request: SendMessageRequest): Promise<ChatMessage> {
    const roomId = await this.resolveChatRoomId(groupId);
    const message = await apiClient.post<BackendChatMessage, Record<string, unknown>>(
      `/chat/rooms/${roomId}/messages`,
      {
        content: request.content,
        messageType: request.messageType,
        imageUrl: request.imageUrl,
        locationLatitude: request.latitude,
        locationLongitude: request.longitude,
        locationName: request.locationName,
      }
    );
    return this.toChatMessage(message);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(groupId: number): Promise<void> {
    const roomId = await this.resolveChatRoomId(groupId);
    return apiClient.post<void>(`/chat/rooms/${roomId}/read`);
  }

  /**
   * Get unread count for all groups
   */
  async getUnreadCounts(): Promise<Record<number, number>> {
    const rooms = await apiClient.get<BackendChatRoom[]>('/chat/rooms');
    return rooms.reduce<Record<number, number>>((acc, room) => {
      acc[room.travelGroupId || room.id] = room.unreadCount || 0;
      return acc;
    }, {});
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

  private toTravelGroup(group: BackendTravelGroup, isMember: boolean): TravelGroup {
    return {
      id: group.id,
      name: group.title,
      description: group.description || group.destination || '',
      imageUrl: group.groupImageUrl || null,
      memberCount: group.currentMembers || group.currentMemberCount || 0,
      maxMembers: group.maxMembers || 0,
      isPublic: true,
      createdAt: group.createdAt,
      ownerId: group.creator?.id || 0,
      ownerNickname: group.creator?.nickname || '',
      isMember,
      isOwner: false,
    };
  }

  private toChatMessage(message: BackendChatMessage): ChatMessage {
    return {
      id: message.id,
      groupId: message.chatRoomId,
      senderId: message.sender?.id || 0,
      senderNickname: message.sender?.nickname || '시스템',
      senderProfileImageUrl: message.sender?.profileImageUrl || null,
      content: message.content,
      messageType: message.messageType,
      imageUrl: message.imageUrl,
      latitude: message.locationLatitude,
      longitude: message.locationLongitude,
      locationName: message.locationName,
      createdAt: message.sentAt,
      isRead: false,
      isMine: false,
    };
  }

  private toPaginatedResponse<T>(
    items: T[],
    page: number,
    size: number,
    paginate: boolean = false
  ): PaginatedResponse<T> {
    const normalizedPage = Math.max(0, page);
    const normalizedSize = Math.max(1, size);
    const start = normalizedPage * normalizedSize;
    const content = paginate ? items.slice(start, start + normalizedSize) : items;

    return {
      content,
      totalElements: items.length,
      totalPages: items.length > 0 ? Math.ceil(items.length / normalizedSize) : 0,
      size: normalizedSize,
      number: normalizedPage,
      first: normalizedPage === 0,
      last: start + normalizedSize >= items.length,
    };
  }

  private toGroupMemberRole(member: BackendGroupMember): GroupMember['role'] {
    if (member.isCreator || member.role === 'CREATOR' || member.role === 'OWNER') {
      return 'OWNER';
    }
    if (member.role === 'ADMIN') {
      return 'ADMIN';
    }
    return 'MEMBER';
  }

  private async resolveChatRoomId(groupId: number): Promise<number> {
    const rooms = await apiClient.get<BackendChatRoom[]>('/chat/rooms');
    const existingRoom = rooms.find(room => room.travelGroupId === groupId);
    if (existingRoom) {
      return existingRoom.id;
    }

    const group = await this.getGroup(groupId);
    const room = await this.createTravelGroupChatRoom(group.id, group.name);
    return room.id;
  }

  private async createTravelGroupChatRoom(groupId: number, groupName: string): Promise<BackendChatRoom> {
    return apiClient.post<BackendChatRoom, Record<string, unknown>>('/chat/rooms', {
      roomName: groupName,
      roomType: 'TRAVEL_GROUP',
      travelGroupId: groupId,
    });
  }
}

export const chatService = new ChatService();
export default chatService;
