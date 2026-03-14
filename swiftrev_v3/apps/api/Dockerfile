# Build stage
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy root monorepo files
COPY package*.json ./
COPY turbo.json ./

# Copy packages and apps (you might want to be more selective here)
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm ci

# Build the api app
RUN npx turbo run build --filter=api

# Production stage
FROM node:20-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/package*.json ./apps/api/

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "apps/api/dist/main"]
