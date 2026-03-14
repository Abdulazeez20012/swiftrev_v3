# Build stage
FROM node:20-slim

WORKDIR /usr/src/app

# Copy root monorepo files
COPY package*.json ./
COPY turbo.json ./

# Copy packages and mobile app
COPY packages/ ./packages/
COPY apps/mobile/ ./apps/mobile/

# Install dependencies
RUN npm ci

WORKDIR /usr/src/app/apps/mobile

EXPOSE 8081

# Start Expo in web mode
CMD ["npm", "run", "web"]
