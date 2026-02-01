package com.travelmate.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 애플리케이션 에러 코드 정의
 * 클라이언트가 에러 유형을 식별하고 적절한 처리를 할 수 있도록 함
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통 에러 (1000-1999)
    INVALID_INPUT("C1001", "입력값이 유효하지 않습니다", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("C1002", "요청한 리소스를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("C1003", "인증이 필요합니다", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("C1004", "접근 권한이 없습니다", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED("C1005", "요청 한도를 초과했습니다", HttpStatus.TOO_MANY_REQUESTS),
    VALIDATION_FAILED("C1006", "입력 데이터 검증에 실패했습니다", HttpStatus.BAD_REQUEST),
    DUPLICATE_ACTION("C1007", "이미 수행한 작업입니다", HttpStatus.CONFLICT),

    // 사용자 관련 에러 (2000-2999)
    USER_NOT_FOUND("U2001", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS("U2002", "이미 존재하는 사용자입니다", HttpStatus.CONFLICT),
    INVALID_PASSWORD("U2003", "비밀번호가 일치하지 않습니다", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_VERIFIED("U2004", "이메일 인증이 필요합니다", HttpStatus.FORBIDDEN),
    INVALID_TOKEN("U2005", "유효하지 않은 토큰입니다", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("U2006", "토큰이 만료되었습니다", HttpStatus.UNAUTHORIZED),

    // 여행 그룹 관련 에러 (3000-3999)
    GROUP_NOT_FOUND("G3001", "여행 그룹을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    GROUP_FULL("G3002", "그룹 정원이 초과되었습니다", HttpStatus.CONFLICT),
    ALREADY_GROUP_MEMBER("G3003", "이미 그룹에 가입되어 있습니다", HttpStatus.CONFLICT),
    NOT_GROUP_MEMBER("G3004", "그룹 멤버가 아닙니다", HttpStatus.FORBIDDEN),
    NOT_GROUP_ADMIN("G3005", "그룹 관리자 권한이 필요합니다", HttpStatus.FORBIDDEN),

    // 채팅 관련 에러 (4000-4999)
    CHAT_ROOM_NOT_FOUND("CH4001", "채팅방을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    NOT_CHAT_PARTICIPANT("CH4002", "채팅 참여자가 아닙니다", HttpStatus.FORBIDDEN),
    MESSAGE_SEND_FAILED("CH4003", "메시지 전송에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),

    // NFT/블록체인 관련 에러 (5000-5999)
    LOCATION_NOT_FOUND("N5001", "수집 가능한 위치를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    ALREADY_COLLECTED("N5002", "이미 수집한 NFT입니다", HttpStatus.CONFLICT),
    GPS_VERIFICATION_FAILED("N5003", "위치 검증에 실패했습니다", HttpStatus.BAD_REQUEST),
    NFT_MINT_FAILED("N5004", "NFT 발행에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    WALLET_NOT_CONNECTED("N5005", "지갑 연결이 필요합니다", HttpStatus.BAD_REQUEST),
    INVALID_SIGNATURE("N5006", "유효하지 않은 서명입니다", HttpStatus.BAD_REQUEST),
    NFT_NOT_OWNER("N5007", "해당 NFT의 소유자가 아닙니다", HttpStatus.FORBIDDEN),
    NFT_TRANSFER_FAILED("N5008", "NFT 전송에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    BLOCKCHAIN_TX_FAILED("N5009", "블록체인 트랜잭션 전송에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),

    // 외부 서비스 관련 에러 (6000-6999)
    IPFS_UPLOAD_FAILED("E6001", "IPFS 업로드에 실패했습니다", HttpStatus.SERVICE_UNAVAILABLE),
    IPFS_TIMEOUT("E6002", "IPFS 서비스 응답 시간 초과", HttpStatus.GATEWAY_TIMEOUT),
    BLOCKCHAIN_ERROR("E6003", "블록체인 서비스 오류", HttpStatus.SERVICE_UNAVAILABLE),
    KAKAO_API_FAILED("E6004", "카카오 API 호출 실패", HttpStatus.SERVICE_UNAVAILABLE),
    EMAIL_SEND_FAILED("E6005", "이메일 전송에 실패했습니다", HttpStatus.SERVICE_UNAVAILABLE),
    PUSH_NOTIFICATION_FAILED("E6006", "푸시 알림 전송에 실패했습니다", HttpStatus.SERVICE_UNAVAILABLE),
    AI_RESPONSE_PARSE_FAILED("E6007", "AI 응답 파싱에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    AI_RESPONSE_FAILED("E6008", "AI 응답을 받지 못했습니다", HttpStatus.SERVICE_UNAVAILABLE),
    PAYMENT_APPROVAL_FAILED("E6009", "결제 승인에 실패했습니다", HttpStatus.BAD_GATEWAY),
    PAYMENT_REFUND_FAILED("E6010", "환불 처리에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),

    // 파일 관련 에러 (7000-7999)
    FILE_UPLOAD_FAILED("F7001", "파일 업로드에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_TOO_LARGE("F7002", "파일 크기가 제한을 초과했습니다", HttpStatus.PAYLOAD_TOO_LARGE),
    INVALID_FILE_TYPE("F7003", "지원하지 않는 파일 형식입니다", HttpStatus.BAD_REQUEST),
    FILE_NOT_FOUND("F7004", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    FILE_STORAGE_INIT_FAILED("F7005", "파일 저장소 초기화에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),

    // 추천 관련 에러 (8000-8999)
    RECOMMENDATION_FAILED("R8001", "추천 생성에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    LOCATION_REQUIRED("R8002", "위치 정보가 필요합니다", HttpStatus.BAD_REQUEST),

    // 서버 에러 (9000-9999)
    INTERNAL_ERROR("S9001", "서버 내부 오류가 발생했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    DATABASE_ERROR("S9002", "데이터베이스 오류가 발생했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    CACHE_ERROR("S9003", "캐시 처리 오류가 발생했습니다", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
