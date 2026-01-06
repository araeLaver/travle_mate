import { Client, IMessage, StompSubscription, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authService } from './authService';
import { WebSocketError, WebSocketErrorCallback } from '../types';

export interface ChatMessage {
  id?: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM';
  imageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  sentAt?: Date;
}

type MessageCallback = (message: ChatMessage) => void;
type ConnectCallback = () => void;
type DisconnectCallback = () => void;
type ErrorCallback = WebSocketErrorCallback;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  // Callbacks
  private onConnectCallbacks: ConnectCallback[] = [];
  private onDisconnectCallbacks: DisconnectCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    // STOMP over SockJS 설정
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8081/ws';
    this.client = new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl) as WebSocket;
      },
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket Debug]', str);
        }
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: this.getConnectHeaders(),
      onConnect: () => {
        console.log('WebSocket Connected');
        this.reconnectAttempts = 0;
        this.onConnectCallbacks.forEach((cb) => cb());
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        this.onDisconnectCallbacks.forEach((cb) => cb());
      },
      onStompError: (frame: IFrame) => {
        console.error('STOMP Error:', frame);
        const error: WebSocketError = {
          message: frame.headers?.message || 'STOMP Error',
          code: frame.command,
          timestamp: new Date(),
        };
        this.onErrorCallbacks.forEach((cb) => cb(error));
      },
      onWebSocketError: (event: Event) => {
        console.error('WebSocket Error:', event);
        const error: WebSocketError = {
          message: 'WebSocket connection error',
          timestamp: new Date(),
        };
        this.onErrorCallbacks.forEach((cb) => cb(error));
      },
    });
  }

  private getConnectHeaders(): { [key: string]: string } {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // WebSocket 연결
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        this.initializeClient();
      }

      if (this.client!.active) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // 이미 연결 중이면 연결 완료를 기다림
        const waitForConnection = () => {
          if (this.client?.active) {
            resolve();
          } else {
            setTimeout(waitForConnection, 100);
          }
        };
        waitForConnection();
        return;
      }

      this.isConnecting = true;

      const onConnectHandler = () => {
        this.isConnecting = false;
        resolve();
      };

      const onErrorHandler = (error: WebSocketError) => {
        this.isConnecting = false;
        reject(error);
      };

      this.onConnect(onConnectHandler);
      this.onError(onErrorHandler);

      try {
        this.client!.activate();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // WebSocket 연결 해제
  disconnect(): void {
    if (this.client?.active) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
    }
  }

  // 채팅방 구독
  subscribeToRoom(roomId: string, onMessage: MessageCallback): () => void {
    const destination = `/topic/chat/${roomId}`;

    // 이미 구독 중이면 새로 구독하지 않음
    if (this.subscriptions.has(destination)) {
      console.warn(`Already subscribed to ${destination}`);
      return () => this.unsubscribeFromRoom(roomId);
    }

    const subscription = this.client!.subscribe(
      destination,
      (message: IMessage) => {
        try {
          const parsedMessage: ChatMessage = JSON.parse(message.body);
          if (parsedMessage.sentAt) {
            parsedMessage.sentAt = new Date(parsedMessage.sentAt);
          }
          onMessage(parsedMessage);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }
    );

    this.subscriptions.set(destination, subscription);

    // Unsubscribe 함수 반환
    return () => this.unsubscribeFromRoom(roomId);
  }

  // 채팅방 구독 취소
  unsubscribeFromRoom(roomId: string): void {
    const destination = `/topic/chat/${roomId}`;
    const subscription = this.subscriptions.get(destination);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      console.log(`Unsubscribed from ${destination}`);
    }
  }

  // 메시지 전송
  sendMessage(message: ChatMessage): void {
    if (!this.client?.active) {
      throw new Error('WebSocket is not connected');
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });
  }

  // 채팅방 입장
  joinRoom(roomId: string, userId: string): void {
    if (!this.client?.active) {
      throw new Error('WebSocket is not connected');
    }

    this.client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({ roomId, userId }),
    });
  }

  // 채팅방 퇴장
  leaveRoom(roomId: string, userId: string): void {
    if (!this.client?.active) {
      throw new Error('WebSocket is not connected');
    }

    this.client.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({ roomId, userId }),
    });
  }

  // 타이핑 상태 전송
  sendTypingStatus(roomId: string, userId: string, isTyping: boolean): void {
    if (!this.client?.active) return;

    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, userId, isTyping }),
    });
  }

  // 이벤트 리스너 등록
  onConnect(callback: ConnectCallback): void {
    this.onConnectCallbacks.push(callback);
  }

  onDisconnect(callback: DisconnectCallback): void {
    this.onDisconnectCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallbacks.push(callback);
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.client?.active || false;
  }

  // 일반 구독 (외부에서 client 직접 접근 대신 사용)
  subscribe(destination: string, callback: (message: IMessage) => void): StompSubscription | undefined {
    if (!this.client?.active) {
      console.warn('WebSocket is not connected');
      return undefined;
    }

    return this.client.subscribe(destination, callback);
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
