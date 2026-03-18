export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'location' | 'system';
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  type: 'direct' | 'group';
}

export interface ChatParticipant {
  id: string;
  name: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen: Date;
}

// TODO: This service uses in-memory storage with mock data. Migrate to HTTP API
// (e.g., REST endpoints /api/chat/rooms and /api/chat/messages) and replace
// simulated responses with real-time WebSocket/STOMP messages via websocketService.
class ChatService {
  private rooms: Map<string, ChatRoom> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, ((messages: ChatMessage[]) => void)[]> = new Map();
  private currentUserId: string;

  constructor() {
    // 임시 사용자 ID 생성
    this.currentUserId = localStorage.getItem('tempUserId') || this.generateUserId();
    localStorage.setItem('tempUserId', this.currentUserId);

    // 초기 데이터 로드
    this.initializeMockData();
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeMockData(): void {
    // Mock 채팅방 데이터
    const room1: ChatRoom = {
      id: 'room_1',
      name: '김탐험가',
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_1',
          name: '김탐험가',
          isOnline: true,
          lastSeen: new Date(),
        },
      ],
      unreadCount: 0,
      createdAt: new Date(Date.now() - 3600000),
      type: 'direct',
    };

    const room2: ChatRoom = {
      id: 'room_2',
      name: '서울 야경 투어',
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_2',
          name: '박여행러',
          isOnline: false,
          lastSeen: new Date(Date.now() - 1800000),
        },
        {
          id: 'mate_3',
          name: '이모험가',
          isOnline: true,
          lastSeen: new Date(),
        },
      ],
      unreadCount: 2,
      createdAt: new Date(Date.now() - 86400000),
      type: 'group',
    };

    const room3: ChatRoom = {
      id: 'room_3',
      name: '이서연',
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_4',
          name: '이서연',
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000),
        },
      ],
      unreadCount: 1,
      createdAt: new Date(Date.now() - 7200000),
      type: 'direct',
    };

    const room4: ChatRoom = {
      id: 'room_4',
      name: '제주도 힐링 여행',
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_5',
          name: '제주러버',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_6',
          name: '휴식이필요해',
          isOnline: false,
          lastSeen: new Date(Date.now() - 1800000),
        },
        {
          id: 'mate_7',
          name: '카페순례자',
          isOnline: true,
          lastSeen: new Date(),
        },
      ],
      unreadCount: 3,
      createdAt: new Date(Date.now() - 172800000),
      type: 'group',
    };

    const room5: ChatRoom = {
      id: 'room_5',
      name: '박민준',
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'mate_8',
          name: '박민준',
          isOnline: true,
          lastSeen: new Date(),
        },
      ],
      unreadCount: 0,
      createdAt: new Date(Date.now() - 43200000),
      type: 'direct',
    };

    this.rooms.set(room1.id, room1);
    this.rooms.set(room2.id, room2);
    this.rooms.set(room3.id, room3);
    this.rooms.set(room4.id, room4);
    this.rooms.set(room5.id, room5);

    // Mock 메시지 데이터
    const messages1: ChatMessage[] = [
      {
        id: 'msg_1',
        roomId: room1.id,
        senderId: 'mate_1',
        senderName: '김탐험가',
        content: '안녕하세요! 여행 메이트로 매칭되어서 연락드려요 😊',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
        isRead: true,
      },
      {
        id: 'msg_2',
        roomId: room1.id,
        senderId: this.currentUserId,
        senderName: '나',
        content: '안녕하세요! 반가워요. 어떤 여행 계획이 있으신가요?',
        timestamp: new Date(Date.now() - 3300000),
        type: 'text',
        isRead: true,
      },
      {
        id: 'msg_3',
        roomId: room1.id,
        senderId: 'mate_1',
        senderName: '김탐험가',
        content: '이번 주말에 경복궁 근처에서 한복 체험하고 카페 투어 하려고 해요! 같이 하실래요?',
        timestamp: new Date(Date.now() - 3000000),
        type: 'text',
        isRead: true,
      },
    ];

    const messages2: ChatMessage[] = [
      {
        id: 'msg_4',
        roomId: room2.id,
        senderId: 'mate_2',
        senderName: '박여행러',
        content: '오늘 밤 N서울타워 가실 분 있나요?',
        timestamp: new Date(Date.now() - 7200000),
        type: 'text',
        isRead: false,
      },
      {
        id: 'msg_5',
        roomId: room2.id,
        senderId: 'mate_3',
        senderName: '이모험가',
        content: '저 갈게요! 몇 시에 만날까요? 🌃',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
        isRead: false,
      },
    ];

    this.messages.set(room1.id, messages1);
    this.messages.set(room2.id, messages2);

    // 마지막 메시지 업데이트
    room1.lastMessage = messages1[messages1.length - 1];
    room2.lastMessage = messages2[messages2.length - 1];
  }

  // 채팅방 목록 가져오기
  getChatRooms(): ChatRoom[] {
    return Array.from(this.rooms.values()).sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || a.createdAt;
      const bTime = b.lastMessage?.timestamp || b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });
  }

  // 특정 채팅방의 메시지 가져오기
  getMessages(roomId: string): ChatMessage[] {
    return this.messages.get(roomId) || [];
  }

  // 메시지 전송
  sendMessage(
    roomId: string,
    content: string,
    type: 'text' | 'image' | 'location' = 'text'
  ): ChatMessage {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const message: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      roomId,
      senderId: this.currentUserId,
      senderName: '나',
      content,
      timestamp: new Date(),
      type,
      isRead: false,
    };

    // 메시지 저장
    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    // 채팅방 마지막 메시지 업데이트
    room.lastMessage = message;

    // 리스너들에게 알림
    this.notifyListeners(roomId, roomMessages);

    // 자동 응답 시뮬레이션 (실제 앱에서는 웹소켓으로 실시간 메시지 수신)
    if (type === 'text') {
      setTimeout(
        () => {
          this.simulateResponse(roomId);
        },
        1000 + Math.random() * 3000
      );
    }

    return message;
  }

  // 자동 응답 시뮬레이션
  private simulateResponse(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 나 이외의 참가자 중 랜덤 선택
    const otherParticipants = room.participants.filter(p => p.id !== this.currentUserId);
    if (otherParticipants.length === 0) return;

    const responder = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];

    const responses = [
      '좋은 아이디어네요! 😊',
      '저도 그렇게 생각해요',
      '언제 시간이 되세요?',
      '어디서 만날까요?',
      '사진 찍기 좋겠어요 📸',
      '맛있는 음식도 먹어야죠 🍜',
      '네, 좋아요!',
      '기대돼요 ✨',
      '날씨가 좋았으면 좋겠네요',
      '다른 분들 의견은 어떠세요?',
    ];

    const responseMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      roomId,
      senderId: responder.id,
      senderName: responder.name,
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'text',
      isRead: false,
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(responseMessage);
    this.messages.set(roomId, roomMessages);

    room.lastMessage = responseMessage;
    room.unreadCount++;

    this.notifyListeners(roomId, roomMessages);
  }

  // 새 채팅방 생성
  createChatRoom(participantName: string, participantId: string): ChatRoom {
    const room: ChatRoom = {
      id: 'room_' + Date.now(),
      name: participantName,
      participants: [
        {
          id: this.currentUserId,
          name: '나',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: participantId,
          name: participantName,
          isOnline: Math.random() > 0.3,
          lastSeen: new Date(Date.now() - Math.random() * 3600000),
        },
      ],
      unreadCount: 0,
      createdAt: new Date(),
      type: 'direct',
    };

    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);

    return room;
  }

  // 메시지 리스너 등록
  addMessageListener(roomId: string, callback: (messages: ChatMessage[]) => void): void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, []);
    }
    this.listeners.get(roomId)!.push(callback);
  }

  // 메시지 리스너 제거
  removeMessageListener(roomId: string, callback: (messages: ChatMessage[]) => void): void {
    const roomListeners = this.listeners.get(roomId);
    if (roomListeners) {
      const index = roomListeners.indexOf(callback);
      if (index > -1) {
        roomListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(roomId: string, messages: ChatMessage[]): void {
    const roomListeners = this.listeners.get(roomId);
    if (roomListeners) {
      roomListeners.forEach(callback => callback(messages));
    }
  }

  // 메시지 읽음 처리
  markMessagesAsRead(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messages = this.messages.get(roomId) || [];
    messages.forEach(msg => {
      if (msg.senderId !== this.currentUserId) {
        msg.isRead = true;
      }
    });

    room.unreadCount = 0;
    this.messages.set(roomId, messages);
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

export const chatService = new ChatService();
