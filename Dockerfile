# Production Dockerfile for TV Channel Monitoring System
FROM node:20-alpine

# Install FFmpeg and required media tools for Linux container encoding & clipping
RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm install --production=false

# Copy application source
COPY . .

# Build Vite frontend and Bundle CommonJS Express Server via esbuild
RUN npm run build

# Expose production port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start compiled server
CMD ["npm", "start"]
