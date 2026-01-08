import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService, ChatMessage, ChatRoom } from '../services/chatService';
import { useToast } from '../components/Toast';
import './Chat.css';

// SVG Icons
const MessageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const OnlineIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const OfflineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CameraIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SmileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

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
          <MessageIcon />
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
          <span className="back-icon" aria-hidden="true">
            <ArrowLeftIcon />
          </span>
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
                    <span className="status-icon">
                      {otherParticipants[0].isOnline ? <OnlineIcon /> : <OfflineIcon />}
                    </span>{' '}
                    {otherParticipants[0].isOnline ? '온라인' : '오프라인'}
                  </span>
                )}
              </>
            ) : (
              <span className="chat-name">{room.name}</span>
            )}
          </h1>
          <div className="participant-count" aria-label={`참여자 ${room.participants.length}명`}>
            <span className="participant-icon" aria-hidden="true">
              <UsersIcon />
            </span>{' '}
            {room.participants.length}명
          </div>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div className="messages-container" role="log" aria-live="polite" aria-label="채팅 메시지">
        {messages.length === 0 ? (
          <div className="empty-messages" role="status">
            <div className="empty-icon" aria-hidden="true">
              <MessageIcon />
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
              <SendIcon />
            </span>
          </button>
        </div>

        <div className="input-actions" role="toolbar" aria-label="추가 옵션">
          <button type="button" className="action-btn" aria-label="이미지 전송">
            <span className="action-icon" aria-hidden="true">
              <CameraIcon />
            </span>
          </button>
          <button type="button" className="action-btn" aria-label="위치 공유">
            <span className="action-icon" aria-hidden="true">
              <MapPinIcon />
            </span>
          </button>
          <button type="button" className="action-btn" aria-label="이모티콘 선택">
            <span className="action-icon" aria-hidden="true">
              <SmileIcon />
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
