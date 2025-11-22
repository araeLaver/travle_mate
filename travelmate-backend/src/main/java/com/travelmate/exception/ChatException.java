package com.travelmate.exception;

import org.springframework.http.HttpStatus;

public class ChatException extends BaseException {

    public static class ChatRoomNotFoundException extends ChatException {
        public ChatRoomNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class UnauthorizedChatAccessException extends ChatException {
        public UnauthorizedChatAccessException(String message) {
            super(message, HttpStatus.FORBIDDEN);
        }
    }

    public static class MessageNotFoundException extends ChatException {
        public MessageNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class InvalidMessageTypeException extends ChatException {
        public InvalidMessageTypeException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public static class ChatRoomFullException extends ChatException {
        public ChatRoomFullException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    protected ChatException(String message, HttpStatus status) {
        super(message, status);
    }
}