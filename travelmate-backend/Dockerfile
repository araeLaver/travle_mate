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

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl tini && \
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
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=192m -XX:ReservedCodeCacheSize=64m -XX:+ExitOnOutOfMemoryError -Dspring.jpa.open-in-view=false -Dfile.encoding=UTF-8"

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
