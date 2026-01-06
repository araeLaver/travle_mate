import { apiClient } from './apiClient';
import {
  ChatRoomApiResponse,
  ChatParticipantApiResponse,
  ChatMessageApiResponse,
  PaginatedResponse,
} from '../types';

export interface ChatRoom {
  id: string;
  name: string;
  roomType: 'PRIVATE' | 'GROUP' | 'TRAVEL_GROUP';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  isActive: boolean;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  userName: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM';
  imageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  isDeleted: boolean;
  sentAt: Date;
  isRead: boolean;
}

export interface CreateChatRoomRequest {
  roomName: string;
  roomType: 'PRIVATE' | 'GROUP' | 'TRAVEL_GROUP';
  participantIds: string[];
  travelGroupId?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION';
  imageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
}

class ChatRestService {
  // 채팅방 목록 조회
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await apiClient.get<ChatRoomApiResponse[]>('/chat/rooms');
      return response.map((room) => this.mapToChatRoom(room));
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      throw error;
    }
  }

  // 특정 채팅방 조회
  async getChatRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const response = await apiClient.get<ChatRoomApiResponse>(`/chat/rooms/${roomId}`);
      return this.mapToChatRoom(response);
    } catch (error) {
      console.error('Failed to fetch chat room:', error);
      return null;
    }
  }

  // 채팅방 생성
  async createChatRoom(request: CreateChatRoomRequest): Promise<ChatRoom> {
    try {
      const response = await apiClient.post<ChatRoomApiResponse>('/chat/rooms', request);
      return this.mapToChatRoom(response);
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  }

  // 채팅 메시지 조회 (페이지네이션)
  async getMessages(roomId: string, page: number = 0, size: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<ChatMessageApiResponse>>(
        `/chat/rooms/${roomId}/messages?page=${page}&size=${size}`
      );

      // 페이지네이션 응답 처리
      const messages = response.content || [];
      return Array.isArray(messages) ? messages.map((msg) => this.mapToChatMessage(msg)) : [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  // 메시지 읽음 처리
  async markAsRead(roomId: string): Promise<void> {
    try {
      await apiClient.post(`/chat/rooms/${roomId}/read`, {});
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  // 메시지 삭제
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/chat/messages/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // 읽지 않은 메시지 수 조회
  async getUnreadCount(roomId: string): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>(
        `/chat/rooms/${roomId}/unread-count`
      );
      return response.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // 백엔드 응답을 ChatRoom으로 변환
  private mapToChatRoom(data: ChatRoomApiResponse): ChatRoom {
    return {
      id: data.id?.toString() || '',
      name: data.roomName || '',
      roomType: data.roomType || 'PRIVATE',
      participants: (data.participants || []).map((p: ChatParticipantApiResponse) => ({
        id: p.id?.toString() || '',
        userId: p.userId?.toString() || p.user?.id?.toString() || '',
        userName: p.user?.nickname || p.userName || '',
        profileImage: p.user?.profileImageUrl || p.profileImage,
        isOnline: p.isOnline || false,
        lastSeen: new Date(p.lastSeen || Date.now()),
      })),
      lastMessage: data.lastMessage ? this.mapToChatMessage(data.lastMessage) : undefined,
      unreadCount: data.unreadCount || 0,
      createdAt: new Date(data.createdAt),
      isActive: data.isActive !== false,
    };
  }

  // 백엔드 응답을 ChatMessage로 변환
  private mapToChatMessage(data: ChatMessageApiResponse): ChatMessage {
    return {
      id: data.id?.toString() || '',
      chatRoomId: data.chatRoomId?.toString() || '',
      senderId: data.senderId?.toString() || data.sender?.id?.toString() || '',
      senderName: data.sender?.nickname || data.senderName || '',
      content: data.content || '',
      messageType: data.messageType || 'TEXT',
      imageUrl: data.imageUrl,
      locationLatitude: data.locationLatitude,
      locationLongitude: data.locationLongitude,
      locationName: data.locationName,
      isDeleted: data.isDeleted || false,
      sentAt: new Date(data.sentAt || data.createdAt || Date.now()),
      isRead: data.isRead || false,
    };
  }
}

export const chatRestService = new ChatRestService();
