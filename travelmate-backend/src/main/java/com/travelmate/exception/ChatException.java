package com.travelmate.exception;

import org.springframework.http.HttpStatus;

public class ChatException extends BaseException {

    public static class ChatRoomNotFoundException extends ChatException {
        public ChatRoomNotFoundException() { this("채팅방을 찾을 수 없습니다."); }
        public ChatRoomNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class UnauthorizedChatAccessException extends ChatException {
        public UnauthorizedChatAccessException() { this("채팅 참여자가 아닙니다."); }
        public UnauthorizedChatAccessException(String message) {
            super(message, HttpStatus.FORBIDDEN);
        }
    }

    public static class MessageNotFoundException extends ChatException {
        public MessageNotFoundException() { this("메시지를 찾을 수 없습니다."); }
        public MessageNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class InvalidMessageTypeException extends ChatException {
        public InvalidMessageTypeException() { this("유효하지 않은 메시지 타입입니다."); }
        public InvalidMessageTypeException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public static class ChatRoomFullException extends ChatException {
        public ChatRoomFullException() { this("채팅방 인원이 초과되었습니다."); }
        public ChatRoomFullException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    protected ChatException(String message, HttpStatus status) {
        super(message, status);
    }
}