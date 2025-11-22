package com.travelmate.exception;

/**
 * 리소스를 찾을 수 없을 때 발생하는 예외
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    // 편의 메서드들
    public static ResourceNotFoundException forUser(Long userId) {
        return new ResourceNotFoundException(
            String.format("사용자를 찾을 수 없습니다. ID: %d", userId)
        );
    }
    
    public static ResourceNotFoundException forGroup(Long groupId) {
        return new ResourceNotFoundException(
            String.format("여행 그룹을 찾을 수 없습니다. ID: %d", groupId)
        );
    }
    
    public static ResourceNotFoundException forChatRoom(Long roomId) {
        return new ResourceNotFoundException(
            String.format("채팅방을 찾을 수 없습니다. ID: %d", roomId)
        );
    }
    
    public static ResourceNotFoundException forMessage(Long messageId) {
        return new ResourceNotFoundException(
            String.format("메시지를 찾을 수 없습니다. ID: %d", messageId)
        );
    }
    
    public static ResourceNotFoundException forPost(Long postId) {
        return new ResourceNotFoundException(
            String.format("게시글을 찾을 수 없습니다. ID: %d", postId)
        );
    }
    
    public static ResourceNotFoundException forReview(Long reviewId) {
        return new ResourceNotFoundException(
            String.format("리뷰를 찾을 수 없습니다. ID: %d", reviewId)
        );
    }
}