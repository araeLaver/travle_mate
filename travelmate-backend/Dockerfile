FROM maven:3-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Separate dependency download for layer caching:
# Only re-downloads deps when pom.xml changes, not on every src change.
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

COPY src src
RUN mvn clean package -Dmaven.test.skip=true -B --no-transfer-progress

FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="Fryndo Team"
LABEL version="1.0"
LABEL description="Fryndo Backend API Server"

RUN addgroup -S travelmate && adduser -S travelmate -G travelmate

RUN apk add --no-cache curl tini

WORKDIR /app

RUN mkdir -p /app/logs && \
    chown -R travelmate:travelmate /app

COPY --from=builder /app/target/*.jar app.jar

RUN chown travelmate:travelmate app.jar

USER travelmate

# Production JVM settings:
# - Removed -XX:TieredStopAtLevel=1 (limits JIT to C1 only -> hurts throughput in prod)
# - UseSerialGC is appropriate for small containers (< 2 CPU / 1 GB RAM)
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseSerialGC -XX:MaxMetaspaceSize=192m -XX:ReservedCodeCacheSize=64m -XX:+ExitOnOutOfMemoryError -Dspring.jpa.open-in-view=false -Dfile.encoding=UTF-8"

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
