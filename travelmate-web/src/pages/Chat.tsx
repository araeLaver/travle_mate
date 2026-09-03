import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import { chatRestService, ChatMessage, ChatRoom } from '../services/chatRestService';
import { useToast } from '../components/Toast';
import { ImageMessage, LocationMessage, TypingIndicator } from '../components/chat';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { trackChatMessageSent } from '../utils/analytics';
import SEOHead from '../components/SEOHead';
import PageBackground from '../components/PageBackground';

// Typing user interface
interface TypingUser {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store toast in ref to avoid useEffect dependency issues
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/dashboard');
      return;
    }

    let isMounted = true;

    const loadChat = async (showBlockingError: boolean) => {
      try {
        const [currentRoom, roomMessages] = await Promise.all([
          chatRestService.getChatRoom(roomId),
          chatRestService.getMessages(roomId),
        ]);

        if (!isMounted) return;

        if (!currentRoom) {
          toastRef.current.error('채팅방을 찾을 수 없습니다.');
          navigate('/dashboard');
          return;
        }

        setRoom(currentRoom);
        setMessages(roomMessages);
        await chatRestService.markAsRead(roomId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load chat:', error);
        if (showBlockingError && isMounted) {
          toastRef.current.error('채팅방을 불러오지 못했습니다.');
          navigate('/chat');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChat(true);

    const interval = setInterval(() => {
      loadChat(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const sentMessage = await chatRestService.sendMessage(roomId, {
        content,
        messageType: 'TEXT',
      });
      setMessages(prev => [...prev, sentMessage]);
      trackChatMessageSent();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);
      setNewMessage(content);
      toast.error('메시지 전송에 실패했습니다.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const uploadResponse = await apiClient.uploadFile('/files/upload/image', file);
      const imageUrl = uploadResponse.url || uploadResponse.imageUrl;
      if (!imageUrl) {
        throw new Error('Uploaded image URL is missing');
      }

      const sentMessage = await chatRestService.sendMessage(roomId, {
        content: imageUrl,
        messageType: 'IMAGE',
        imageUrl,
      });
      setMessages(prev => [...prev, sentMessage]);
      toast.success('이미지가 전송되었습니다.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to upload chat image:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLocationShare = () => {
    if (!roomId) return;

    if (!navigator.geolocation) {
      toast.error('이 브라우저에서는 위치 공유를 지원하지 않습니다.');
      return;
    }

    toast.info('현재 위치를 가져오는 중...');

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        try {
          const sentMessage = await chatRestService.sendMessage(roomId, {
            content: '현재 위치',
            messageType: 'LOCATION',
            locationLatitude: latitude,
            locationLongitude: longitude,
            locationName: '현재 위치',
          });
          setMessages(prev => [...prev, sentMessage]);
          toast.success('위치가 공유되었습니다.');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to share location:', error);
          toast.error('위치 공유에 실패했습니다.');
        }
      },
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('위치 접근 권한이 거부되었습니다.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('위치 정보를 사용할 수 없습니다.');
            break;
          case error.TIMEOUT:
            toast.error('위치 요청이 시간 초과되었습니다.');
            break;
          default:
            toast.error('위치를 가져올 수 없습니다.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const renderMessageContent = (message: ChatMessage, isMyMessage: boolean) => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <ImageMessage
            imageUrl={message.imageUrl || message.content}
            isMyMessage={isMyMessage}
            alt="전송된 이미지"
          />
        );
      case 'LOCATION':
        if (
          typeof message.locationLatitude === 'number' &&
          typeof message.locationLongitude === 'number'
        ) {
          return (
            <LocationMessage
              latitude={message.locationLatitude}
              longitude={message.locationLongitude}
              locationName={message.locationName || message.content}
              isMyMessage={isMyMessage}
            />
          );
        }

        return (
          <div className={isMyMessage ? 'text-white' : 'text-ink dark:text-white'}>
            {message.content}
          </div>
        );
      case 'SYSTEM':
        return (
          <div
            className="text-center text-sm text-[#74747F] dark:text-gray-400 italic py-2 px-4 bg-sand-200/60 dark:bg-gray-800/50 rounded-xl"
            role="status"
          >
            {message.content}
          </div>
        );
      case 'TEXT':
      default:
        return (
          <div className={isMyMessage ? 'text-white' : 'text-ink dark:text-white'}>
            {message.content}
          </div>
        );
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
      <div
        className="min-h-screen bg-sand-50 dark:bg-[#0a0a0b] flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center animate-pulse">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">채팅방을 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-[#0a0a0b] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sand-200 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-3xl">😢</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-4">
            채팅방을 찾을 수 없습니다
          </h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-[13px] shadow-[0_8px_22px_rgba(74,58,255,0.3)] transition-all duration-300 hover:-translate-y-0.5"
          >
            대시보드로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  const currentUserId = authService.getUser()?.id?.toString() || '';
  const isDirectRoom = room.roomType === 'PRIVATE';
  const otherParticipants = room.participants.filter(p => (p.userId || p.id) !== currentUserId);

  return (
    <div
      className="min-h-screen bg-sand-50 dark:bg-[#0a0a0b] relative overflow-hidden"
      role="main"
      aria-label={`${room.name} 채팅방`}
    >
      <SEOHead title="채팅" description="Fryndo 채팅" noIndex={true} />
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-sand-300 dark:border-gray-800/50 shadow-[0_10px_30px_rgba(16,16,20,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl bg-sand-100 dark:bg-gray-800 hover:bg-sand-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="대시보드로 돌아가기"
              >
                <span className="text-lg">←</span>
              </button>
              <Logo />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-36 h-screen flex flex-col">
        {/* Chat Header */}
        <motion.header className="px-4" {...fadeInUp}>
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900/80 rounded-[18px] p-4 border border-sand-300 dark:border-gray-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-extrabold">
                {room.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-lg font-extrabold tracking-tight text-ink dark:text-white">
                    {room.name}
                  </h1>
                  {isDirectRoom && otherParticipants[0] && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                        otherParticipants[0].isOnline
                          ? 'bg-success/10 dark:bg-green-900/30 text-success dark:text-green-400'
                          : 'bg-sand-200 dark:bg-gray-800 text-[#74747F] dark:text-gray-400'
                      }`}
                      aria-label={otherParticipants[0].isOnline ? '온라인 상태' : '오프라인 상태'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${otherParticipants[0].isOnline ? 'bg-success' : 'bg-sand-500'}`}
                      />
                      {otherParticipants[0].isOnline ? '온라인' : '오프라인'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>👥</span>
                  <span aria-label={`참여자 ${room.participants.length}명`}>
                    {room.participants.length}명 참여
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Messages Container */}
        <motion.div
          className="flex-1 overflow-y-auto px-4 py-4"
          role="log"
          aria-live="polite"
          aria-label="채팅 메시지"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center h-64 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
              >
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
                  아직 메시지가 없습니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  첫 번째 메시지를 보내서 대화를 시작해보세요!
                </p>
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const showDate =
                      !prevMessage ||
                      new Date(message.sentAt).toDateString() !==
                        new Date(prevMessage.sentAt).toDateString();

                    const isMyMessage = message.senderId === currentUserId;
                    const showSenderName =
                      !isMyMessage &&
                      !isDirectRoom &&
                      (!prevMessage || prevMessage.senderId !== message.senderId);

                    return (
                      <motion.article
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        aria-label={`${message.senderName}: ${message.content}, ${formatTime(message.sentAt)}`}
                      >
                        {showDate && (
                          <div
                            className="flex items-center justify-center my-6"
                            role="separator"
                            aria-label={`${formatDate(message.sentAt)} 메시지`}
                          >
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sand-400 dark:via-gray-700 to-transparent" />
                            <span className="px-4 py-1.5 text-sm font-bold text-[#74747F] dark:text-gray-400 bg-sand-300 dark:bg-gray-800 rounded-full">
                              {formatDate(message.sentAt)}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sand-400 dark:via-gray-700 to-transparent" />
                          </div>
                        )}

                        <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'}`}
                          >
                            {showSenderName && (
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3"
                                aria-hidden="true"
                              >
                                {message.senderName}
                              </div>
                            )}

                            <div
                              className={`px-4 py-3 rounded-[18px] ${
                                isMyMessage
                                  ? 'bg-primary-500 text-white rounded-br-[6px]'
                                  : 'bg-white dark:bg-gray-800 border border-sand-300 dark:border-gray-700 rounded-bl-[6px]'
                              }`}
                            >
                              {renderMessageContent(message, isMyMessage)}
                            </div>

                            <div
                              className={`flex items-center gap-2 mt-1 px-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <time
                                dateTime={message.sentAt.toISOString()}
                                className="text-xs text-gray-400 dark:text-gray-500"
                              >
                                {formatTime(message.sentAt)}
                              </time>
                              {isMyMessage && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    message.isRead
                                      ? 'text-primary-500 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30'
                                      : 'text-[#8A8A95] dark:text-gray-500 bg-sand-200 dark:bg-gray-800'
                                  }`}
                                  aria-label={message.isRead ? '상대방이 읽음' : '아직 읽지 않음'}
                                >
                                  {message.isRead ? '읽음' : '안읽음'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
                {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Message Input */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-sand-50 dark:from-[#0a0a0b] via-sand-50/90 dark:via-[#0a0a0b]/90 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form
            className="max-w-4xl mx-auto"
            onSubmit={e => {
              e.preventDefault();
              void handleSendMessage();
            }}
            aria-label="메시지 입력"
          >
            <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-3 border border-sand-300 dark:border-gray-800/50 shadow-[0_10px_30px_rgba(16,16,20,0.08)]">
              <div className="flex items-end gap-3">
                <label htmlFor="message-input" className="sr-only">
                  메시지 입력
                </label>
                <textarea
                  id="message-input"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 bg-sand-100 dark:bg-gray-800 rounded-[14px] px-4 py-3 resize-none outline-none text-ink dark:text-white placeholder-[#9A9AA4] dark:placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all min-h-[48px] max-h-[120px]"
                  rows={1}
                  maxLength={1000}
                  aria-describedby="message-char-count"
                />
                <span id="message-char-count" className="sr-only">
                  {newMessage.length}/1000자
                </span>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-[14px] bg-primary-500 hover:bg-primary-700 text-white flex items-center justify-center shadow-[0_8px_22px_rgba(74,58,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  aria-label="메시지 보내기"
                  aria-disabled={!newMessage.trim()}
                >
                  <span className="text-xl">➤</span>
                </button>
              </div>

              <div
                className="flex items-center gap-2 mt-3 pt-3 border-t border-sand-300 dark:border-gray-700/50"
                role="toolbar"
                aria-label="추가 옵션"
              >
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand-100 dark:bg-gray-800 hover:bg-sand-200 dark:hover:bg-gray-700 text-[#4A4A55] dark:text-gray-300 transition-colors"
                  aria-label="이미지 전송"
                  onClick={handleImageSelect}
                  disabled={isUploading}
                >
                  <span>📷</span>
                  <span className="text-sm hidden sm:inline">이미지</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand-100 dark:bg-gray-800 hover:bg-sand-200 dark:hover:bg-gray-700 text-[#4A4A55] dark:text-gray-300 transition-colors"
                  aria-label="위치 공유"
                  onClick={handleLocationShare}
                >
                  <span>📍</span>
                  <span className="text-sm hidden sm:inline">위치</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand-100 dark:bg-gray-800 hover:bg-sand-200 dark:hover:bg-gray-700 text-[#4A4A55] dark:text-gray-300 transition-colors"
                  aria-label="이모티콘 선택"
                >
                  <span>😊</span>
                  <span className="text-sm hidden sm:inline">이모티콘</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
