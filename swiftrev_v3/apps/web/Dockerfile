# Build stage
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy root monorepo files
COPY package*.json ./
COPY turbo.json ./

# Copy packages and web app
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN npm ci

# Build the web app
RUN npx turbo run build --filter=web

# Production stage (using a simple node server or static serving)
# For dev context in compose, we might just use the builder or a slim image
FROM node:20-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/web ./apps/web
COPY --from=builder /usr/src/app/packages ./packages

WORKDIR /usr/src/app/apps/web

EXPOSE 5173

# Start Vite dev server (mapping to 0.0.0.0 for docker access)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
