# Multi-stage build for coding interview platform
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend

# Build all packages
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files for production install
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Install production dependencies only
RUN npm ci --production

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Copy Prisma schema and migrations
COPY packages/backend/prisma ./packages/backend/prisma

# Generate Prisma Client
RUN cd packages/backend && npx prisma generate

# Expose port (Render uses PORT env var, defaults to 10000)
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=10000

# Start the backend server (which will serve the frontend)
CMD ["node", "packages/backend/dist/index.js"]
