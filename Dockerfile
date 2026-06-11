# ==========================================
# 1. Frontend Build Stage
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY travelmate-web/package*.json ./
RUN npm ci --legacy-peer-deps

COPY travelmate-web/ ./
# 빌드 시 필요한 환경 변수 (통합 배포이므로 API URL은 상대 경로 사용 가능)
ENV REACT_APP_API_URL=/api
ENV REACT_APP_WS_URL=/ws

RUN npm run build

# ==========================================
# 2. Backend Build Stage
# ==========================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app/backend

# 캐싱을 위한 의존성 먼저 복사
COPY travelmate-backend/pom.xml ./
RUN mvn dependency:go-offline -B

# 전체 소스 복사
COPY travelmate-backend/ ./

# 프론트엔드 빌드 결과물을 백엔드 정적 리소스 폴더로 복사
COPY --from=frontend-build /app/frontend/build/ ./src/main/resources/static/

# 백엔드 빌드 (테스트 제외)
RUN mvn clean package -Dmaven.test.skip=true -B

# ==========================================
# 3. Final Runtime Stage
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 보안을 위해 비루트 사용자 생성
RUN addgroup -S travelmate && adduser -S travelmate -G travelmate
RUN apk add --no-cache curl tini

COPY --from=backend-build /app/backend/target/*.jar app.jar
RUN chown travelmate:travelmate app.jar

USER travelmate

# 메모리 최적화 설정 (Fly.io 무료 티어 512MB RAM 환경)
# - Xmx256m: 힙 메모리를 256MB로 제한 (OS 및 기타 영역을 위해 절반 확보)
# - XX:MaxMetaspaceSize=128m: 클래스 메타데이터 영역 제한
# - XX:+UseSerialGC: 단일 CPU 환경에서 메모리 절약형 GC 사용
ENV JAVA_OPTS="-Xms256m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -Xss256k -Dfile.encoding=UTF-8"

EXPOSE 8080

ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
