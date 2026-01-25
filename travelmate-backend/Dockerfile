FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn clean package -Dmaven.test.skip=true -B

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

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseSerialGC -XX:MaxMetaspaceSize=256m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError -Dspring.jpa.open-in-view=false -Dfile.encoding=UTF-8"

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
