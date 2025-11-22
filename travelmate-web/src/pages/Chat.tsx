import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService, ChatMessage, ChatRoom } from '../services/chatService';
import './Chat.css';

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
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
      alert('채팅방을 찾을 수 없습니다.');
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
  }, [roomId, navigate]);

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
      hour12: false
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
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner">💬</div>
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
    <div className="chat-container">
      {/* 채팅 헤더 */}
      <div className="chat-header">
        <button 
          className="back-btn" 
          onClick={() => navigate('/dashboard')}
        >
          ←
        </button>
        <div className="chat-info">
          <div className="chat-title">
            {room.type === 'direct' ? (
              <>
                <span className="chat-name">{room.name}</span>
                {otherParticipants[0] && (
                  <span className={`online-indicator ${otherParticipants[0].isOnline ? 'online' : 'offline'}`}>
                    {otherParticipants[0].isOnline ? '🟢 온라인' : '⚪ 오프라인'}
                  </span>
                )}
              </>
            ) : (
              <span className="chat-name">{room.name}</span>
            )}
          </div>
          <div className="participant-count">
            👥 {room.participants.length}명
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">💬</div>
            <h3>아직 메시지가 없습니다</h3>
            <p>첫 번째 메시지를 보내서 대화를 시작해보세요!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showDate = !prevMessage || 
                new Date(message.timestamp).toDateString() !== new Date(prevMessage.timestamp).toDateString();
              
              const isMyMessage = message.senderId === chatService.getCurrentUserId();
              const showSenderName = !isMyMessage && room.type === 'group' && 
                (!prevMessage || prevMessage.senderId !== message.senderId);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="date-divider">
                      <span>{formatDate(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className={`message ${isMyMessage ? 'my-message' : 'other-message'}`}>
                    {showSenderName && (
                      <div className="sender-name">{message.senderName}</div>
                    )}
                    
                    <div className="message-content">
                      {message.type === 'text' ? (
                        <div className="message-text">{message.content}</div>
                      ) : message.type === 'system' ? (
                        <div className="system-message">{message.content}</div>
                      ) : (
                        <div className="message-text">{message.content}</div>
                      )}
                      
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                        {isMyMessage && (
                          <span className="read-status">
                            {message.isRead ? '읽음' : '안읽음'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="message-input"
            rows={1}
            maxLength={1000}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="send-btn"
          >
            <span className="send-icon">📤</span>
          </button>
        </div>
        
        <div className="input-actions">
          <button className="action-btn" title="이미지 전송">
            📷
          </button>
          <button className="action-btn" title="위치 공유">
            📍
          </button>
          <button className="action-btn" title="이모티콘">
            😊
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;