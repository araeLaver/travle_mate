import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService, ChatRoom } from '../services/chatService';
import './ChatList.css';

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChatRooms();
    
    // 주기적으로 채팅방 목록 업데이트
    const interval = setInterval(() => {
      loadChatRooms();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadChatRooms = () => {
    try {
      const rooms = chatService.getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return messageDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getOnlineParticipants = (room: ChatRoom) => {
    return room.participants.filter(p => 
      p.id !== chatService.getCurrentUserId() && p.isOnline
    ).length;
  };

  const getTotalParticipants = (room: ChatRoom) => {
    return room.participants.length - 1; // 자신 제외
  };

  if (isLoading) {
    return (
      <div className="chat-list-loading">
        <div className="loading-spinner">💬</div>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h1>💬 채팅</h1>
        <p>여행 메이트들과의 대화를 확인해보세요</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="채팅방이나 메시지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="chat-rooms-section">
        <div className="section-header">
          <h3>활성 채팅방</h3>
          <span className="room-count">{filteredRooms.length}개</span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="empty-chats">
            <div className="empty-icon">💬</div>
            {searchQuery ? (
              <>
                <h3>검색 결과가 없습니다</h3>
                <p>다른 키워드로 검색해보세요.</p>
              </>
            ) : (
              <>
                <h3>아직 채팅방이 없습니다</h3>
                <p>여행 메이트를 찾아서 첫 대화를 시작해보세요!</p>
                <button 
                  className="find-mates-btn"
                  onClick={() => navigate('/dashboard')}
                >
                  🔍 여행 메이트 찾기
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="chat-rooms-list">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className="chat-room-item"
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                <div className="room-avatar">
                  {room.type === 'direct' ? (
                    <>
                      {room.participants.find(p => p.id !== chatService.getCurrentUserId())?.profileImage ? (
                        <img 
                          src={room.participants.find(p => p.id !== chatService.getCurrentUserId())?.profileImage} 
                          alt={room.name}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          👤
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="group-avatar">
                      <span className="group-icon">👥</span>
                      <span className="member-count">{room.participants.length}</span>
                    </div>
                  )}
                </div>

                <div className="room-content">
                  <div className="room-header">
                    <div className="room-info">
                      <h4 className="room-name">{room.name}</h4>
                      {room.type === 'group' && (
                        <span className="participant-info">
                          👥 {getTotalParticipants(room)}명 
                          {getOnlineParticipants(room) > 0 && (
                            <span className="online-count">
                              • 🟢 {getOnlineParticipants(room)}명 온라인
                            </span>
                          )}
                        </span>
                      )}
                      {room.type === 'direct' && (
                        <span className={`online-status ${
                          room.participants.find(p => p.id !== chatService.getCurrentUserId())?.isOnline 
                            ? 'online' : 'offline'
                        }`}>
                          {room.participants.find(p => p.id !== chatService.getCurrentUserId())?.isOnline 
                            ? '🟢 온라인' : '⚪ 오프라인'
                          }
                        </span>
                      )}
                    </div>
                    <div className="room-meta">
                      {room.lastMessage && (
                        <span className="last-time">
                          {formatTime(room.lastMessage.timestamp)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="unread-badge">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="last-message">
                    {room.lastMessage ? (
                      <>
                        <span className="message-sender">
                          {room.lastMessage.senderId === chatService.getCurrentUserId() 
                            ? '나' 
                            : room.lastMessage.senderName
                          }:
                        </span>
                        <span className="message-content">
                          {room.lastMessage.type === 'text' 
                            ? room.lastMessage.content
                            : room.lastMessage.type === 'image' 
                            ? '📷 이미지'
                            : room.lastMessage.type === 'location'
                            ? '📍 위치'
                            : '💬 메시지'
                          }
                        </span>
                      </>
                    ) : (
                      <span className="no-messages">대화를 시작해보세요!</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/dashboard')}
        >
          <span className="btn-icon">🔍</span>
          새로운 메이트 찾기
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/groups')}
        >
          <span className="btn-icon">🗺️</span>
          여행 그룹 보기
        </button>
      </div>
    </div>
  );
};

export default ChatList;