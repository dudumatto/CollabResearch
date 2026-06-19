# Build stage: uses Maven with Java 21 to compile the Spring Boot backend.
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy the full project so Maven can resolve the wrapper/config files and source tree.
COPY . .

# Production package used by Render. Tests can still be run locally outside Docker.
RUN mvn -B clean package -DskipTests

# Runtime stage: small Java 21 JRE image for running the generated jar.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Render injects PORT at runtime; Spring reads it through server.port=${PORT:8080}.
EXPOSE 8080

# The Maven build creates target/tcc-backend-0.0.1-SNAPSHOT.jar from pom.xml.
# The wildcard keeps the Dockerfile stable if the project version changes.
COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
