FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Separate dependency download for layer caching:
# Only re-downloads deps when pom.xml changes, not on every src change.
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

COPY src src
RUN mvn clean package -Dmaven.test.skip=true -B --no-transfer-progress

FROM eclipse-temurin:17-jre

LABEL maintainer="Fryndo Team"
LABEL version="1.0"
LABEL description="Fryndo Backend API Server"

RUN groupadd --system travelmate && \
    useradd --system --gid travelmate --home-dir /app --shell /usr/sbin/nologin travelmate

# redis-server: 단일 무료 인스턴스 제약으로 토큰 저장소용 Redis를 컨테이너에 내장 (127.0.0.1 전용)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl tini redis-server && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app/logs && \
    chown -R travelmate:travelmate /app

COPY --from=builder /app/target/*.jar app.jar

RUN chown travelmate:travelmate app.jar

USER travelmate

# Production JVM settings:
# - MaxRAMPercentage: 컨테이너 메모리 제한의 75%를 힙으로 사용 (k8s limits에 자동 적응)
# - UseSerialGC: 소형 컨테이너 (< 2 CPU / 1 GB RAM) 에 적합
# 512MB 인스턴스에 JVM+내장 Redis 동거: 힙 40% + 메타스페이스/코드캐시/스택 축소로 cgroup 메모리 압박(수 분짜리 스톨) 방지
ENV JAVA_OPTS="-XX:MaxRAMPercentage=40.0 -XX:InitialRAMPercentage=30.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=48m -Xss512k -XX:+ExitOnOutOfMemoryError -Dspring.jpa.open-in-view=false -Dfile.encoding=UTF-8 -Dserver.tomcat.threads.max=8"

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["tini", "--"]

# redis는 daemonize 대신 &백그라운드로 실행: /var/run pidfile 권한 문제 회피 + 로그가 컨테이너 stdout에 남음
CMD ["sh", "-c", "redis-server --bind 127.0.0.1 --port 6379 --maxmemory 24mb --maxmemory-policy allkeys-lru --save '' --appendonly no & java $JAVA_OPTS -jar app.jar"]
