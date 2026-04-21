import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { chatService, ChatRoom } from '../services/chatService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import SEOHead from '../components/SEOHead';
import PageBackground from '../components/PageBackground';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChatRooms();

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
      // Failed to load chat rooms
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
    return room.participants.length - 1;
  };

  const handleRoomKeyDown = (e: React.KeyboardEvent, roomId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/chat/${roomId}`);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center animate-pulse">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">채팅방을 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden"
      role="main"
      aria-label="채팅 목록"
    >
      <SEOHead title="채팅 목록" description="Fryndo 채팅 목록" noIndex={true} />
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 text-sm"
              >
                대시보드
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.header className="text-center mb-8" {...fadeInUp}>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 mb-4">
              <span className="text-2xl">💬</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">채팅</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              여행 메이트와의 대화
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              여행 메이트들과의 대화를 확인해보세요
            </p>
          </motion.header>

          {/* Search */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="relative">
                <label htmlFor="chat-search" className="sr-only">
                  채팅방 검색
                </label>
                <input
                  id="chat-search"
                  type="search"
                  placeholder="채팅방이나 메시지 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 pl-12 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                  aria-describedby="search-results-count"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <span id="search-results-count" className="sr-only" aria-live="polite">
                {searchQuery ? `검색 결과: ${filteredRooms.length}개의 채팅방` : ''}
              </span>
            </div>
          </motion.div>

          {/* Chat Rooms Section */}
          <motion.section
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            aria-label="채팅방 목록"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">활성 채팅방</h2>
              <span
                className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm font-medium"
                aria-label={`총 ${filteredRooms.length}개의 채팅방`}
              >
                {filteredRooms.length}개
              </span>
            </div>

            {filteredRooms.length === 0 ? (
              <motion.div
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-lg text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center">
                  <span className="text-4xl">💬</span>
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">다른 키워드로 검색해보세요.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      아직 채팅방이 없습니다
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      여행 메이트를 찾아서 첫 대화를 시작해보세요!
                    </p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
                      aria-label="여행 메이트 찾기 페이지로 이동"
                    >
                      <span>🔍</span>
                      여행 메이트 찾기
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.ul
                className="space-y-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
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
                    <motion.li
                      key={room.id}
                      variants={fadeInUp}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                      onClick={() => navigate(`/chat/${room.id}`)}
                      onKeyDown={e => handleRoomKeyDown(e, room.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${room.name} 채팅방${room.type === 'direct' ? (isOnline ? ', 온라인' : ', 오프라인') : `, 참여자 ${room.participants.length}명`}${unreadText}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0" aria-hidden="true">
                          {room.type === 'direct' ? (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                              {otherParticipant?.profileImage ? (
                                <img
                                  src={otherParticipant.profileImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>👤</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                              <span className="text-xl">👥</span>
                            </div>
                          )}
                          {room.type === 'direct' && (
                            <span
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                                isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-800 dark:text-white truncate">
                                {room.name}
                              </h3>
                              {room.type === 'group' && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <span>👥</span>
                                  {getTotalParticipants(room)}명
                                  {getOnlineParticipants(room) > 0 && (
                                    <span className="text-green-500 dark:text-green-400">
                                      • {getOnlineParticipants(room)}명 온라인
                                    </span>
                                  )}
                                </span>
                              )}
                              {room.type === 'direct' && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    isOnline
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {isOnline ? '온라인' : '오프라인'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {room.lastMessage && (
                                <time
                                  className="text-xs text-gray-400 dark:text-gray-500"
                                  dateTime={room.lastMessage.timestamp.toISOString()}
                                >
                                  {formatTime(room.lastMessage.timestamp)}
                                </time>
                              )}
                              {room.unreadCount > 0 && (
                                <span
                                  className="min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                                  aria-hidden="true"
                                >
                                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className="text-sm text-gray-500 dark:text-gray-400 truncate"
                            aria-hidden="true"
                          >
                            {room.lastMessage ? (
                              <>
                                <span className="font-medium">
                                  {room.lastMessage.senderId === chatService.getCurrentUserId()
                                    ? '나'
                                    : room.lastMessage.senderName}
                                  :
                                </span>{' '}
                                <span>
                                  {room.lastMessage.type === 'text' ? (
                                    room.lastMessage.content
                                  ) : room.lastMessage.type === 'image' ? (
                                    <span className="inline-flex items-center gap-1">
                                      📷 이미지
                                    </span>
                                  ) : room.lastMessage.type === 'location' ? (
                                    <span className="inline-flex items-center gap-1">📍 위치</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      💬 메시지
                                    </span>
                                  )}
                                </span>
                              </>
                            ) : (
                              <span className="italic">대화를 시작해보세요!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </motion.section>

          {/* Quick Actions */}
          <motion.nav
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            aria-label="빠른 액션"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
              aria-label="새로운 여행 메이트 찾기"
            >
              <span className="text-xl">🔍</span>
              <span>새로운 메이트 찾기</span>
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="flex items-center justify-center gap-2 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 text-gray-800 dark:text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              aria-label="여행 그룹 목록 보기"
            >
              <span className="text-xl">🗺️</span>
              <span>여행 그룹 보기</span>
            </button>
          </motion.nav>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
