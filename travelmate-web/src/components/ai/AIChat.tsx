/**
 * AI Travel Assistant Chat Component
 * AI 여행 어시스턴트 채팅 컴포넌트
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  aiRecommendationService,
  ChatResponse,
  PlaceRecommendation,
} from '../../services/aiRecommendationService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedPlaces?: PlaceRecommendation[];
  suggestedActions?: string[];
}

interface AIChatProps {
  className?: string;
  initialContext?: string;
  onPlaceSelect?: (place: PlaceRecommendation) => void;
}

const AIChat: React.FC<AIChatProps> = ({ className = '', initialContext, onPlaceSelect }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content:
        '안녕하세요! 저는 Fryndo AI 어시스턴트입니다. 여행 계획, 장소 추천, 현지 정보 등 무엇이든 물어보세요!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle send message
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await aiRecommendationService.chat({
        message: trimmedInput,
        conversationId,
        context: initialContext,
      });

      setConversationId(response.conversationId);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        relatedPlaces: response.relatedPlaces,
        suggestedActions: response.suggestedActions,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggested action click
  const handleActionClick = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  // Quick prompts
  const quickPrompts = [
    '오늘 근처 맛집 추천해줘',
    '서울 3일 여행 일정 짜줘',
    '지금 날씨에 맞는 여행지는?',
    '저렴하게 제주도 여행하는 법',
  ];

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b dark:border-gray-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-xl">AI</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Fryndo AI</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">여행 어시스턴트</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Related Places */}
              {message.relatedPlaces && message.relatedPlaces.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium opacity-80">관련 장소:</p>
                  {message.relatedPlaces.map(place => (
                    <button
                      key={place.placeId}
                      onClick={() => onPlaceSelect?.(place)}
                      className="w-full text-left p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <p className="font-medium">{place.name}</p>
                      <p className="text-xs opacity-80">
                        {place.category} | {place.distance?.toFixed(1)}km
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(action)}
                      className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts (show when no messages from user) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">빠른 질문:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleActionClick(prompt)}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border rounded-full dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
