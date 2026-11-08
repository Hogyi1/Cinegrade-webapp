# ---- 1. Build lépés: Maven lefordítja a jar fájlt ----
FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /app

# Először csak a pom.xml -> a függőségek letöltése cache-elődik,
# így ha csak a kód változik, nem tölti le őket újra
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- 2. Futtatási lépés: csak a JRE + a jar (kisebb, biztonságosabb image) ----
FROM eclipse-temurin:25-jre
WORKDIR /app

# Ne rootként fusson az alkalmazás
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build /app/target/*.jar app.jar
USER app

EXPOSE 8080

# A JVM a konténernek adott memória 75%-át használhatja
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
