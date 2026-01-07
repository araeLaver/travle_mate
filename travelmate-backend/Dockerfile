FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn clean package -Dmaven.test.skip=true -B

FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="TravelMate Team"
LABEL version="1.0"
LABEL description="TravelMate Backend API Server"

RUN addgroup -S travelmate && adduser -S travelmate -G travelmate

RUN apk add --no-cache curl tini

WORKDIR /app

RUN mkdir -p /app/logs && \
    chown -R travelmate:travelmate /app

COPY --from=builder /app/target/*.jar app.jar

RUN chown travelmate:travelmate app.jar

USER travelmate

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -Dspring.jpa.open-in-view=false"

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=6 \
    CMD curl -f http://localhost:8080/api/health/live || exit 1

ENTRYPOINT ["tini", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
