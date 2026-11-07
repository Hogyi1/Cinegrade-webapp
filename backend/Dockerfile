# Build lépés
#FROM openjdk:21
#WORKDIR /app
#COPY . .
#RUN mvn clean package -DskipTests

# Futtatási lépés
#FROM eclipse-temurin:21-jdk
#WORKDIR /app
#COPY --from=build /app/target/*.jar app.jar
#ENTRYPOINT ["java", "-jar", "app.jar"]


# Alap kép
FROM openjdk:21

# Munkakönyvtár beállítása
WORKDIR /app

# JAR fájl másolása
COPY ./target/loginproject-0.0.1-SNAPSHOT.jar /app/app.jar

# Port kitettsége
EXPOSE 8080

# A JAR fájl futtatása
CMD ["java", "-jar", "app.jar"]
