package com.travelmate.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 비즈니스 로직에서 발생하는 예외를 처리하는 커스텀 예외 클래스
 */
@Getter
public class BusinessException extends RuntimeException {
    
    private final HttpStatus status;
    private final String errorCode;
    
    public BusinessException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = "BUSINESS_ERROR";
    }
    
    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = "BUSINESS_ERROR";
    }
    
    public BusinessException(String message, String errorCode) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode;
    }
    
    public BusinessException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
    
    public BusinessException(String message, Throwable cause, HttpStatus status, String errorCode) {
        super(message, cause);
        this.status = status;
        this.errorCode = errorCode;
    }
    
    // 자주 사용되는 예외 패턴들을 위한 정적 팩토리 메서드들
    public static BusinessException badRequest(String message) {
        return new BusinessException(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }
    
    public static BusinessException forbidden(String message) {
        return new BusinessException(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }
    
    public static BusinessException unauthorized(String message) {
        return new BusinessException(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }
    
    public static BusinessException notFound(String message) {
        return new BusinessException(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
    }
    
    public static BusinessException conflict(String message) {
        return new BusinessException(message, HttpStatus.CONFLICT, "CONFLICT");
    }
    
    public static BusinessException unprocessableEntity(String message) {
        return new BusinessException(message, HttpStatus.UNPROCESSABLE_ENTITY, "UNPROCESSABLE_ENTITY");
    }
    
    // 도메인별 비즈니스 예외들
    public static BusinessException userNotFound(Long userId) {
        return new BusinessException(
            String.format("사용자를 찾을 수 없습니다. ID: %d", userId),
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }
    
    public static BusinessException groupNotFound(Long groupId) {
        return new BusinessException(
            String.format("여행 그룹을 찾을 수 없습니다. ID: %d", groupId),
            HttpStatus.NOT_FOUND,
            "GROUP_NOT_FOUND"
        );
    }
    
    public static BusinessException groupFull() {
        return new BusinessException(
            "그룹이 가득 찼습니다.",
            HttpStatus.BAD_REQUEST,
            "GROUP_FULL"
        );
    }
    
    public static BusinessException alreadyGroupMember() {
        return new BusinessException(
            "이미 그룹의 멤버입니다.",
            HttpStatus.CONFLICT,
            "ALREADY_GROUP_MEMBER"
        );
    }
    
    public static BusinessException invalidGroupPermission() {
        return new BusinessException(
            "그룹에 대한 권한이 없습니다.",
            HttpStatus.FORBIDDEN,
            "INVALID_GROUP_PERMISSION"
        );
    }
    
    public static BusinessException chatRoomNotFound(Long roomId) {
        return new BusinessException(
            String.format("채팅방을 찾을 수 없습니다. ID: %d", roomId),
            HttpStatus.NOT_FOUND,
            "CHAT_ROOM_NOT_FOUND"
        );
    }
    
    public static BusinessException messageNotFound(Long messageId) {
        return new BusinessException(
            String.format("메시지를 찾을 수 없습니다. ID: %d", messageId),
            HttpStatus.NOT_FOUND,
            "MESSAGE_NOT_FOUND"
        );
    }
    
    public static BusinessException invalidFileType() {
        return new BusinessException(
            "지원하지 않는 파일 형식입니다.",
            HttpStatus.BAD_REQUEST,
            "INVALID_FILE_TYPE"
        );
    }
    
    public static BusinessException fileTooLarge() {
        return new BusinessException(
            "파일 크기가 너무 큽니다.",
            HttpStatus.BAD_REQUEST,
            "FILE_TOO_LARGE"
        );
    }
    
    public static BusinessException invalidLocation() {
        return new BusinessException(
            "잘못된 위치 정보입니다.",
            HttpStatus.BAD_REQUEST,
            "INVALID_LOCATION"
        );
    }
    
    public static BusinessException matchingNotEnabled() {
        return new BusinessException(
            "매칭 기능이 비활성화되어 있습니다.",
            HttpStatus.BAD_REQUEST,
            "MATCHING_NOT_ENABLED"
        );
    }
    
    public static BusinessException locationNotEnabled() {
        return new BusinessException(
            "위치 서비스가 비활성화되어 있습니다.",
            HttpStatus.BAD_REQUEST,
            "LOCATION_NOT_ENABLED"
        );
    }
    
    public static BusinessException reviewAlreadyExists() {
        return new BusinessException(
            "이미 리뷰를 작성했습니다.",
            HttpStatus.CONFLICT,
            "REVIEW_ALREADY_EXISTS"
        );
    }
    
    public static BusinessException cannotReviewSelf() {
        return new BusinessException(
            "자기 자신을 리뷰할 수 없습니다.",
            HttpStatus.BAD_REQUEST,
            "CANNOT_REVIEW_SELF"
        );
    }
    
    public static BusinessException invalidDateRange() {
        return new BusinessException(
            "잘못된 날짜 범위입니다.",
            HttpStatus.BAD_REQUEST,
            "INVALID_DATE_RANGE"
        );
    }
    
    public static BusinessException pastDateNotAllowed() {
        return new BusinessException(
            "과거 날짜는 선택할 수 없습니다.",
            HttpStatus.BAD_REQUEST,
            "PAST_DATE_NOT_ALLOWED"
        );
    }
}