package com.travelmate.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) 문서화 설정
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Bean
    public OpenAPI travelMateOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
            .info(apiInfo())
            .servers(servers())
            .tags(tags())
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT 인증 토큰을 입력하세요. 'Bearer ' 접두사는 자동으로 추가됩니다.")
                )
            );
    }

    private Info apiInfo() {
        return new Info()
            .title("TravelMate API")
            .description("""
                ## TravelMate 여행 메이트 API 문서

                TravelMate는 위치 기반 NFT 수집과 소셜 여행 기능을 제공하는 서비스입니다.

                ### 주요 기능
                - **인증**: JWT 기반 사용자 인증
                - **사용자**: 프로필 관리, 팔로우/팔로잉
                - **게시물**: 여행 게시물 CRUD, 좋아요, 댓글
                - **NFT**: 위치 기반 NFT 수집, Polygon 블록체인 민팅
                - **그룹**: 여행 그룹 생성 및 관리
                - **채팅**: 실시간 채팅 (WebSocket)
                - **알림**: 푸시 알림

                ### 인증
                대부분의 API는 JWT 토큰 인증이 필요합니다.
                1. `/auth/login` 엔드포인트로 로그인
                2. 응답에서 받은 `accessToken`을 `Authorization: Bearer {token}` 헤더에 포함

                ### 에러 응답
                모든 에러는 다음 형식으로 반환됩니다:
                ```json
                {
                  "timestamp": "2024-01-01T00:00:00",
                  "status": 400,
                  "error": "Bad Request",
                  "message": "에러 메시지",
                  "path": "/api/endpoint"
                }
                ```
                """)
            .version("1.0.0")
            .contact(new Contact()
                .name("TravelMate Team")
                .email("support@travelmate.app")
                .url("https://travelmate.app"))
            .license(new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT"));
    }

    private List<Server> servers() {
        if ("prod".equals(activeProfile)) {
            return List.of(
                new Server()
                    .url("https://api.travelmate.app/api")
                    .description("Production Server"),
                new Server()
                    .url("https://staging-api.travelmate.app/api")
                    .description("Staging Server")
            );
        }

        return List.of(
            new Server()
                .url("http://localhost:8080/api")
                .description("Local Development Server")
        );
    }

    private List<Tag> tags() {
        return List.of(
            new Tag().name("인증").description("사용자 인증 관련 API (로그인, 회원가입, 토큰 갱신)"),
            new Tag().name("사용자").description("사용자 프로필 및 계정 관리 API"),
            new Tag().name("팔로우").description("팔로우/팔로잉 관계 관리 API"),
            new Tag().name("게시물").description("여행 게시물 CRUD API"),
            new Tag().name("댓글").description("게시물 댓글 API"),
            new Tag().name("좋아요").description("게시물 좋아요 API"),
            new Tag().name("NFT 위치").description("NFT 수집 위치 관리 API"),
            new Tag().name("NFT 컬렉션").description("사용자 NFT 컬렉션 API"),
            new Tag().name("NFT 민팅").description("블록체인 NFT 민팅 API"),
            new Tag().name("리뷰").description("위치 리뷰 API"),
            new Tag().name("그룹").description("여행 그룹 관리 API"),
            new Tag().name("채팅").description("실시간 채팅 API"),
            new Tag().name("알림").description("푸시 알림 API"),
            new Tag().name("활동").description("사용자 활동 피드 API"),
            new Tag().name("북마크").description("북마크 관리 API"),
            new Tag().name("차단").description("사용자 차단 관리 API"),
            new Tag().name("파일").description("파일 업로드/다운로드 API"),
            new Tag().name("Itinerary").description("여행 일정 CRUD 및 협업 관리 API"),
            new Tag().name("헬스체크").description("서버 상태 확인 API"),
            new Tag().name("결제").description("토스페이먼츠 결제 연동 API")
        );
    }
}
