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

# Az ffprobe ellenőrzi a feltöltött képeket
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

# A feltöltések mappája: az "app" felhasználónak kell tudnia írni
RUN mkdir -p /app/uploads && chown app:app /app/uploads
COPY --from=build /app/target/*.jar app.jar
USER app

EXPOSE 8080

# [AI-GENERATED] Hungarian time, so LocalDateTime.now() matches the IntelliJ backend and the users.
ENV TZ=Europe/Budapest
# A JVM a konténernek adott memória 75%-át használhatja
# [AI-GENERATED] user.timezone: same Hungarian time for the JVM, whatever the host says.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=Europe/Budapest"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
