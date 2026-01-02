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
      // 채팅방 로드 실패
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = chatRooms.filter(
    room =>
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
      day: 'numeric',
    });
  };

  const getOnlineParticipants = (room: ChatRoom) => {
    return room.participants.filter(p => p.id !== chatService.getCurrentUserId() && p.isOnline)
      .length;
  };

  const getTotalParticipants = (room: ChatRoom) => {
    return room.participants.length - 1; // 자신 제외
  };

  const handleRoomKeyDown = (e: React.KeyboardEvent, roomId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/chat/${roomId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="chat-list-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true">
          💬
        </div>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="chat-list-container" role="main" aria-label="채팅 목록">
      <header className="chat-list-header">
        <h1>
          <span aria-hidden="true">💬</span> 채팅
        </h1>
        <p>여행 메이트들과의 대화를 확인해보세요</p>
      </header>

      <search className="search-section" role="search" aria-label="채팅방 검색">
        <div className="search-bar">
          <label htmlFor="chat-search" className="sr-only">
            채팅방 검색
          </label>
          <input
            id="chat-search"
            type="search"
            placeholder="채팅방이나 메시지 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
            aria-describedby="search-results-count"
          />
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
        </div>
        <span id="search-results-count" className="sr-only" aria-live="polite">
          {searchQuery ? `검색 결과: ${filteredRooms.length}개의 채팅방` : ''}
        </span>
      </search>

      <section className="chat-rooms-section" aria-label="채팅방 목록">
        <div className="section-header">
          <h2>활성 채팅방</h2>
          <span className="room-count" aria-label={`총 ${filteredRooms.length}개의 채팅방`}>
            {filteredRooms.length}개
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="empty-chats" role="status">
            <div className="empty-icon" aria-hidden="true">
              💬
            </div>
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
                  aria-label="여행 메이트 찾기 페이지로 이동"
                >
                  <span aria-hidden="true">🔍</span> 여행 메이트 찾기
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="chat-rooms-list">
            {filteredRooms.map(room => {
              const otherParticipant = room.participants.find(
                p => p.id !== chatService.getCurrentUserId()
              );
              const isOnline = room.type === 'direct' && otherParticipant?.isOnline;
              const unreadText =
                room.unreadCount > 0
                  ? `, 읽지 않은 메시지 ${room.unreadCount > 99 ? '99개 이상' : room.unreadCount + '개'}`
                  : '';

              return (
                <li
                  key={room.id}
                  className="chat-room-item"
                  onClick={() => navigate(`/chat/${room.id}`)}
                  onKeyDown={e => handleRoomKeyDown(e, room.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${room.name} 채팅방${room.type === 'direct' ? (isOnline ? ', 온라인' : ', 오프라인') : `, 참여자 ${room.participants.length}명`}${unreadText}`}
                >
                  <div className="room-avatar" aria-hidden="true">
                    {room.type === 'direct' ? (
                      <>
                        {otherParticipant?.profileImage ? (
                          <img
                            src={otherParticipant.profileImage}
                            alt=""
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar-placeholder">👤</div>
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
                        <h3 className="room-name">{room.name}</h3>
                        {room.type === 'group' && (
                          <span className="participant-info" aria-hidden="true">
                            <span aria-hidden="true">👥</span> {getTotalParticipants(room)}명
                            {getOnlineParticipants(room) > 0 && (
                              <span className="online-count">
                                • <span aria-hidden="true">🟢</span> {getOnlineParticipants(room)}명
                                온라인
                              </span>
                            )}
                          </span>
                        )}
                        {room.type === 'direct' && (
                          <span
                            className={`online-status ${isOnline ? 'online' : 'offline'}`}
                            aria-hidden="true"
                          >
                            {isOnline ? '🟢 온라인' : '⚪ 오프라인'}
                          </span>
                        )}
                      </div>
                      <div className="room-meta">
                        {room.lastMessage && (
                          <time
                            className="last-time"
                            dateTime={room.lastMessage.timestamp.toISOString()}
                          >
                            {formatTime(room.lastMessage.timestamp)}
                          </time>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="unread-badge" aria-hidden="true">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="last-message" aria-hidden="true">
                      {room.lastMessage ? (
                        <>
                          <span className="message-sender">
                            {room.lastMessage.senderId === chatService.getCurrentUserId()
                              ? '나'
                              : room.lastMessage.senderName}
                            :
                          </span>
                          <span className="message-content">
                            {room.lastMessage.type === 'text'
                              ? room.lastMessage.content
                              : room.lastMessage.type === 'image'
                                ? '📷 이미지'
                                : room.lastMessage.type === 'location'
                                  ? '📍 위치'
                                  : '💬 메시지'}
                          </span>
                        </>
                      ) : (
                        <span className="no-messages">대화를 시작해보세요!</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="quick-actions" aria-label="빠른 액션">
        <button
          className="action-btn primary"
          onClick={() => navigate('/dashboard')}
          aria-label="새로운 여행 메이트 찾기"
        >
          <span className="btn-icon" aria-hidden="true">
            🔍
          </span>
          새로운 메이트 찾기
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate('/groups')}
          aria-label="여행 그룹 목록 보기"
        >
          <span className="btn-icon" aria-hidden="true">
            🗺️
          </span>
          여행 그룹 보기
        </button>
      </nav>
    </div>
  );
};

export default ChatList;
