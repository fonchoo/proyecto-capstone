# --- Etapa 1: Compilación del frontend (Vite / React) ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Compila el proyecto para producción
RUN npm run build

# --- Etapa 2: Servidor Web Nginx para Producción ---
FROM nginx:alpine AS runner

# Copia los archivos estáticos de la compilación (output de Vite)
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx para manejar rutas SPA (fallback a index.html) + gzip + caché
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_types text/css application/javascript application/json image/svg+xml; \
    gzip_min_length 1024; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|svg|png|jpg|jpeg|gif|ico|woff2)$ { \
        expires 30d; \
        add_header Cache-Control "public, max-age=2592000"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
