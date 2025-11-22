import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, ChatMessage } from '../services/websocketService';
import { useAuthStore } from '../store/authStore';

export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const connect = async () => {
      setIsConnecting(true);
      setError(null);

      try {
        await websocketService.connect();
        setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setIsConnected(false);
      } finally {
        setIsConnecting(false);
      }
    };

    websocketService.onConnect(() => setIsConnected(true));
    websocketService.onDisconnect(() => setIsConnected(false));
    websocketService.onError((err) => {
      setError(err.message || 'WebSocket error');
    });

    connect();

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  return { isConnected, isConnecting, error };
}

export function useChatRoom(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { isConnected } = useWebSocketConnection();
  const { user } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isConnected || !roomId || !user) {
      return;
    }

    // 채팅방 구독
    const unsubscribe = websocketService.subscribeToRoom(roomId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    unsubscribeRef.current = unsubscribe;
    setIsSubscribed(true);

    // 채팅방 입장 알림
    websocketService.joinRoom(roomId, user.id.toString());

    return () => {
      // 채팅방 퇴장 알림
      if (user) {
        websocketService.leaveRoom(roomId, user.id.toString());
      }
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [isConnected, roomId, user]);

  const sendMessage = useCallback(
    (content: string, messageType: 'TEXT' | 'IMAGE' | 'LOCATION' = 'TEXT') => {
      if (!user || !roomId) return;

      const message: ChatMessage = {
        chatRoomId: roomId,
        senderId: user.id.toString(),
        senderName: user.nickname,
        content,
        messageType,
      };

      websocketService.sendMessage(message);
    },
    [user, roomId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!user || !roomId) return;
      websocketService.sendTypingStatus(roomId, user.id.toString(), isTyping);
    },
    [user, roomId]
  );

  return {
    messages,
    isSubscribed,
    sendMessage,
    sendTyping,
  };
}
