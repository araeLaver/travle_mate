package com.travelmate.exception;

import com.travelmate.dto.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GlobalExceptionHandler 테스트")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("BusinessException 문자열 에러 코드를 응답에 보존한다")
    void handleBusinessException_PreservesStringErrorCode() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/matching/requests");

        ResponseEntity<ErrorResponse> response = handler.handleBusinessException(
                BusinessException.forbidden("차단 관계인 사용자에게는 매칭 요청을 보낼 수 없습니다."),
                new ServletWebRequest(request)
        );

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("FORBIDDEN");
        assertThat(response.getBody().getStatus()).isEqualTo(403);
        assertThat(response.getBody().getPath()).isEqualTo("/matching/requests");
    }

    @Test
    @DisplayName("IllegalStateException을 500 대신 400 입력 오류로 반환한다")
    void handleIllegalStateException_ReturnsBadRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/marketplace/listings");

        ResponseEntity<ErrorResponse> response = handler.handleIllegalStateException(
                new IllegalStateException("이미 판매 중인 NFT입니다"),
                new ServletWebRequest(request)
        );

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("C1001");
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).isEqualTo("이미 판매 중인 NFT입니다");
    }
}
