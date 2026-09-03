package com.travelmate.exception;

import com.travelmate.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.context.request.WebRequest;

import java.net.SocketTimeoutException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private String getPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }

    private String getTraceId() {
        return MDC.get("requestId");
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, WebRequest request) {
        log.error("Business exception: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(ex.getErrorCodeStr())
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase())
                .message(ex.getMessage())
                .path(getPath(request))
                .timestamp(LocalDateTime.now())
                .traceId(getTraceId())
                .build();

        return ResponseEntity.status(ex.getStatus()).body(errorResponse);
    }

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex, WebRequest request) {
        log.error("Base exception: {}", ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(ErrorCode.INTERNAL_ERROR.getCode())
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase())
                .message(ex.getMessage())
                .path(getPath(request))
                .timestamp(LocalDateTime.now())
                .traceId(getTraceId())
                .build();

        return ResponseEntity.status(ex.getStatus()).body(errorResponse);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.RESOURCE_NOT_FOUND, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.warn("Validation failed: {}", ex.getMessage());

        List<ErrorResponse.ValidationError> validationErrors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.add(new ErrorResponse.ValidationError(fieldName, errorMessage));
        });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(ErrorCode.VALIDATION_FAILED.getCode())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ErrorCode.VALIDATION_FAILED.getMessage())
                .path(getPath(request))
                .timestamp(LocalDateTime.now())
                .validationErrors(validationErrors)
                .traceId(getTraceId())
                .build();

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.warn("Invalid argument: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.INVALID_INPUT, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex, WebRequest request) {
        log.warn("Invalid state: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.INVALID_INPUT, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(UserException.class)
    public ResponseEntity<ErrorResponse> handleUserException(UserException ex, WebRequest request) {
        log.warn("User exception: {}", ex.getMessage());

        ErrorCode errorCode = determineUserErrorCode(ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(errorCode, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(errorResponse);
    }

    @ExceptionHandler(ChatException.class)
    public ResponseEntity<ErrorResponse> handleChatException(ChatException ex, WebRequest request) {
        log.warn("Chat exception: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.CHAT_ROOM_NOT_FOUND, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(TravelGroupException.class)
    public ResponseEntity<ErrorResponse> handleTravelGroupException(TravelGroupException ex, WebRequest request) {
        log.warn("TravelGroup exception: {}", ex.getMessage());

        ErrorCode errorCode = determineGroupErrorCode(ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(errorCode, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(errorResponse);
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceededException(RateLimitExceededException ex, WebRequest request) {
        log.warn("Rate limit exceeded: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.RATE_LIMIT_EXCEEDED, getPath(request), ex.getMessage());
        errorResponse.setTraceId(getTraceId());
        errorResponse.setRetryAfter(60);

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.FORBIDDEN, getPath(request));
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex, WebRequest request) {
        log.warn("File size exceeded: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.FILE_TOO_LARGE, getPath(request));
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(errorResponse);
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccessException(ResourceAccessException ex, WebRequest request) {
        log.error("External service access failed: {}", ex.getMessage());

        ErrorCode errorCode = ErrorCode.INTERNAL_ERROR;
        if (ex.getCause() instanceof SocketTimeoutException) {
            errorCode = ErrorCode.IPFS_TIMEOUT;
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(errorCode.getCode())
                .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                .error(HttpStatus.SERVICE_UNAVAILABLE.getReasonPhrase())
                .message("외부 서비스에 접근할 수 없습니다. 잠시 후 다시 시도해주세요.")
                .path(getPath(request))
                .timestamp(LocalDateTime.now())
                .traceId(getTraceId())
                .build();

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex, WebRequest request) {
        log.error("Runtime exception: {}", ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.INTERNAL_ERROR, getPath(request));
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unexpected exception: {}", ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.INTERNAL_ERROR, getPath(request));
        errorResponse.setTraceId(getTraceId());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private ErrorCode determineUserErrorCode(String message) {
        if (message == null) return ErrorCode.INTERNAL_ERROR;
        String lowerMsg = message.toLowerCase();

        if (lowerMsg.contains("찾을 수 없") || lowerMsg.contains("not found")) {
            return ErrorCode.USER_NOT_FOUND;
        }
        if (lowerMsg.contains("이미 존재") || lowerMsg.contains("already exists")) {
            return ErrorCode.USER_ALREADY_EXISTS;
        }
        if (lowerMsg.contains("비밀번호") || lowerMsg.contains("password")) {
            return ErrorCode.INVALID_PASSWORD;
        }
        if (lowerMsg.contains("인증") || lowerMsg.contains("verify")) {
            return ErrorCode.EMAIL_NOT_VERIFIED;
        }
        return ErrorCode.INVALID_INPUT;
    }

    private ErrorCode determineGroupErrorCode(String message) {
        if (message == null) return ErrorCode.INTERNAL_ERROR;
        String lowerMsg = message.toLowerCase();

        if (lowerMsg.contains("찾을 수 없") || lowerMsg.contains("not found")) {
            return ErrorCode.GROUP_NOT_FOUND;
        }
        if (lowerMsg.contains("정원") || lowerMsg.contains("full")) {
            return ErrorCode.GROUP_FULL;
        }
        if (lowerMsg.contains("이미 가입") || lowerMsg.contains("already member")) {
            return ErrorCode.ALREADY_GROUP_MEMBER;
        }
        if (lowerMsg.contains("멤버가 아") || lowerMsg.contains("not member")) {
            return ErrorCode.NOT_GROUP_MEMBER;
        }
        if (lowerMsg.contains("관리자") || lowerMsg.contains("admin")) {
            return ErrorCode.NOT_GROUP_ADMIN;
        }
        return ErrorCode.INVALID_INPUT;
    }
}
