# ============================================================
# Dockerfile del BACKEND (Express + pg)
# ============================================================
# Una sola etapa: imagen Node que corre la API.
# Nota: NO se copia .env a la imagen; las credenciales las setea
# Docker Compose como variables de entorno (docker-compose.prod.yml).

FROM node:22-alpine

WORKDIR /app

# Manifiestos primero (para aprovechar la caché de Docker).
COPY package.json package-lock.json ./

# Solo dependencias de PRODUCCIÓN (sin nodemon).
RUN npm ci --omit=dev

# Código de la API.
COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]