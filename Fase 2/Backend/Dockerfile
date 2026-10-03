# ============================================================
# Dockerfile del BACKEND (Express + pg)
# ============================================================
# Una sola etapa: imagen Node que corre la API.
# NO hay etapa de compilacion: el proyecto es JS puro, no hay build.
#
# Nota: NO se copia .env a la imagen (.dockerignore); las
# credenciales las setea Docker Compose como variables de entorno
# (ver docker-compose.yml).

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Manifiestos primero: Docker cachea npm ci y no reinstala si el
# lockfile no cambio.
COPY package.json package-lock.json ./

# Solo dependencias de PRODUCCION (sin nodemon).
# "npm cache clean" va en el MISMO RUN: si fuera en otro, la cache
# (/root/.npm) quedaria horneada en la capa anterior y la imagen
# pesaria lo mismo.
RUN npm ci --omit=dev && npm cache clean --force

# Codigo de la API.
COPY src ./src

# No correr como root.
USER node

EXPOSE 3000

CMD ["node", "src/index.js"]
