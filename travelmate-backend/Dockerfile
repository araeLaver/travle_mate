# 멀티 스테이지 빌드를 사용한 Spring Boot 애플리케이션 Dockerfile

# 1. 빌드 스테이지
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# pom.xml 복사 (의존성 캐싱을 위해)
COPY pom.xml .

# 의존성 다운로드 (캐시 활용)
RUN mvn dependency:go-offline -B

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드 (테스트 컴파일 및 실행 스킵)
RUN mvn clean package -Dmaven.test.skip=true -B

# 2. 실행 스테이지
FROM eclipse-temurin:17-jre-alpine

# 메타데이터 라벨
LABEL maintainer="TravelMate Team"
LABEL version="1.0"
LABEL description="TravelMate Backend API Server"

# 시스템 사용자 생성 (보안을 위해 non-root 사용자)
RUN addgroup -S travelmate && adduser -S travelmate -G travelmate

# 필요한 패키지 설치
RUN apk add --no-cache curl tini

# 작업 디렉토리 설정
WORKDIR /app

# 로그 디렉토리 생성
RUN mkdir -p /app/logs && \
    chown -R travelmate:travelmate /app

# 빌드 스테이지에서 JAR 파일 복사
COPY --from=builder /app/target/*.jar app.jar

# 파일 권한 설정
RUN chown travelmate:travelmate app.jar

# 사용자 변경
USER travelmate

# JVM 옵션 설정 (Koyeb 1GB 인스턴스용)
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication"

# Spring Profile 기본값 설정
ENV SPRING_PROFILES_ACTIVE=prod

# 포트 노출
EXPOSE 8080

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/management/health || exit 1

# tini를 통한 안전한 프로세스 관리
ENTRYPOINT ["tini", "--"]

# 애플리케이션 실행
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]