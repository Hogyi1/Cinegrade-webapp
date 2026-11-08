# ---- 1. Build lépés: az Angular appot statikus fájlokká fordítjuk ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ---- 2. Kiszolgálás: nginx adja ki a fájlokat és továbbítja az /api kéréseket ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/loginprojectapp/browser /usr/share/nginx/html
EXPOSE 80
