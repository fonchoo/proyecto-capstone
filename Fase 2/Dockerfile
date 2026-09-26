# ============================================================
# Dockerfile del FRONTEND (React + Vite) - Fase 2
# ============================================================
# MULTI-STAGE: dos etapas en el mismo Dockerfile.
#
#   Etapa 1 ("build"): usa Node para COMPILAR el proyecto.
#       npm run build -> genera la carpeta dist/ (estatica).
#   Etapa 2 (final):    NUNCA necesita Node. Solo copiamos el
#       dist/ compilado a una imagen nginx que lo sirve.
#
# Resultado: imagen FINAL liviana (solo nginx + archivos),
# sin Node ni dependencias de desarrollo adentro.

# ---------- ETAPA 1: compilar ----------
FROM node:22-alpine AS build

WORKDIR /app

# Copiamos solo los manifiestos primero: Docker cachea npm ci y,
# si package-lock.json no cambio, no reinstala en cada build.
COPY package.json package-lock.json ./
RUN npm ci

# Copiamos el resto del proyecto (lo que .dockerignore no excluyo).
COPY . .

# Compilamos a produccion (genera /app/dist).
RUN npm run build

# ---------- ETAPA 2: servir con nginx ----------
FROM nginx:alpine

# Reemplazamos la config por defecto de nginx por la nuestra
# (fallback de la SPA + gzip + cache de estaticos).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el dist compilado en la etapa 1 al directorio estatico.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx en primer plano (si no, el contenedor se cierra).
CMD ["nginx", "-g", "daemon off;"]