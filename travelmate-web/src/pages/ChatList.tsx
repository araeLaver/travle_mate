import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService, ChatRoom } from '../services/chatService';
import './ChatList.css';

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

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

const MapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
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
          <MessageIcon />
        </div>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="chat-list-container" role="main" aria-label="채팅 목록">
      <header className="chat-list-header">
        <h1>
          <span className="header-icon" aria-hidden="true">
            <MessageIcon />
          </span>{' '}
          채팅
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
            <SearchIcon />
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
              <MessageIcon />
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
                  <span className="btn-icon" aria-hidden="true">
                    <SearchIcon />
                  </span>{' '}
                  여행 메이트 찾기
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
                          <div className="avatar-placeholder">
                            <UserIcon />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="group-avatar">
                        <span className="group-icon">
                          <UsersIcon />
                        </span>
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
                            <span className="info-icon" aria-hidden="true">
                              <UsersIcon />
                            </span>{' '}
                            {getTotalParticipants(room)}명
                            {getOnlineParticipants(room) > 0 && (
                              <span className="online-count">
                                •{' '}
                                <span className="status-icon online" aria-hidden="true">
                                  <OnlineIcon />
                                </span>{' '}
                                {getOnlineParticipants(room)}명 온라인
                              </span>
                            )}
                          </span>
                        )}
                        {room.type === 'direct' && (
                          <span
                            className={`online-status ${isOnline ? 'online' : 'offline'}`}
                            aria-hidden="true"
                          >
                            <span className="status-icon">
                              {isOnline ? <OnlineIcon /> : <OfflineIcon />}
                            </span>{' '}
                            {isOnline ? '온라인' : '오프라인'}
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
                            {room.lastMessage.type === 'text' ? (
                              room.lastMessage.content
                            ) : room.lastMessage.type === 'image' ? (
                              <span className="message-type-icon">
                                <CameraIcon /> 이미지
                              </span>
                            ) : room.lastMessage.type === 'location' ? (
                              <span className="message-type-icon">
                                <MapPinIcon /> 위치
                              </span>
                            ) : (
                              <span className="message-type-icon">
                                <MessageIcon /> 메시지
                              </span>
                            )}
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
            <SearchIcon />
          </span>
          새로운 메이트 찾기
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate('/groups')}
          aria-label="여행 그룹 목록 보기"
        >
          <span className="btn-icon" aria-hidden="true">
            <MapIcon />
          </span>
          여행 그룹 보기
        </button>
      </nav>
    </div>
  );
};

export default ChatList;
