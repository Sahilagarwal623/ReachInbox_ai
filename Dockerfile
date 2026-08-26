# ==========================================
# Stage 1: Build Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src/
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED 1
# This ensures it produces a standalone build based on next.config.js output: 'standalone'
RUN npm run build

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:20-alpine AS runner

# Install necessary OS tools (for PostgreSQL client tools, etc., though not strictly required unless debugging)
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# --- Setup Backend ---
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./dist
# Copy the generated prisma client
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma

# --- Setup Frontend ---
WORKDIR /app/frontend
# Copy the standalone output from Next.js build
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# --- Copy Start Script ---
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# Expose both backend (4000) and frontend (3000)
EXPOSE 3000 4000

# Start both services
CMD ["./start.sh"]
