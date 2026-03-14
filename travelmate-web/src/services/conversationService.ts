import { apiClient } from './apiClient';

// ────────────────────────────────────────────────
// Types (mirrors backend ConversationDto)
// ────────────────────────────────────────────────

export interface ParticipantInfo {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

export interface LastMessageInfo {
  id: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: number;
  otherUser: ParticipantInfo;
  lastMessage?: LastMessageInfo;
  unreadCount: number;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ConversationResponse {
  id: number;
  participant1: ParticipantInfo;
  participant2: ParticipantInfo;
  createdAt: string;
  lastMessageAt?: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessagePageResponse {
  messages: MessageResponse[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements: number;
}

export interface StartConversationRequest {
  targetUserId: number;
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
}

// ────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────

class ConversationService {
  /**
   * POST /api/conversations
   * 대화 시작 (매칭된 pair만, 중복 방지 — 기존 대화면 그대로 반환)
   */
  async startConversation(targetUserId: number): Promise<ConversationResponse> {
    const body: StartConversationRequest = { targetUserId };
    return apiClient.post<ConversationResponse, StartConversationRequest>('/conversations', body);
  }

  /**
   * GET /api/conversations
   * 내 대화 목록 (lastMessage + 안읽은수 포함, 최신 메시지순)
   */
  async getMyConversations(): Promise<ConversationSummary[]> {
    return apiClient.get<ConversationSummary[]>('/conversations');
  }

  /**
   * GET /api/messages?conversationId=&page=&size=
   * 메시지 목록 (최신순 페이지네이션)
   */
  async getMessages(conversationId: number, page = 0, size = 10): Promise<MessagePageResponse> {
    return apiClient.get<MessagePageResponse>(
      `/messages?conversationId=${conversationId}&page=${page}&size=${size}`
    );
  }

  /**
   * POST /api/messages
   * 메시지 전송
   */
  async sendMessage(conversationId: number, content: string): Promise<MessageResponse> {
    const body: SendMessageRequest = { conversationId, content };
    return apiClient.post<MessageResponse, SendMessageRequest>('/messages', body);
  }

  /**
   * PUT /api/messages/{conversationId}/read
   * 읽음 처리
   */
  async markAsRead(conversationId: number): Promise<void> {
    await apiClient.put<void>(`/messages/${conversationId}/read`);
  }
}

export const conversationService = new ConversationService();
