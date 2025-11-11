# Usar Node.js LTS Alpine para imagen más pequeña
FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache wget curl

# Crear directorio de trabajo
WORKDIR /app

# Copiar todos los archivos del proyecto
COPY . .

# Instalar dependencias
RUN npm install --only=production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Cambiar al usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 8003

# Healthcheck para Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8003/api/v1/emails/health || exit 1

# Comando de inicio
CMD ["npm", "start"]