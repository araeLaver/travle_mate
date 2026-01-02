import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService, ChatMessage, ChatRoom } from '../services/chatService';
import { useToast } from '../components/Toast';
import './Chat.css';

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      navigate('/dashboard');
      return;
    }

    const rooms = chatService.getChatRooms();
    const currentRoom = rooms.find(r => r.id === roomId);

    if (!currentRoom) {
      toast.error('채팅방을 찾을 수 없습니다.');
      navigate('/dashboard');
      return;
    }

    setRoom(currentRoom);

    const roomMessages = chatService.getMessages(roomId);
    setMessages(roomMessages);

    chatService.markMessagesAsRead(roomId);

    const messageListener = (updatedMessages: ChatMessage[]) => {
      setMessages(updatedMessages);
      chatService.markMessagesAsRead(roomId);
    };

    chatService.addMessageListener(roomId, messageListener);

    setIsLoading(false);

    return () => {
      chatService.removeMessageListener(roomId, messageListener);
    };
  }, [roomId, navigate, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;

    chatService.sendMessage(roomId, newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return '오늘';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return '어제';
    }

    return messageDate.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="chat-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true">
          💬
        </div>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="chat-error">
        <h3>채팅방을 찾을 수 없습니다</h3>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  const otherParticipants = room.participants.filter(p => p.id !== chatService.getCurrentUserId());

  return (
    <div className="chat-container" role="main" aria-label={`${room.name} 채팅방`}>
      {/* 채팅 헤더 */}
      <header className="chat-header">
        <button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="대시보드로 돌아가기"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="chat-info">
          <h1 className="chat-title">
            {room.type === 'direct' ? (
              <>
                <span className="chat-name">{room.name}</span>
                {otherParticipants[0] && (
                  <span
                    className={`online-indicator ${otherParticipants[0].isOnline ? 'online' : 'offline'}`}
                    aria-label={otherParticipants[0].isOnline ? '온라인 상태' : '오프라인 상태'}
                  >
                    {otherParticipants[0].isOnline ? '🟢 온라인' : '⚪ 오프라인'}
                  </span>
                )}
              </>
            ) : (
              <span className="chat-name">{room.name}</span>
            )}
          </h1>
          <div className="participant-count" aria-label={`참여자 ${room.participants.length}명`}>
            <span aria-hidden="true">👥</span> {room.participants.length}명
          </div>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div className="messages-container" role="log" aria-live="polite" aria-label="채팅 메시지">
        {messages.length === 0 ? (
          <div className="empty-messages" role="status">
            <div className="empty-icon" aria-hidden="true">
              💬
            </div>
            <h2>아직 메시지가 없습니다</h2>
            <p>첫 번째 메시지를 보내서 대화를 시작해보세요!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showDate =
                !prevMessage ||
                new Date(message.timestamp).toDateString() !==
                  new Date(prevMessage.timestamp).toDateString();

              const isMyMessage = message.senderId === chatService.getCurrentUserId();
              const showSenderName =
                !isMyMessage &&
                room.type === 'group' &&
                (!prevMessage || prevMessage.senderId !== message.senderId);

              return (
                <article
                  key={message.id}
                  aria-label={`${message.senderName}: ${message.content}, ${formatTime(message.timestamp)}`}
                >
                  {showDate && (
                    <div
                      className="date-divider"
                      role="separator"
                      aria-label={`${formatDate(message.timestamp)} 메시지`}
                    >
                      <span>{formatDate(message.timestamp)}</span>
                    </div>
                  )}

                  <div className={`message ${isMyMessage ? 'my-message' : 'other-message'}`}>
                    {showSenderName && (
                      <div className="sender-name" aria-hidden="true">
                        {message.senderName}
                      </div>
                    )}

                    <div className="message-content">
                      {message.type === 'text' ? (
                        <div className="message-text">{message.content}</div>
                      ) : message.type === 'system' ? (
                        <div className="system-message" role="status">
                          {message.content}
                        </div>
                      ) : (
                        <div className="message-text">{message.content}</div>
                      )}

                      <div className="message-time">
                        <time dateTime={message.timestamp.toISOString()}>
                          {formatTime(message.timestamp)}
                        </time>
                        {isMyMessage && (
                          <span
                            className="read-status"
                            aria-label={message.isRead ? '상대방이 읽음' : '아직 읽지 않음'}
                          >
                            {message.isRead ? '읽음' : '안읽음'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 메시지 입력 */}
      <form
        className="message-input-container"
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        aria-label="메시지 입력"
      >
        <div className="message-input-wrapper">
          <label htmlFor="message-input" className="sr-only">
            메시지 입력
          </label>
          <textarea
            id="message-input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="message-input"
            rows={1}
            maxLength={1000}
            aria-describedby="message-char-count"
          />
          <span id="message-char-count" className="sr-only">
            {newMessage.length}/1000자
          </span>
          <button
            type="submit"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="send-btn"
            aria-label="메시지 보내기"
            aria-disabled={!newMessage.trim()}
          >
            <span className="send-icon" aria-hidden="true">
              📤
            </span>
          </button>
        </div>

        <div className="input-actions" role="toolbar" aria-label="추가 옵션">
          <button type="button" className="action-btn" aria-label="이미지 전송">
            <span aria-hidden="true">📷</span>
          </button>
          <button type="button" className="action-btn" aria-label="위치 공유">
            <span aria-hidden="true">📍</span>
          </button>
          <button type="button" className="action-btn" aria-label="이모티콘 선택">
            <span aria-hidden="true">😊</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
